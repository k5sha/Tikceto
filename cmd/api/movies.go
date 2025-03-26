package main

import (
	"context"
	"errors"
	"fmt"
	"github.com/go-chi/chi/v5"
	"github.com/k5sha/Tikceto/internal/s3"
	"github.com/k5sha/Tikceto/internal/store"
	"io"
	"net/http"
	"strconv"
)

type movieKey string

const movieCtx movieKey = "movie"

// CreateMoviePayload represents the payload for creating a movie.
//
//	@Title			string   "Title of the movie"  validate:"required,min=3,max=100"
//	@Description	string   "Description of the movie" validate:"required,min=5,max=500"
//	@Duration		int64   "Duration of the movie"  validate:"required,gte=1"
//	@ReleaseDate	string   "Release date of the movie" validate:"required,datetime=2006-01-02"`
type CreateMoviePayload struct {
	Title       string `json:"title" validate:"required,min=3,max=100"`
	Description string `json:"description" validate:"required,min=5,max=500"`
	Duration    int64  `json:"duration" validate:"required,gte=1"`
	ReleaseDate string `json:"release_date"  validate:"required,datetime=2006-01-02"`
}

// CreateMovie godoc
//
//	@Summary		Creates a movie
//	@Description	Creates a movie
//	@Tags			movies
//	@Accept			multipart/form-data
//	@Produce		json
//	@Param			file			formData	file	true	"Movie poster file"
//	@Param			title			formData	string	true	"Movie title"
//	@Param			description		formData	string	true	"Movie description"
//	@Param			duration		formData	int		true	"Movie duration in minutes"
//	@Param			release_date	formData	string	true	"Movie release date (YYYY-MM-DD)"
//	@Success		201				{object}	store.Movie
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/movies [post]
func (app *application) createMovieHandler(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(10 << 20) // 10MB max upload size
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// TODO: rename post url to object id or something like it
	file, fileHeader, err := r.FormFile("file")
	if err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("file is required"))
		return
	}
	defer file.Close()

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	fileData := s3.FileDataType{
		FileName: fileHeader.Filename,
		Data:     fileBytes,
	}
	ctx := r.Context()

	objectID, err := app.s3.CreateOne(ctx, fileData)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	payload := CreateMoviePayload{
		Title:       r.FormValue("title"),
		Description: r.FormValue("description"),
		Duration:    0,
		ReleaseDate: r.FormValue("release_date"),
	}

	durationStr := r.FormValue("duration")
	duration, err := strconv.Atoi(durationStr)
	if err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("invalid duration format"))
		return
	}
	payload.Duration = int64(duration)

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	movie := &store.Movie{
		Title:       payload.Title,
		Description: payload.Description,
		Duration:    payload.Duration,
		ReleaseDate: payload.ReleaseDate,
		PosterUrl:   objectID,
	}

	if err := app.store.Movies.Create(ctx, movie); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusCreated, movie); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// GetMovie godoc
