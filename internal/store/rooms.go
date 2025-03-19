package store

import (
	"context"
	"database/sql"
	"errors"
)

// TODO: add createdAt

type Room struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Capacity int64  `json:"capacity"`
}

type RoomsStore struct {
	db *sql.DB
}

func (s *RoomsStore) GetByID(ctx context.Context, id int64) (*Room, error) {
	query := `
		SELECT id, name, capacity
		FROM rooms 
        WHERE id = $1`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	room := &Room{}
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&room.ID,
		&room.Name,
		&room.Capacity,
	)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrNotFound
		default:
			return nil, err
		}
	}

	return room, nil
}
func (s *RoomsStore) Create(ctx context.Context, room *Room) error {
	query := `
	INSERT INTO rooms (name, capacity) 
	VALUES ($1, $2) RETURNING id
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := s.db.QueryRowContext(
		ctx,
		query,
		room.Name,
		room.Capacity,
	).Scan(
		&room.ID,
	)

	return err
}
func (s *RoomsStore) Delete(ctx context.Context, id int64) error {
	query := `
		DELETE FROM rooms WHERE id = $1
	`

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
func (s *RoomsStore) Update(ctx context.Context, room *Room) error {
	query := `
		UPDATE rooms 
		SET name = $1, capacity = $2
		WHERE id = $3
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	_, err := s.db.ExecContext(
		ctx,
		query,
		room.Name,
		room.Capacity,
		room.ID,
	)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return ErrNotFound
		default:
			return err
		}
	}

	return nil
}
