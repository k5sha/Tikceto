ALTER TABLE movies ADD COLUMN slug varchar(255) UNIQUE;

UPDATE movies
SET slug = lower(regexp_replace(title, '\s+', '-', 'g'));

ALTER TABLE movies ALTER COLUMN slug SET NOT NULL;
