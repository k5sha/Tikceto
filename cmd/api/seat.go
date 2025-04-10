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

type seatKey string

const seatCtx seatKey = "seat"

// CreateSeatPayload represents the payload for creating a seat.
//
//	@RoomID	int64  "Room ID where the seat is located" validate:"required,gte=1"
//	@Row	int    "Row number of the seat" validate:"required,gte=1"
//	@Number	int    "Seat number in the row" validate:"required,gte=1"
type CreateSeatPayload struct {
	RoomID int64 `json:"room_id" validate:"required,gte=1"`
	Row    int64 `json:"row" validate:"required,gte=1"`
	Number int64 `json:"number" validate:"required,gte=1"`
}

// CreateSeat godoc
//
//	@Summary		Creates a seat
//	@Description	Creates a seat in a specified room
//	@Tags			seats
//	@Accept			json
//	@Produce		json
//	@Param			payload	body		CreateSeatPayload	true	"Seat payload"
//	@Success		201		{object}	store.Seat
//	@Failure		400		{object}	error
//	@Failure		401		{object}	error
//	@Failure		500		{object}	error
//	@Security		ApiKeyAuth
//	@Router			/seats [post]
func (app *application) createSeatHandler(w http.ResponseWriter, r *http.Request) {
	var payload CreateSeatPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	data, err := app.store.Rooms.GetWithSeatsCountByID(ctx, payload.RoomID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	if data.SeatsCount >= data.Room.Capacity {
		app.badRequestResponse(w, r, fmt.Errorf("room capacity exceeded"))
		return
	}

	seat := &store.Seat{
		RoomID: data.Room.ID,
		Row:    payload.Row,
		Number: payload.Number,
	}

	if err := app.store.Seats.Create(ctx, seat); err != nil {
		if errors.Is(err, store.ErrDuplicateSeat) {
			app.badRequestResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusCreated, seat); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// GetSeat godoc
//
//	@Summary		Fetches a seat
//	@Description	Fetches a seat by ID
//	@Tags			seats
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"Seat ID"
//	@Success		200	{object}	store.Seat
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Router			/seats/{id} [get]
func (app *application) getSeatHandler(w http.ResponseWriter, r *http.Request) {
	seat := getSeatFromCtx(r)

	if err := app.jsonResponse(w, http.StatusOK, seat); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// GetSeatsBySession godoc
//
//	@Summary		Fetch seats by session
//	@Description	Fetches all seats for a specific session by session ID
//	@Tags			seats
//	@Accept			json
//	@Produce		json
//	@Param			sessionID	path		int						true	"Session ID"
//	@Success		200			{array}		store.SeatWithMetadata	"List of seats"
//	@Failure		400			{object}	error					"Invalid session ID"
//	@Failure		404			{object}	error					"No seats found for this session"
//	@Failure		500			{object}	error					"Internal Server Error"
//	@Router			/seats/session/{sessionID} [get]
func (app *application) getSeatsBySessionHandler(w http.ResponseWriter, r *http.Request) {
	sessionIDParam := chi.URLParam(r, "sessionID")
	sessionID, err := strconv.ParseInt(sessionIDParam, 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("invalid session ID"))
		return
	}

	ctx := r.Context()
	seats, err := app.store.Seats.GetBySession(ctx, sessionID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, seats); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// UpdateSeatPayload represents the payload for updating a seat.
//
//	@Row	int "Updated row number" validate:"omitempty,gte=1"
//	@Number	int "Updated seat number" validate:"omitempty,gte=1"
type UpdateSeatPayload struct {
	Row    *int64 `json:"row" validate:"omitempty,gte=1"`
	Number *int64 `json:"seat_number" validate:"omitempty,gte=1"`
}

// UpdateSeat godoc
//
//	@Summary		Updates a seat
//	@Description	Updates a seat by ID
//	@Tags			seats
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int					true	"Seat ID"
//	@Param			payload	body		UpdateSeatPayload	true	"Seat payload"
//	@Success		200		{object}	store.Seat
//	@Failure		400		{object}	error
//	@Failure		401		{object}	error
//	@Failure		404		{object}	error
//	@Failure		500		{object}	error
//	@Security		ApiKeyAuth
//	@Router			/seats/{id} [patch]
func (app *application) updateSeatHandler(w http.ResponseWriter, r *http.Request) {
	seat := getSeatFromCtx(r)

	var payload UpdateSeatPayload

	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if payload.Row != nil {
		seat.Row = *payload.Row
	}
	if payload.Number != nil {
		seat.Number = *payload.Number
	}

	if err := app.store.Seats.Update(r.Context(), seat); err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			app.notFoundResponse(w, r, err)
		case errors.Is(err, store.ErrDuplicateSeat):
			app.badRequestResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, seat); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// DeleteSeat godoc
//
//	@Summary		Deletes a seat
//	@Description	Deletes a seat by ID
//	@Tags			seats
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"Seat ID"
//	@Success		204	{object}	string
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Security		ApiKeyAuth
//	@Router			/seats/{id} [delete]
func (app *application) deleteSeatHandler(w http.ResponseWriter, r *http.Request) {
	seat := getSeatFromCtx(r)

	ctx := r.Context()
	if err := app.store.Seats.Delete(ctx, seat.ID); err != nil {
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

func (app *application) seatsContextMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		idParam := chi.URLParam(r, "seatID")
		id, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil {
			app.badRequestResponse(w, r, fmt.Errorf("must provide a correct id"))
			return
		}
		ctx := r.Context()

		seat, err := app.store.Seats.GetByID(ctx, id)
		if err != nil {
			switch {
			case errors.Is(err, store.ErrNotFound):
				app.notFoundResponse(w, r, err)
			default:
				app.internalServerError(w, r, err)
			}
			return
		}

		ctx = context.WithValue(ctx, seatCtx, seat)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func getSeatFromCtx(r *http.Request) *store.Seat {
	seat, _ := r.Context().Value(seatCtx).(*store.Seat)
	return seat
}
