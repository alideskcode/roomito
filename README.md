# Rent Rooms Dehradun

A mobile-first Next.js room-brokering website with public listings, renter and owner accounts, private admin tools, Supabase Postgres, and Vercel Blob photos.

## Local setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` in the project root.
3. In the Supabase Dashboard, open **Connect** and copy a Postgres connection string. Use the session pooler for local development on IPv4-only networks. For Vercel serverless functions, use the transaction pooler connection string. Replace `[YOUR-PASSWORD]` with your database password, URL-encoding reserved characters.
4. Put the connection string in `.env.local` as `DATABASE_URL`. Fill in the other required values:

   ```dotenv
   DATABASE_URL=                 # Supabase Postgres connection string
   BLOB_READ_WRITE_TOKEN=        # Vercel Blob read/write token
   NEXT_PUBLIC_SITE_URL=         # Public URL, for example https://your-domain.example
   GOOGLE_CLIENT_ID=             # Google Cloud OAuth web client ID
   GOOGLE_CLIENT_SECRET=         # Google Cloud OAuth web client secret (server only)
   GOOGLE_REDIRECT_URI=          # http://localhost:3000/api/auth/google/callback locally
   RENTROOMS_ADMIN_EMAIL=        # Admin login email
   RENTROOMS_ADMIN_PASSWORD=     # Strong, unique admin password
   RENTROOMS_SESSION_SECRET=     # Random secret of at least 32 characters
   RESEND_API_KEY=               # Resend API key for password reset
   RESEND_FROM_EMAIL=            # Verified sender address in Resend
   ```

   Keep `.env.local` private and never commit it. Generate a session secret with:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. Apply the database schema migration from the project root:

   ```powershell
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

   Find the project reference in the Supabase Dashboard URL or Project Settings. The migration creates the application tables and indexes, seeds the pinned areas, and enables row-level security. The app uses a private server-side Postgres connection; no Data API policies are created, so public/anonymous API access to these tables remains denied.
6. Install dependencies and start the app:

   ```powershell
   npm install
   npm run dev
   ```

The public pages render without database configuration. Account, room, and admin features require the Supabase Postgres connection string and migrations above. The app does not create database tables at runtime. The initial migration creates a new, empty application schema; it does not transfer existing users, room listings, requests, or saved rooms from another database.

## Deploy to Vercel

1. Add the environment variables above to the Vercel project settings for Production (and Preview if desired). Set `DATABASE_URL` to the Supabase transaction-pooler connection string for serverless deployments. Store `GOOGLE_CLIENT_SECRET` as a server-side environment variable, never a `NEXT_PUBLIC_` variable.
2. Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS deployment URL.
3. Import this project into Vercel and deploy.
4. Open `/admin/login` and sign in with the configured admin email and password.

Email/password authentication is handled by Roomito using bcrypt password hashes in the private application database. Password reset links are delivered through Resend; configure a verified sender before using that flow.

### Authentication setup

1. In Google Cloud, create an OAuth 2.0 **Web application** client. Set its authorized redirect URIs to:

   ```text
   https://roomito.in/api/auth/google/callback
   http://localhost:3000/api/auth/google/callback
   ```

   Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` in `.env.local` and Vercel. Use the production URI for `GOOGLE_REDIRECT_URI` on Vercel and the localhost URI locally. Google authentication is handled directly by Roomito; Supabase Auth is not used.

2. Apply pending database migrations with `supabase db push` before deploying. Google accounts are linked to Roomito accounts by Google's verified email; new Google users provide a 10-digit mobile number.

## Important behavior

- Only signed-in users can submit room listings. Signed-out visitors are prompted to log in or create an account, and the listing API also requires a valid session.
- Public listing queries return only approved/booked room fields; owner names, owner mobile numbers and exact addresses remain admin-only.
- Photos are stored privately in Vercel Blob and served through an access-checked image route. Approved/booked listing photos are public through the app; pending/cancelled photos require admin access.
- Room images are converted to WebP, resized to at most 1200 px and compressed below 300,000 bytes before upload.
- To add photos to an already-approved room, open the admin dashboard's Rooms tab and use Add room photos. Existing submissions are not uploaded automatically when Blob is configured later.
- Email/password accounts use bcrypt hashes stored in the private Roomito database. Roomito uses HTTP-only app sessions for room, request, and dashboard access; Google OAuth is verified server-side and linked by verified email.
- Brokerage is 50% of one month's rent. Public broker contact: +91 98372 74296 and @rentroomsdehradun.

## Checks

```powershell
npm run typecheck
npm run lint
npm run build
```
