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
//	@Slug			string   "Slug of the movie"  validate:"required,min=3,max=100"
//	@Title			string   "Title of the movie"  validate:"required,min=3,max=100"
//	@Description	string   "Description of the movie" validate:"required,min=5,max=500"
//	@Duration		int64   "Duration of the movie"  validate:"required,gte=1"
//	@ReleaseDate	string   "Release date of the movie" validate:"required,datetime=2006-01-02"`
type CreateMoviePayload struct {
	Slug        string `json:"slug" validate:"required,min=3,max=100"`
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
//	@Param			slug			formData	string	true	"Movie slug"
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
		Slug:        r.FormValue("slug"),
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
		Slug:        payload.Slug,
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
//	@Description	Fetches a movie by ID or Slug
//	@Tags			movies
//	@Accept			json
//	@Produce		json
//	@Param			id	path		string	true	"Movie ID or Slug"
//	@Success		200	{object}	store.Movie
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Router			/movies/{id} [get]
func (app *application) getMovieHandler(w http.ResponseWriter, r *http.Request) {
	movie := getMovieFromCtx(r)

	url, err := app.s3.GetOne(movie.PosterUrl)
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
		url, err := app.s3.GetOne(movies[i].PosterUrl)
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
//	@Slug			string   "Slug of the movie"  validate:"omitempty,min=3,max=100"
//	@Title			string   "Title of the movie"  validate:"omitempty,min=3,max=100"
//	@Description	string   "Description of the movie" validate:"omitempty,min=5,max=500"
//	@Duration		int64   "Duration of the movie"  validate:"omitempty,gte=1"
//	@ReleaseDate	string   "Release date of the movie" validate:"omitempty,datetime=2006-01-02"`
type UpdateMoviePayload struct {
	Slug        *string `json:"slug" validate:"omitempty,min=3,max=100"`
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
//	@Accept			multipart/form-data
//	@Produce		json
//	@Param			id				path		int		true	"Movie ID"
//	@Param			slug			formData	string	false	"Movie slug"
//	@Param			title			formData	string	false	"Movie title"
//	@Param			description		formData	string	false	"Movie description"
//	@Param			duration		formData	int		false	"Movie duration"
//	@Param			release_date	formData	string	false	"Movie release date (YYYY-MM-DD)"
//	@Param			file			formData	file	false	"New poster file"
//	@Success		200				{object}	store.Movie
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/movies/{id} [patch]
func (app *application) updateMovieHandler(w http.ResponseWriter, r *http.Request) {
	movie := getMovieFromCtx(r)

	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("не вдалося розпарсити форму: %w", err))
		return
	}

	slug := r.FormValue("slug")
	title := r.FormValue("title")
	description := r.FormValue("description")
	durationStr := r.FormValue("duration")
	releaseDate := r.FormValue("release_date")

	if slug != "" {
		movie.Slug = slug
	}
	if title != "" {
		movie.Title = title
	}
	if description != "" {
		movie.Description = description
	}
	if releaseDate != "" {
		movie.ReleaseDate = releaseDate
	}
	if durationStr != "" {
		duration, err := strconv.Atoi(durationStr)
		if err != nil {
			app.badRequestResponse(w, r, err)
			return
		}
		movie.Duration = int64(duration)
	}

	file, fileHeader, err := r.FormFile("file")
	if err == nil {
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

		objectID, err := app.s3.CreateOne(r.Context(), fileData)
		if err != nil {
			app.internalServerError(w, r, err)
			return
		}

		movie.PosterUrl = objectID
	} else if !errors.Is(err, http.ErrMissingFile) {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(movie); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()
	if err := app.store.Movies.Update(ctx, movie); err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
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
		ctx := r.Context()

		idParam := chi.URLParam(r, "movieID")
		id, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil {
			movie, err := app.store.Movies.GetBySlug(ctx, idParam)
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
			return
		}

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
