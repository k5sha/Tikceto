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

type ticketKey string

const ticketCtx ticketKey = "ticket"

// CreateTicketPayload represents the payload for creating a ticket.
//
//	@SessionID	int64	"Session ID for the ticket" validate:"required,gte=1"`
//	@SeatID		int64	"Seat ID for the ticket" validate:"required,gte=1"`
//	@UserID		int64	"User ID for the ticket" validate:"required,gte=1"`
//	@Price		float64	"Price of the ticket" validate:"required,gte=0"`
type CreateTicketPayload struct {
	SessionID int64   `json:"session_id" validate:"required,gte=1"`
	SeatID    int64   `json:"seat_id" validate:"required,gte=1"`
	UserID    int64   `json:"user_id" validate:"required,gte=1"`
	Price     float64 `json:"price" validate:"required,gte=0"`
}

// CreateTicket godoc
//
//	@Summary		Creates a ticket
//	@Description	Creates a ticket
//	@Tags			tickets
//	@Accept			json
//	@Produce		json
//	@Param			payload	body		CreateTicketPayload	true	"Ticket payload"
//	@Success		201		{object}	store.Ticket
//	@Failure		400		{object}	error
//	@Failure		401		{object}	error
//	@Failure		500		{object}	error
//	@Security		ApiKeyAuth
//	@Router			/tickets [post]
func (app *application) createTicketHandler(w http.ResponseWriter, r *http.Request) {
	var payload CreateTicketPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	session, err := app.store.Sessions.GetByID(ctx, payload.SessionID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	seat, err := app.store.Seats.GetByID(ctx, payload.SeatID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	if session.RoomID != seat.RoomID {
		app.badRequestResponse(w, r, errors.New("session and seat belong to different rooms"))
		return
	}

	ticket := &store.Ticket{
		SessionID: session.ID,
		SeatID:    seat.ID,
		UserID:    payload.UserID,
		Price:     payload.Price,
		Session:   *session,
		Seat:      *seat,
	}

	if err := app.store.Tickets.Create(ctx, ticket); err != nil {
		if errors.Is(err, store.ErrDuplicateTicket) {
			app.badRequestResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusCreated, ticket); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// GetTicket godoc
//
//	@Summary		Fetches a ticket
//	@Description	Fetches a ticket by ID
//	@Tags			tickets
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"Ticket ID"
//	@Success		200	{object}	store.Ticket
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Router			/tickets/{id} [get]
func (app *application) getTicketHandler(w http.ResponseWriter, r *http.Request) {
	ticket := getTicketFromCtx(r)

	if err := app.jsonResponse(w, http.StatusOK, ticket); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// UpdateTicketPayload represents the payload for updating a ticket.
//
//	@UserID	int64	"Updated user ID for the ticket" validate:"omitempty,gte=1"`
//	@Price	float64	"Updated price of the ticket" validate:"omitempty,gte=0"`
type UpdateTicketPayload struct {
	UserID *int64   `json:"user_id" validate:"omitempty,gte=1"`
	Price  *float64 `json:"price" validate:"omitempty,gte=0"`
}

// UpdateTicket godoc
//
//	@Summary		Updates a ticket
//	@Description	Updates a ticket by ID
//	@Tags			tickets
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int					true	"Ticket ID"
//	@Param			payload	body		UpdateTicketPayload	true	"Ticket payload"
//	@Success		200		{object}	store.Ticket
//	@Failure		400		{object}	error
//	@Failure		401		{object}	error
//	@Failure		404		{object}	error
//	@Failure		500		{object}	error
//	@Security		ApiKeyAuth
//	@Router			/tickets/{id} [patch]
func (app *application) updateTicketHandler(w http.ResponseWriter, r *http.Request) {
	ticket := getTicketFromCtx(r)

	var payload UpdateTicketPayload

	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	if payload.UserID != nil {
		user, err := app.store.Users.GetByID(ctx, *payload.UserID)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				app.notFoundResponse(w, r, err)
				return
			}
			app.internalServerError(w, r, err)
			return
		}
		ticket.UserID = user.ID
	}
	if payload.Price != nil {
		ticket.Price = *payload.Price
	}

	if err := app.store.Tickets.Update(r.Context(), ticket); err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, ticket); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// DeleteTicket godoc
//
//	@Summary		Deletes a ticket
//	@Description	Delete a ticket by ID
//	@Tags			tickets
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"Ticket ID"
//	@Success		204	{object}	string
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Security		ApiKeyAuth
//	@Router			/tickets/{id} [delete]
func (app *application) deleteTicketHandler(w http.ResponseWriter, r *http.Request) {
	ticket := getTicketFromCtx(r)

	ctx := r.Context()
	if err := app.store.Tickets.Delete(ctx, ticket.ID); err != nil {
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

func (app *application) ticketContextMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		idParam := chi.URLParam(r, "ticketID")
		id, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil {
			app.badRequestResponse(w, r, fmt.Errorf("must provide a correct id"))
			return
		}
		ctx := r.Context()

		ticket, err := app.store.Tickets.GetByID(ctx, id)
		if err != nil {
			switch {
			case errors.Is(err, store.ErrNotFound):
				app.notFoundResponse(w, r, err)
			default:
				app.internalServerError(w, r, err)
			}
			return
		}

		session, err := app.store.Sessions.GetByID(ctx, ticket.SessionID)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				app.notFoundResponse(w, r, err)
				return
			}
			app.internalServerError(w, r, err)
			return
		}

		ticket.Session = *session

		seat, err := app.store.Seats.GetByID(ctx, ticket.SeatID)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				app.notFoundResponse(w, r, err)
				return
			}
			app.internalServerError(w, r, err)
			return
		}

		ticket.Seat = *seat

		ctx = context.WithValue(ctx, ticketCtx, ticket)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func getTicketFromCtx(r *http.Request) *store.Ticket {
	ticket, _ := r.Context().Value(ticketCtx).(*store.Ticket)
	return ticket
}
