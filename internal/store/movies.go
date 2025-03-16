package store

import (
	"context"
	"database/sql"
	"errors"
)

type Movie struct {
	ID          int64  `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Duration    int64  `json:"duration"`
	PosterUrl   string `json:"poster_url"`
	ReleaseDate string `json:"release_date"`
	CreatedAt   string `json:"created_at"`
}

type MoviesStore struct {
	db *sql.DB
}

func (s *MoviesStore) GetByID(ctx context.Context, id int64) (*Movie, error) {
	query := `
		SELECT id, title, description, duration, poster_url, release_date, created_at
		FROM movies 
        WHERE id = $1`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	movie := &Movie{}
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&movie.ID,
		&movie.Title,
		&movie.Description,
		&movie.Duration,
		&movie.PosterUrl,
		&movie.ReleaseDate,
		&movie.CreatedAt,
	)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrNotFound
		default:
			return nil, err
		}
	}

	return movie, nil
}
func (s *MoviesStore) Create(ctx context.Context, movie *Movie) error {
	query := `
	INSERT INTO movies (title, description, duration, poster_url, release_date) 
	VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := s.db.QueryRowContext(
		ctx,
		query,
		movie.Title,
		movie.Description,
		movie.Duration,
		movie.PosterUrl,
		movie.ReleaseDate,
	).Scan(
		&movie.ID,
		&movie.CreatedAt,
	)
	if err != nil {
		return err
	}
	return nil
}
func (s *MoviesStore) Delete(ctx context.Context, id int64) error {
	query := `
		DELETE FROM movies WHERE id = $1
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
func (s *MoviesStore) Update(ctx context.Context, movie *Movie) error {
	query := `
		UPDATE movies 
		SET 
		    title = $1,
		    description = $2,
		    duration = $3,
		    poster_url = $4,
		    release_date = $5
		WHERE id = $6
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	_, err := s.db.ExecContext(
		ctx,
		query,
		movie.Title,
		movie.Description,
		movie.Duration,
		movie.PosterUrl,
		movie.ReleaseDate,
		movie.ID,
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
