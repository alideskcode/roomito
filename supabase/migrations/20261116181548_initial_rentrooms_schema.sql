CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mobile TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('renter', 'owner', 'both')),
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.owner_submissions (
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
  submitted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.room_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.owner_submissions(id) ON DELETE CASCADE,
  blob_url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Room photo',
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.renter_requests (
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
  submitted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saved_rooms (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.owner_submissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, submission_id)
);

CREATE TABLE IF NOT EXISTS public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hits INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS owner_submissions_public_idx ON public.owner_submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS room_images_submission_idx ON public.room_images(submission_id, position);
CREATE INDEX IF NOT EXISTS renter_requests_status_idx ON public.renter_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS user_sessions_expiry_idx ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS password_resets_expiry_idx ON public.password_resets(expires_at);

INSERT INTO public.areas (name, is_pinned)
VALUES ('Graphic Era University', TRUE), ('Turner Road', TRUE), ('ISBT', TRUE)
ON CONFLICT (name) DO UPDATE SET is_pinned = TRUE;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renter_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.users,
  public.owner_submissions,
  public.room_images,
  public.renter_requests,
  public.saved_rooms,
  public.areas,
  public.rate_limits,
  public.user_sessions,
  public.password_resets
FROM PUBLIC, anon, authenticated;