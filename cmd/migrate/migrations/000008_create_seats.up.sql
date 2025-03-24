CREATE TABLE seats (
    id bigserial PRIMARY KEY,
    room_id bigserial NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    row integer NOT NULL CHECK (row > 0),
    seat_number integer NOT NULL CHECK (seat_number > 0),
    UNIQUE (room_id, row, seat_number) 
);