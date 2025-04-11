package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/k5sha/Tikceto/internal/payment"
	"github.com/k5sha/Tikceto/internal/store"
	"log"
	"net/http"
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

	user := getUserFromCtx(r)

	session, err := app.store.Sessions.GetByID(ctx, payload.SessionID)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	seat, err := app.store.Seats.GetByID(ctx, payload.SeatID)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	ticket := &store.Ticket{
		UserID:    user.ID,
		SessionID: session.ID,
		SeatID:    seat.ID,
		Price:     session.Price,
	}

	err = app.store.Tickets.Create(ctx, ticket)
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
		Description: "Купівля квитка #" + ticket.ID,
		OrderId:     ticket.ID,
	}

	paymentResp, err := app.payment.CreatePayment(paymentPayload)
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
//	@Success		200	{object}	map[string]string
//	@Failure		400	{object}	error
//	@Failure		500	{object}	error
//	@Router			/payments/validate [post]
func (app *application) validatePaymentHandler(w http.ResponseWriter, r *http.Request) {
	data := r.FormValue("data")
	signature := r.FormValue("signature")

	expectedSignature := app.payment.GenerateSignature(data)

	if signature != expectedSignature {
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("invalid signature"))
		return
	}

	decodedData, err := base64.StdEncoding.DecodeString(data)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	var paymentData PaymentData

	err = json.Unmarshal(decodedData, &paymentData)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	log.Println(paymentData.Status)

	ctx := r.Context()

	ticket, err := app.store.Tickets.GetByID(ctx, paymentData.OrderID)
	if err != nil {
		app.notFoundResponse(w, r, err)
		return
	}

	if paymentData.Status == "success" || paymentData.Status == "sandbox" {
		ticket.Status = "confirmed"
		if err := app.store.Tickets.Update(ctx, ticket); err != nil {
			http.Error(w, "Failed to update ticket status", http.StatusInternalServerError)
			return
		}
	} else {
		ticket.Status = "failed"
		if err := app.store.Tickets.Update(ctx, ticket); err != nil {
			http.Error(w, "Failed to update ticket status", http.StatusInternalServerError)
			return
		}
	}

	if err := app.jsonResponse(w, http.StatusOK, map[string]string{
		"status": "ok",
	}); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

type PaymentData struct {
	OrderID string `json:"order_id"`
	Status  string `json:"status"`
}
