package store

import (
	"context"
	"database/sql"
	"errors"
)

var (
	ErrDuplicateTicket = errors.New("a ticket with that session and seat already exists")
)

type Ticket struct {
	ID        int64   `json:"id"`
	SessionID int64   `json:"session_id"`
	SeatID    int64   `json:"seat_id"`
	UserID    int64   `json:"user_id"`
	Price     float64 `json:"price"`
	CreatedAt string  `json:"created_at"`
	Session   Session `json:"session"`
	Seat      Seat    `json:"seat"`
}

type TicketStore struct {
	db *sql.DB
}

func (s *TicketStore) GetByID(ctx context.Context, id int64) (*Ticket, error) {
	query := `
		SELECT id, session_id, seat_id, user_id, price, created_at
		FROM tickets
		WHERE id = $1
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	ticket := &Ticket{}
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&ticket.ID, &ticket.SessionID, &ticket.SeatID, &ticket.UserID, &ticket.Price, &ticket.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return ticket, nil
}

func (s *TicketStore) Create(ctx context.Context, ticket *Ticket) error {
	query := `
		INSERT INTO tickets (session_id, seat_id, user_id, price)
		VALUES ($1, $2, $3, $4) RETURNING id, created_at
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := s.db.QueryRowContext(
		ctx, query,
		ticket.SessionID, ticket.SeatID, ticket.UserID, ticket.Price,
	).Scan(&ticket.ID, &ticket.CreatedAt)

	if err != nil {
		if err.Error() == `pq: duplicate key value violates unique constraint "tickets_session_id_seat_id_key"` {
			return ErrDuplicateTicket
		}
		return err
	}

	return nil
}

func (s *TicketStore) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM tickets WHERE id = $1`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	res, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return ErrNotFound
	}

	return nil
}

func (s *TicketStore) Update(ctx context.Context, ticket *Ticket) error {
	query := `
		UPDATE tickets SET user_id = $1, price = $2 WHERE id = $3
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	res, err := s.db.ExecContext(
		ctx, query,
		ticket.UserID, ticket.Price, ticket.ID,
	)
	if err != nil {
		return err
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return ErrNotFound
	}

	return nil
}
