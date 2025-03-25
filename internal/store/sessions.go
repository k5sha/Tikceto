package store

import (
	"context"
	"database/sql"
	"errors"
)

type Session struct {
	ID        int64   `json:"id"`
	MovieID   int64   `json:"movie_id"`
	RoomID    int64   `json:"room_id"`
	StartTime string  `json:"start_time"`
	Price     float64 `json:"price"`
	Movie     Movie   `json:"movie"`
	Room      Room    `json:"room"`
}

type SessionWithoutMovie struct {
	ID        int64   `json:"id"`
	MovieID   int64   `json:"movie_id"`
	RoomID    int64   `json:"room_id"`
	StartTime string  `json:"start_time"`
	Price     float64 `json:"price"`
	Room      Room    `json:"room"`
}

type SessionStore struct {
	db *sql.DB
}

func (s *SessionStore) GetByID(ctx context.Context, id int64) (*Session, error) {
	query := `
		SELECT s.id, s.movie_id, s.room_id, s.start_time, s.price,
		       m.id, m.title, m.description, m.duration, m.release_date,
		       r.id, r.name, r.capacity
		FROM sessions s
		LEFT JOIN movies m ON s.movie_id = m.id
		LEFT JOIN rooms r ON s.room_id = r.id
		WHERE s.id = $1
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	session := &Session{}

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&session.ID, &session.MovieID, &session.RoomID, &session.StartTime, &session.Price,
		&session.Movie.ID, &session.Movie.Title, &session.Movie.Description, &session.Movie.Duration, &session.Movie.ReleaseDate,
		&session.Room.ID, &session.Room.Name, &session.Room.Capacity,
	)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrNotFound
		default:
			return nil, err
		}
	}

	return session, nil
}

func (s *SessionStore) GetByMovieID(ctx context.Context, movieID int64) ([]SessionWithoutMovie, error) {
	query := `
		SELECT s.id, s.movie_id, s.room_id, s.start_time, s.price,
		       r.id, r.name, r.capacity
		FROM sessions s
		LEFT JOIN rooms r ON s.room_id = r.id
		WHERE s.movie_id = $1
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	rows, err := s.db.QueryContext(ctx, query, movieID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []SessionWithoutMovie

	for rows.Next() {
		var session SessionWithoutMovie
		err := rows.Scan(
			&session.ID, &session.MovieID, &session.RoomID, &session.StartTime, &session.Price,
			&session.Room.ID, &session.Room.Name, &session.Room.Capacity,
		)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, session)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	if len(sessions) == 0 {
		return nil, ErrNotFound
	}

	return sessions, nil
}

func (s *SessionStore) Create(ctx context.Context, session *Session) error {
	query := `
		INSERT INTO sessions (movie_id, room_id, start_time, price) 
		VALUES ($1, $2, $3, $4) RETURNING id
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := s.db.QueryRowContext(
		ctx, query,
		session.MovieID, session.RoomID, session.StartTime, session.Price,
	).Scan(&session.ID)

	return err
}

func (s *SessionStore) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM sessions WHERE id = $1`

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

func (s *SessionStore) Update(ctx context.Context, session *Session) error {
	query := `
		UPDATE sessions 
		SET movie_id = $1, room_id = $2, start_time = $3, price = $4
		WHERE id = $5
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	res, err := s.db.ExecContext(
		ctx, query,
		session.MovieID, session.RoomID, session.StartTime, session.Price,
		session.ID,
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
