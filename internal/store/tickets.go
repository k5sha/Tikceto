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
	UserID    *int64  `json:"user_id"`
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

func (s *TicketStore) GetByUserID(ctx context.Context, id int64) ([]Ticket, error) {
	query := `
		SELECT 
			t.id, t.session_id, t.seat_id, t.user_id, t.price, t.created_at,
			s.id, s.movie_id, s.room_id, s.start_time, s.price,
			m.id, m.title, m.description, m.duration, m.poster_url, m.release_date, m.created_at,
			r.id, r.name, r.capacity,
			se.id, se.room_id, se.row, se.seat_number
		FROM tickets t
		JOIN sessions s ON t.session_id = s.id
		JOIN movies m ON s.movie_id = m.id
		JOIN rooms r ON s.room_id = r.id
		JOIN seats se ON t.seat_id = se.id
		WHERE t.user_id = $1
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	rows, err := s.db.QueryContext(ctx, query, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tickets []Ticket
	for rows.Next() {
		var ticket Ticket
		var session Session
		var movie Movie
		var room Room
		var seat Seat

		err := rows.Scan(
			&ticket.ID, &ticket.SessionID, &ticket.SeatID, &ticket.UserID, &ticket.Price, &ticket.CreatedAt,
			&session.ID, &session.MovieID, &session.RoomID, &session.StartTime, &session.Price,
			&movie.ID, &movie.Title, &movie.Description, &movie.Duration, &movie.PosterUrl, &movie.ReleaseDate, &movie.CreatedAt,
			&room.ID, &room.Name, &room.Capacity,
			&seat.ID, &seat.RoomID, &seat.Row, &seat.Number,
		)
		if err != nil {
			return nil, err
		}

		session.Movie = movie
		session.Room = room
		ticket.Session = session
		ticket.Seat = seat

		tickets = append(tickets, ticket)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	if len(tickets) == 0 {
		return nil, ErrNotFound
	}

	return tickets, nil
}

func (s *TicketStore) GetBySessionAndSeat(ctx context.Context, sessionID, seatID int64) (*Ticket, error) {
	query := `
			SELECT id, user_id, price, created_at
			FROM tickets
			WHERE session_id = $1 AND seat_id = $2 AND user_id IS NULL
		`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	ticket := &Ticket{}
	err := s.db.QueryRowContext(ctx, query, sessionID, seatID).Scan(
		&ticket.ID, &ticket.UserID, &ticket.Price, &ticket.CreatedAt,
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
		INSERT INTO tickets (session_id, seat_id, price, user_id)
		VALUES ($1, $2, $3, $4) RETURNING id, created_at
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := s.db.QueryRowContext(
		ctx, query,
		ticket.SessionID, ticket.SeatID, ticket.Price, ticket.UserID,
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
