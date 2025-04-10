package store

import (
	"context"
	"database/sql"
	"errors"
	"log"
)

type Movie struct {
	ID          int64  `json:"id"`
	Slug        string `json:"slug"`
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
		SELECT id, slug, title, description, duration, poster_url, release_date, created_at
		FROM movies 
        WHERE id = $1`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	movie := &Movie{}
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&movie.ID,
		&movie.Slug,
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

func (s *MoviesStore) GetBySlug(ctx context.Context, slug string) (*Movie, error) {
	query := `
		SELECT id, slug, title, description, duration, poster_url, release_date, created_at
		FROM movies 
        WHERE slug = $1`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	movie := &Movie{}
	err := s.db.QueryRowContext(ctx, query, slug).Scan(
		&movie.ID,
		&movie.Slug,
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

func (s *MoviesStore) GetMoviesList(ctx context.Context, fq PaginatedMoviesQuery) ([]Movie, error) {
	query := `
		SELECT id, slug, title, description, duration, poster_url, release_date, created_at
		FROM movies
		WHERE 
			(title ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%') AND
			($2::date IS NULL OR release_date >= $2) AND
			($3::date IS NULL OR release_date <= $3)
		ORDER BY release_date ` + fq.Sort + `
		LIMIT $4 OFFSET $5
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	rows, err := s.db.QueryContext(ctx, query, fq.Search, fq.Since, fq.Until, fq.Limit, fq.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var movies []Movie
	for rows.Next() {
		var movie Movie
		err := rows.Scan(
			&movie.ID,
			&movie.Slug,
			&movie.Title,
			&movie.Description,
			&movie.Duration,
			&movie.PosterUrl,
			&movie.ReleaseDate,
			&movie.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		movies = append(movies, movie)
	}

	return movies, nil
}

func (s *MoviesStore) Create(ctx context.Context, movie *Movie) error {
	log.Println(movie)
	query := `
	INSERT INTO movies (slug, title, description, duration, poster_url, release_date) 
	VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := s.db.QueryRowContext(
		ctx,
		query,
		movie.Slug,
		movie.Title,
		movie.Description,
		movie.Duration,
		movie.PosterUrl,
		movie.ReleaseDate,
	).Scan(
		&movie.ID,
		&movie.CreatedAt,
	)

	return err
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
		    release_date = $5,
		    slug = $6
		WHERE id = $7
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
		movie.Slug,
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
