ALTER TABLE tickets
    DROP CONSTRAINT IF EXISTS tickets_user_id_fkey,
    ALTER COLUMN user_id DROP NOT NULL,
    ALTER COLUMN user_id SET DEFAULT NULL,
    ALTER COLUMN user_id TYPE BIGINT USING user_id::BIGINT,
    ADD CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
