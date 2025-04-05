package store

import (
	"context"
	"database/sql"
	"errors"
)

var (
	ErrDuplicateSeat = errors.New("a seat with that row and number already exists")
)

type Seat struct {
	ID     int64 `json:"id"`
	RoomID int64 `json:"room_id"`
	Row    int   `json:"row"`
	Number int   `json:"seat_number"`
}

type SeatWithMetadata struct {
	ID     int64    `json:"id"`
	RoomID int64    `json:"room_id"`
	Row    int      `json:"row"`
	Number int      `json:"seat_number"`
	Price  *float64 `json:"price,omitempty"`
	Status string   `json:"status"`
}

type SeatStore struct {
	db *sql.DB
}

func (s *SeatStore) GetByID(ctx context.Context, id int64) (*Seat, error) {
	query := `
		SELECT id, room_id, row, seat_number
		FROM seats
		WHERE id = $1
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	seat := &Seat{}

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&seat.ID, &seat.RoomID, &seat.Row, &seat.Number,
	)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrNotFound
		default:
			return nil, err
		}
	}

	return seat, nil
}

func (s *SeatStore) GetBySession(ctx context.Context, sessionID int64) ([]SeatWithMetadata, error) {
	query := `
		SELECT s.id, s.room_id, s.row, s.seat_number, t.user_id, t.price
		FROM seats s
		JOIN sessions ses ON s.room_id = ses.room_id
		LEFT JOIN tickets t ON s.id = t.seat_id AND ses.id = t.session_id
		WHERE ses.id = $1
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	rows, err := s.db.QueryContext(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var seats []SeatWithMetadata
	for rows.Next() {
		var seat SeatWithMetadata
		var userID *int64
		if err := rows.Scan(&seat.ID, &seat.RoomID, &seat.Row, &seat.Number, &userID, &seat.Price); err != nil {
			return nil, err
		}

		seatStatus := "reserved"
		if userID == nil && seat.Price != nil {
			seatStatus = "available"
		}

		seat.Status = seatStatus

		seats = append(seats, seat)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return seats, nil
}

func (s *SeatStore) Create(ctx context.Context, seat *Seat) error {
	query := `
		INSERT INTO seats (room_id, row, seat_number)
		VALUES ($1, $2, $3) RETURNING id
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := s.db.QueryRowContext(
		ctx, query,
		seat.RoomID, seat.Row, seat.Number,
	).Scan(&seat.ID)

	if err != nil {
		switch {
		case err.Error() == `pq: duplicate key value violates unique constraint "seats_room_id_row_seat_number_key"`:
			return ErrDuplicateSeat
		default:
			return err
		}
	}
	return nil
}

func (s *SeatStore) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM seats WHERE id = $1`

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

func (s *SeatStore) Update(ctx context.Context, seat *Seat) error {
	query := `
		UPDATE seats SET row = $1, seat_number = $2 WHERE id = $3 
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	res, err := s.db.ExecContext(
		ctx, query,
		seat.Row, seat.Number,
		seat.ID,
	)
	if err != nil {
		switch {
		case err.Error() == `pq: duplicate key value violates unique constraint "seats_room_id_row_seat_number_key"`:
			return ErrDuplicateSeat
		default:
			return err
		}
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
