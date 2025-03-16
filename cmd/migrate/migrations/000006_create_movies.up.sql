CREATE TABLE IF NOT EXISTS  movies (
    id  bigserial PRIMARY KEY,
    title varchar(255) NOT NULL,
    description text,
    duration integer NOT NULL CHECK (duration > 0),
    poster_url text,
    release_date date NOT NULL,
    created_at timestamp(0) with time zone NOT NULL DEFAULT NOW()
);