-- Create the authors table
CREATE TABLE authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create the reference_authors table
CREATE TABLE reference_authors (
    reference_id UUID NOT NULL,
    author_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (reference_id, author_id),
    FOREIGN KEY (reference_id) REFERENCES references(id),
    FOREIGN KEY (author_id) REFERENCES authors(id)
);

-- Migrate the data from the references table
DO $$
DECLARE
    ref RECORD;
    author_name TEXT;
    author_id UUID;
BEGIN
    FOR ref IN SELECT id, authors FROM references LOOP
        FOR author_name IN SELECT jsonb_array_elements_text(ref.authors) LOOP
            -- Check if the author already exists
            SELECT id INTO author_id FROM authors WHERE name = author_name;

            -- If the author does not exist, create it
            IF author_id IS NULL THEN
                INSERT INTO authors (name) VALUES (author_name) RETURNING id INTO author_id;
            END IF;

            -- Create a new record in the reference_authors table
            INSERT INTO reference_authors (reference_id, author_id) VALUES (ref.id, author_id);
        END LOOP;
    END LOOP;
END $$;

-- Remove the authors column from the references table
ALTER TABLE references DROP COLUMN authors;
