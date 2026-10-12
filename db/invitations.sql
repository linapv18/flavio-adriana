CREATE TABLE IF NOT EXISTS invitations (
 id uuid PRIMARY KEY,
 source_key text NOT NULL UNIQUE,
 display_name varchar(200) NOT NULL,
 seats integer NOT NULL CHECK (seats BETWEEN 1 AND 20),
 token_hash char(64) NOT NULL UNIQUE,
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS invitation_responses (
 invitation_id uuid PRIMARY KEY REFERENCES invitations(id),
 attending boolean NOT NULL,
 party_size integer NOT NULL CHECK (party_size BETWEEN 0 AND 20),
 dietary_requirements varchar(1000) NOT NULL DEFAULT '',
 message varchar(2000) NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((attending AND party_size > 0) OR (NOT attending AND party_size = 0))
);
CREATE TABLE IF NOT EXISTS report_login_failures (
 client_hash char(64) NOT NULL,
 attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS report_login_failures_client_idx ON report_login_failures (client_hash, attempted_at);
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS sent_at timestamptz;
