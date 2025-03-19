CREATE TABLE sessions (
    id bigserial PRIMARY KEY,
    movie_id bigserial NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    room_id bigserial NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    start_time timestamp(0) with time zone NOT NULL,
    price decimal(10, 2) NOT NULL CHECK (price >= 0)
);