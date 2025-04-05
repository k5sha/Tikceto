package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/go-chi/chi/v5"
	"github.com/k5sha/Tikceto/internal/payment"
	"github.com/k5sha/Tikceto/internal/store"
	"log"
	"net/http"
	"strconv"
)

// CreatePaymentPayload represents the payload for creating a seat.
//
//	@SessionID	int  "SessionID" validate:"required"
//	@SeatID		int  "SessionID" validate:"required"
type CreatePaymentPayload struct {
	SessionID int64 `json:"session_id" validate:"required"`
	SeatID    int64 `json:"seat_id" validate:"required"`
}

// CreatePaymentHandler godoc
//
//	@Summary		Create a payment link
//	@Description	Creates a payment link for a ticket through LiqPay
//	@Tags			payments
//	@Accept			json
//	@Produce		json
//	@Param			payload	body		CreatePaymentPayload	true	"Payment request payload"
//	@Success		201		{object}	payment.PaymentResponse
//	@Failure		400		{object}	error
//	@Failure		500		{object}	error
//	@Security		ApiKeyAuth
//	@Router			/payments/create [post]
func (app *application) createPaymentHandler(w http.ResponseWriter, r *http.Request) {
	var payload CreatePaymentPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	ticket, err := app.store.Tickets.GetBySessionAndSeat(ctx, payload.SessionID, payload.SeatID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	paymentPayload := payment.PaymentRequest{
		Amount:      ticket.Price,
		Currency:    "UAH",
		Description: "Купівля квитка #" + strconv.FormatInt(ticket.ID, 10),
		OrderId:     ticket.ID,
	}

	paymentResp, err := app.payment.CreatePayment(paymentPayload)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	user := getUserFromCtx(r)

	ticket.UserID = &user.ID

	err = app.store.Tickets.Update(ctx, ticket)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
	if err := app.jsonResponse(w, http.StatusCreated, paymentResp); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// ValidatePaymentHandler godoc
//
//	@Summary		Validate payment status
//	@Description	Validates the payment status by order ID
//	@Tags			payments
//	@Accept			json
//	@Produce		json
//	@Param			orderID	path		string	true	"Order ID"
//	@Success		200		{object}	map[string]string
//	@Failure		400		{object}	error
//	@Failure		500		{object}	error
//	@Router			/payments/status/{orderID} [put]
func (app *application) validatePaymentHandler(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "orderID")
	if orderID == "" {
		app.badRequestResponse(w, r, errors.New("orderID parameter is required"))
		return
	}

	errCode, err := app.payment.ValidatePayment(orderID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	log.Println(errCode)

	ticketID, err := strconv.ParseInt(orderID, 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("invalid order ID format"))
		return
	}

	ctx := r.Context()

	ticket, err := app.store.Tickets.GetByID(ctx, ticketID)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	if errCode != nil {
		ticket.UserID = nil

		if err := app.store.Tickets.Update(ctx, ticket); err != nil {
			app.internalServerError(w, r, err)
			return
		}

		if err := app.jsonResponse(w, http.StatusForbidden, map[string]string{"result": "failed"}); err != nil {
			app.internalServerError(w, r, err)
			return
		}
	}

	if err := app.jsonResponse(w, http.StatusCreated, map[string]string{"result": "ok"}); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}
