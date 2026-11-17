CREATE TABLE public.user_auth_identities (
  provider TEXT NOT NULL CHECK (provider IN ('google')),
  provider_user_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, provider_user_id),
  UNIQUE (user_id, provider)
);

ALTER TABLE public.user_auth_identities ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.user_auth_identities FROM PUBLIC, anon, authenticated;