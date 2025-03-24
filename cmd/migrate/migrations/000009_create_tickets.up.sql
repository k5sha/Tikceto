CREATE TABLE tickets (
    id bigserial PRIMARY KEY,
    session_id bigserial NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    seat_id bigserial NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    user_id bigserial REFERENCES users(id) ON DELETE SET NULL,
    price decimal(10, 2) NOT NULL CHECK (price >= 0),
    created_at timestamp(0) with time zone NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, seat_id)
);