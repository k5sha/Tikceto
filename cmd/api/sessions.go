package main

import (
	"context"
	"errors"
	"fmt"
	"github.com/go-chi/chi/v5"
	"github.com/k5sha/Tikceto/internal/store"
	"net/http"
	"strconv"
)

type sessionKey string

const sessionCtx sessionKey = "session"

// TODO: check unique

// CreateSessionPayload represents the payload for creating a session.
//
//	@MovieID	int64   "Movie ID for the session" validate:"required,gte=1"`
//	@RoomID		int64   "Room ID for the session" validate:"required,gte=1"`
//	@StartTime	date-time   "Start time of the session (timestamp)" validate:"required,datetime=2006-01-02 15:04:05"`
//	@Price		float64 "Price of the session ticket" validate:"required,gte=0"`
type CreateSessionPayload struct {
	MovieID   int64   `json:"movie_id" validate:"required,gte=1"`
	RoomID    int64   `json:"room_id" validate:"required,gte=1"`
	StartTime string  `json:"start_time" validate:"required,datetime=2006-01-02 15:04:05"`
	Price     float64 `json:"price" validate:"required,gte=0"`
}

// CreateSession godoc
//
//	@Summary		Creates a session
//	@Description	Creates a session
//	@Tags			sessions
//	@Accept			json
//	@Produce		json
//	@Param			payload	body		CreateSessionPayload	true	"Session payload"
//	@Success		201		{object}	store.Session
//	@Failure		400		{object}	error
//	@Failure		401		{object}	error
//	@Failure		500		{object}	error
//	@Security		ApiKeyAuth
//	@Router			/sessions [post]
func (app *application) createSessionHandler(w http.ResponseWriter, r *http.Request) {
	var payload CreateSessionPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	room, err := app.store.Rooms.GetByID(ctx, payload.RoomID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	movie, err := app.store.Movies.GetByID(ctx, payload.MovieID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	session := &store.Session{
		MovieID:   movie.ID,
		RoomID:    room.ID,
		StartTime: payload.StartTime,
		Price:     payload.Price,
		Movie:     *movie,
		Room:      *room,
	}

	if err := app.store.Sessions.Create(ctx, session); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusCreated, session); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// GetSession godoc
//
//	@Summary		Fetches a session
//	@Description	Fetches a session by ID
//	@Tags			sessions
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"Session ID"
//	@Success		200	{object}	store.SessionWithoutMovie
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Router			/sessions/{id} [get]
func (app *application) getSessionHandler(w http.ResponseWriter, r *http.Request) {
	session := getSessionFromCtx(r)

	if err := app.jsonResponse(w, http.StatusOK, session); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// GetSessionsByMovieID godoc
//
//	@Summary		Fetches all sessions for a given movie
//	@Description	Fetches all sessions by movie ID
//	@Tags			sessions
//	@Accept			json
//	@Produce		json
//	@Param			movieID	path		int	true	"Movie ID"
//	@Success		200		{array}		store.Session
//	@Failure		400		{object}	error
//	@Failure		404		{object}	error
//	@Failure		500		{object}	error
//	@Router			/sessions/movie/{movieID} [get]
func (app *application) getSessionsByMovieHandler(w http.ResponseWriter, r *http.Request) {
	movieIDParam := chi.URLParam(r, "movieID")
	movieID, err := strconv.ParseInt(movieIDParam, 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("invalid movie ID"))
		return
	}

	ctx := r.Context()

	sessions, err := app.store.Sessions.GetByMovieID(ctx, movieID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, sessions); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// UpdateSessionPayload represents the payload for updating a session.
//
//	@MovieID	int64   "Updated movie ID for the session" validate:"omitempty,gte=1"`
//	@RoomID		int64   "Updated room ID for the session" validate:"omitempty,gte=1"`
//	@StartTime	date-time   "Updated start time of the session" validate:"omitempty,datetime=2006-01-02 15:04:05"`
//	@Price		float64 "Updated price of the session" validate:"omitempty,gte=0"`
type UpdateSessionPayload struct {
	MovieID   *int64   `json:"movie_id" validate:"omitempty,gte=1"`
	RoomID    *int64   `json:"room_id" validate:"omitempty,gte=1"`
	StartTime *string  `json:"start_time" validate:"omitempty,datetime=2006-01-02 15:04:05"`
	Price     *float64 `json:"price" validate:"omitempty,gte=0"`
}

// UpdateSession godoc
//
//	@Summary		Updates a session
//	@Description	Updates a session by ID
//	@Tags			sessions
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int						true	"Session ID"
//	@Param			payload	body		UpdateSessionPayload	true	"Session payload"
//	@Success		200		{object}	store.Session
//	@Failure		400		{object}	error
//	@Failure		401		{object}	error
//	@Failure		404		{object}	error
//	@Failure		500		{object}	error
//	@Security		ApiKeyAuth
//	@Router			/sessions/{id} [patch]
func (app *application) updateSessionHandler(w http.ResponseWriter, r *http.Request) {
	session := getSessionFromCtx(r)

	var payload UpdateSessionPayload

	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	// TODO: if payload.MovieID == session.MovieID

	if payload.MovieID != nil {
		movie, err := app.store.Movies.GetByID(ctx, *payload.MovieID)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				app.notFoundResponse(w, r, err)
				return
			}
			app.internalServerError(w, r, err)
			return
		}
		session.MovieID = movie.ID
	}
	if payload.RoomID != nil {
		room, err := app.store.Rooms.GetByID(ctx, *payload.RoomID)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				app.notFoundResponse(w, r, err)
				return
			}
			app.internalServerError(w, r, err)
			return
		}
		session.RoomID = room.ID
	}
	if payload.StartTime != nil {
		session.StartTime = *payload.StartTime
	}
	if payload.Price != nil {
		session.Price = *payload.Price
	}

	if err := app.store.Sessions.Update(r.Context(), session); err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, session); err != nil {
		app.internalServerError(w, r, err)
		return
	}

}

// DeleteSession godoc
//
//	@Summary		Deletes a session
//	@Description	Delete a session by ID
//	@Tags			sessions
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"Session ID"
//	@Success		204	{object}	string
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Security		ApiKeyAuth
//	@Router			/sessions/{id} [delete]
func (app *application) deleteSessionHandler(w http.ResponseWriter, r *http.Request) {
	session := getSessionFromCtx(r)

	ctx := r.Context()
	if err := app.store.Sessions.Delete(ctx, session.ID); err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	if err := writeJSON(w, http.StatusNoContent, nil); err != nil {
		app.internalServerError(w, r, err)
		return
	}

}

func (app *application) sessionsContextMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		idParam := chi.URLParam(r, "sessionID")
		id, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil {
			app.badRequestResponse(w, r, fmt.Errorf("must provide a correct id"))
			return
		}
		ctx := r.Context()

		session, err := app.store.Sessions.GetByID(ctx, id)
		if err != nil {
			switch {
			case errors.Is(err, store.ErrNotFound):
				app.notFoundResponse(w, r, err)
			default:
				app.internalServerError(w, r, err)
			}
			return
		}

		ctx = context.WithValue(ctx, sessionCtx, session)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func getSessionFromCtx(r *http.Request) *store.Session {
	session, _ := r.Context().Value(sessionCtx).(*store.Session)
	return session
}
