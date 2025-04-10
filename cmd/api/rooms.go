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

type roomKey string

const roomCtx roomKey = "room"

// CreateRoomPayload represents the payload for creating a room.
//
//	@Name		string   "Name of the room"  validate:"required,min=3,max=100"
//	@Capacity	int   "Capacity of the room" validate:"required,gte=1"`
//	@Rows		int   "Count of rows" validate:"omitempty,gte=1"`
type CreateRoomPayload struct {
	Name     string `json:"name" validate:"required,min=3,max=100"`
	Capacity int64  `json:"capacity" validate:"required,gte=1"`
	Rows     *int64 `json:"rows" validate:"omitempty,gte=0"`
}

// CreateRoom godoc
//
//	@Summary		Creates a room
//	@Description	Creates a room
//	@Tags			rooms
//	@Accept			json
//	@Produce		json
//	@Param			payload	body		CreateRoomPayload	true	"Room payload"
//	@Success		201		{object}	store.Room
//	@Failure		400		{object}	error
//	@Failure		401		{object}	error
//	@Failure		500		{object}	error
//	@Security		ApiKeyAuth
//	@Router			/rooms [post]
func (app *application) createRoomHandler(w http.ResponseWriter, r *http.Request) {
	var payload CreateRoomPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	room := &store.Room{
		Name:     payload.Name,
		Capacity: payload.Capacity,
	}
	ctx := r.Context()

	if err := app.store.Rooms.Create(ctx, room); err != nil {
		if errors.Is(err, store.ErrDuplicateRoom) {
			app.badRequestResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	if payload.Rows != nil {
		if err := app.fillSeatsInRoom(ctx, room, *payload.Rows); err != nil {
			app.internalServerError(w, r, err)
			return
		}

	}

	if err := app.jsonResponse(w, http.StatusCreated, room); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// GetRoom godoc
//
//	@Summary		Fetches a room
//	@Description	Fetches a room by ID
//	@Tags			rooms
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"Room ID"
//	@Success		200	{object}	store.Room
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Router			/rooms/{id} [get]
func (app *application) getRoomHandler(w http.ResponseWriter, r *http.Request) {
	room := getRoomFromCtx(r)

	if err := app.jsonResponse(w, http.StatusOK, room); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// GetRoom godoc
//
//	@Summary		Fetches all rooms
//	@Description	Fetches all rooms
//	@Tags			rooms
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	[]store.Room
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Router			/rooms/ [get]
func (app *application) getRoomsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	rooms, err := app.store.Rooms.GetAll(ctx)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, rooms); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// UpdateRoomPayload represents the payload for updating a room.
//
//	@Name		string   "Updated name of the room" validate:"omitempty,min=3,max=100"`
//	@Capacity	int   "Updated capacity of the room" validate:"omitempty,gte=1"`
type UpdateRoomPayload struct {
	Name     *string `json:"name" validate:"omitempty,min=3,max=100"`
	Capacity *int64  `json:"capacity" validate:"omitempty,gte=1"`
}

// UpdateRoom godoc
//
//	@Summary		Updates a room
//	@Description	Updates a room by ID
//	@Tags			rooms
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int					true	"Room ID"
//	@Param			payload	body		UpdateRoomPayload	true	"Room payload"
//	@Success		200		{object}	store.Room
//	@Failure		400		{object}	error
//	@Failure		401		{object}	error
//	@Failure		404		{object}	error
//	@Failure		500		{object}	error
//	@Security		ApiKeyAuth
//	@Router			/rooms/{id} [patch]
func (app *application) updateRoomHandler(w http.ResponseWriter, r *http.Request) {
	room := getRoomFromCtx(r)

	var payload UpdateRoomPayload

	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if payload.Name != nil {
		room.Name = *payload.Name
	}
	if payload.Capacity != nil {
		room.Capacity = *payload.Capacity
	}

	if err := app.store.Rooms.Update(r.Context(), room); err != nil {
		switch {
		case errors.Is(err, store.ErrDuplicateRoom):
			app.badRequestResponse(w, r, err)
		case errors.Is(err, store.ErrNotFound):
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, room); err != nil {
		app.internalServerError(w, r, err)
		return
	}

}

// DeleteRoom godoc
//
//	@Summary		Deletes a room
//	@Description	Delete a room by ID
//	@Tags			rooms
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"Room ID"
//	@Success		204	{object}	string
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Security		ApiKeyAuth
//	@Router			/rooms/{id} [delete]
func (app *application) deleteRoomHandler(w http.ResponseWriter, r *http.Request) {
	room := getRoomFromCtx(r)

	ctx := r.Context()
	if err := app.store.Rooms.Delete(ctx, room.ID); err != nil {
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

func (app *application) fillSeatsInRoom(ctx context.Context, room *store.Room, rows int64) error {
	baseSeats := room.Capacity / rows
	extraSeats := room.Capacity % rows

	seatsPerRow := make([]int64, rows)
	for i := int64(0); i < rows; i++ {
		seatsPerRow[i] = baseSeats
	}

	for i := rows - 1; i >= 0 && extraSeats > 0; i-- {
		seatsPerRow[i]++
		extraSeats--
	}

	for row := int64(1); row <= rows; row++ {
		for seatNumber := int64(1); seatNumber <= seatsPerRow[row-1]; seatNumber++ {
			seat := &store.Seat{
				RoomID: room.ID,
				Row:    row,
				Number: seatNumber,
			}

			if err := app.store.Seats.Create(ctx, seat); err != nil {
				return fmt.Errorf("error creating seat: %v", err)
			}
		}
	}

	return nil
}

func (app *application) roomsContextMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		idParam := chi.URLParam(r, "roomID")
		id, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil {
			app.badRequestResponse(w, r, fmt.Errorf("must provide a correct id"))
			return
		}
		ctx := r.Context()

		room, err := app.store.Rooms.GetByID(ctx, id)
		if err != nil {
			switch {
			case errors.Is(err, store.ErrNotFound):
				app.notFoundResponse(w, r, err)
			default:
				app.internalServerError(w, r, err)
			}
			return
		}

		ctx = context.WithValue(ctx, roomCtx, room)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func getRoomFromCtx(r *http.Request) *store.Room {
	room, _ := r.Context().Value(roomCtx).(*store.Room)
	return room
}
