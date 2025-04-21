package store

import (
	"context"
	"database/sql"
	"time"
)

func (s *UsersStore) createUserInvitations(ctx context.Context, tx *sql.Tx, token string, exp time.Duration, userID int64) error {
	query := `INSERT INTO user_invitations (token, user_id, expiry) VALUES ($1, $2, $3)`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	_, err := tx.ExecContext(ctx, query, token, userID, time.Now().Add(exp))
	if err != nil {
		return err
	}
	return nil
}

func (s *UsersStore) deleteUserInvitations(ctx context.Context, tx *sql.Tx, userID int64) error {
	query := `DELETE FROM user_invitations WHERE user_id = $1`

	ctx, cancel := context.WithTimeout(ctx, 3*QueryTimeoutDuration)
	defer cancel()

	_, err := tx.ExecContext(ctx, query, userID)
	if err != nil {
		return err
	}

	return nil
}
