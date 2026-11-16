import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  var rentRoomsPool: Pool | undefined;
  var rentRoomsSchemaReady: Promise<void> | undefined;
}

const pool =
  globalThis.rentRoomsPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.VERCEL ? 1 : 5,
  });

if (process.env.NODE_ENV !== "production") globalThis.rentRoomsPool = pool;

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mobile TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('renter', 'owner', 'both')),
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS owner_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE,
  owner_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  area TEXT NOT NULL,
  address TEXT NOT NULL,
  rent INTEGER NOT NULL CHECK (rent > 0),
  security_deposit INTEGER NOT NULL CHECK (security_deposit >= 0),
  room_type TEXT NOT NULL CHECK (room_type IN ('Independent', 'Non-Independent')),
  audience TEXT NOT NULL DEFAULT 'Any' CHECK (audience IN ('Boys PG', 'Girls PG', 'Family', 'Any')),
  facilities TEXT[] NOT NULL DEFAULT '{}',
  distance_geu TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Cancelled', 'Booked')),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);
ALTER TABLE owner_submissions ADD COLUMN IF NOT EXISTS facilities TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE owner_submissions ADD COLUMN IF NOT EXISTS distance_geu TEXT NOT NULL DEFAULT '';
ALTER TABLE owner_submissions ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'Any';
CREATE TABLE IF NOT EXISTS room_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES owner_submissions(id) ON DELETE CASCADE,
  blob_url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Room photo',
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS renter_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  looking_for TEXT NOT NULL,
  room_type TEXT NOT NULL,
  preference TEXT NOT NULL,
  preferred_area TEXT NOT NULL,
  budget_min INTEGER NOT NULL DEFAULT 0,
  budget_max INTEGER NOT NULL DEFAULT 0,
  move_in_date TEXT NOT NULL DEFAULT '',
  people INTEGER NOT NULL DEFAULT 1,
  facilities TEXT[] NOT NULL DEFAULT '{}',
  other_requirement TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Closed')),
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS saved_rooms (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES owner_submissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, submission_id)
);
CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hits INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS user_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS owner_submissions_public_idx ON owner_submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS room_images_submission_idx ON room_images(submission_id, position);
CREATE INDEX IF NOT EXISTS renter_requests_status_idx ON renter_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS user_sessions_expiry_idx ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS password_resets_expiry_idx ON password_resets(expires_at);
INSERT INTO areas (name, is_pinned)
VALUES ('Graphic Era University', TRUE), ('Turner Road', TRUE), ('ISBT', TRUE)
ON CONFLICT (name) DO UPDATE SET is_pinned = TRUE;
`;

export async function ensureDatabase(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database is not configured. Add DATABASE_URL to .env.local.");
  }
  globalThis.rentRoomsSchemaReady ??= pool.query(schema).then(() => undefined).catch((error: unknown) => {
    globalThis.rentRoomsSchemaReady = undefined;
    throw error;
  });
  await globalThis.rentRoomsSchemaReady;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  await ensureDatabase();
  return pool.query<T>(text, values);
}

export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  await ensureDatabase();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
