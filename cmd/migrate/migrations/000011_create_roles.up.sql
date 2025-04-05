CREATE TABLE IF NOT EXISTS roles (
                                     id bigserial PRIMARY KEY,
                                     name varchar(255) NOT NULL UNIQUE,
                                     level int NOT NULL DEFAULT 0,
                                     description text
);

INSERT INTO roles (name, description , level) VALUES ('user', 'A user can find and buy tickets', 1);

INSERT INTO roles (name, description , level)  VALUES ('admin', 'A admin can update and delete movies, sessions, tickets', 2);