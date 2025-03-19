package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

var (
	ErrNotFound = errors.New("record not found")
	ErrConflict = errors.New("record already exists")

	QueryTimeoutDuration = time.Second * 5
)

type Storage struct {
	Users interface {
		GetByID(context.Context, int64) (*User, error)
		GetByEmail(context.Context, string) (*User, error)
		Create(context.Context, *sql.Tx, *User) error
		CreateAndInvite(context.Context, *User, string, time.Duration) error
		Activate(context.Context, string) error
		Delete(context.Context, int64) error
	}
	Rooms interface {
		GetByID(context.Context, int64) (*Room, error)
		Create(context.Context, *Room) error
		Delete(context.Context, int64) error
		Update(context.Context, *Room) error
	}
	Movies interface {
		GetByID(context.Context, int64) (*Movie, error)
		Create(context.Context, *Movie) error
		Delete(context.Context, int64) error
		Update(context.Context, *Movie) error
	}
	Sessions interface {
		GetByID(context.Context, int64) (*Session, error)
		Create(context.Context, *Session) error
		Delete(context.Context, int64) error
		Update(context.Context, *Session) error
	}
}

func NewStorage(db *sql.DB) Storage {
	return Storage{
		Users:    &UsersStore{db},
		Rooms:    &RoomsStore{db},
		Movies:   &MoviesStore{db},
		Sessions: &SessionStore{db},
	}
}

func withTx(db *sql.DB, ctx context.Context, fn func(*sql.Tx) error) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	if err := fn(tx); err != nil {
		_ = tx.Rollback()
		return err
	}
	return tx.Commit()
}