//
//	@Summary		Fetches a movie
//	@Description	Fetches a movie by ID
//	@Tags			movies
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"Movie ID"
//	@Success		200	{object}	store.Movie
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Router			/movies/{id} [get]
func (app *application) getMovieHandler(w http.ResponseWriter, r *http.Request) {
	movie := getMovieFromCtx(r)

	ctx := r.Context()

	url, err := app.s3.GetOne(ctx, movie.PosterUrl)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	movie.PosterUrl = url

	if err := app.jsonResponse(w, http.StatusOK, movie); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// getMoviesHandler godoc
//
//	@Summary		Fetches movies list
//	@Description	Fetches the movies list with optional filters
//	@Tags			movies
//	@Accept			json
//	@Produce		json
//	@Param			since	query		string	false	"Since date (YYYY-MM-DD)"
//	@Param			until	query		string	false	"Until date (YYYY-MM-DD)"
//	@Param			limit	query		int		false	"Limit"
//	@Param			offset	query		int		false	"Offset"
//	@Param			sort	query		string	false	"Sort order (asc|desc)"
//	@Param			search	query		string	false	"Search by title or description"
//	@Success		200		{object}	[]store.Movie
//	@Failure		400		{object}	error
//	@Failure		500		{object}	error
//	@Router			/movies [get]
func (app *application) getMoviesHandler(w http.ResponseWriter, r *http.Request) {
	pq := store.PaginatedMoviesQuery{
		Limit:  10,
		Offset: 0,
		Sort:   "desc",
	}

	pq, err := pq.Parse(r)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(pq); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	movies, err := app.store.Movies.GetMoviesList(ctx, pq)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// TODO: get many make
	for i := range movies {
		url, err := app.s3.GetOne(ctx, movies[i].PosterUrl)
		if err != nil {
			app.internalServerError(w, r, err)
			return
		}

		movies[i].PosterUrl = url
	}

	if err := app.jsonResponse(w, http.StatusOK, movies); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// UpdateMoviePayload represents the payload for updating a movie.
//
//	@Title			string   "Title of the movie"  validate:"omitempty,min=3,max=100"
//	@Description	string   "Description of the movie" validate:"omitempty,min=5,max=500"
//	@Duration		int64   "Duration of the movie"  validate:"omitempty,gte=1"
//	@ReleaseDate	string   "Release date of the movie" validate:"omitempty,datetime=2006-01-02"`
type UpdateMoviePayload struct {
	Title       *string `json:"title" validate:"omitempty,min=3,max=100"`
	Description *string `json:"description" validate:"omitempty,min=5,max=500"`
	Duration    *int64  `json:"duration" validate:"omitempty,gte=1"`
	ReleaseDate *string `json:"release_date"  validate:"omitempty,datetime=2006-01-02"`
}

// UpdateMovie godoc
//
//	@Summary		Updates a movie
//	@Description	Updates a movie by ID
//	@Tags			movies
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int					true	"Movie ID"
//	@Param			payload	body		UpdateMoviePayload	true	"Movie payload"
//	@Success		200		{object}	store.Movie
//	@Failure		400		{object}	error
//	@Failure		401		{object}	error
//	@Failure		404		{object}	error
//	@Failure		500		{object}	error
//	@Security		ApiKeyAuth
//	@Router			/movies/{id} [patch]
func (app *application) updateMovieHandler(w http.ResponseWriter, r *http.Request) {
	movie := getMovieFromCtx(r)

	var payload UpdateMoviePayload

	// TODO: add update of poster
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if payload.Title != nil {
		movie.Title = *payload.Title
	}
	if payload.Description != nil {
		movie.Description = *payload.Description
	}
	if payload.Duration != nil {
		movie.Duration = *payload.Duration
	}
	if payload.ReleaseDate != nil {
		movie.ReleaseDate = *payload.ReleaseDate
	}

	if err := app.store.Movies.Update(r.Context(), movie); err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, movie); err != nil {
		app.internalServerError(w, r, err)
		return
	}

}

// DeleteMovie godoc
//
//	@Summary		Deletes a movie
//	@Description	Delete a movie by ID
//	@Tags			movies
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"Movie ID"
//	@Success		204	{object}	string
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Security		ApiKeyAuth
//	@Router			/movies/{id} [delete]
func (app *application) deleteMovieHandler(w http.ResponseWriter, r *http.Request) {
	movie := getMovieFromCtx(r)

	ctx := r.Context()
	if err := app.store.Movies.Delete(ctx, movie.ID); err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	if err := app.s3.DeleteOne(ctx, movie.PosterUrl); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := writeJSON(w, http.StatusNoContent, nil); err != nil {
		app.internalServerError(w, r, err)
		return
	}

}

func (app *application) moviesContextMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		idParam := chi.URLParam(r, "movieID")
		id, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil {
			app.badRequestResponse(w, r, fmt.Errorf("must provide a correct id"))
			return
		}
		ctx := r.Context()

		movie, err := app.store.Movies.GetByID(ctx, id)
		if err != nil {
			switch {
			case errors.Is(err, store.ErrNotFound):
				app.notFoundResponse(w, r, err)
			default:
				app.internalServerError(w, r, err)
			}
			return
		}

		ctx = context.WithValue(ctx, movieCtx, movie)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func getMovieFromCtx(r *http.Request) *store.Movie {
	movie, _ := r.Context().Value(movieCtx).(*store.Movie)
	return movie
}
