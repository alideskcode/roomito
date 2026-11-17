# Rent Rooms Dehradun

A mobile-first Next.js room-brokering website with public listings, renter and owner accounts, private admin tools, Supabase Postgres, and Vercel Blob photos.

## Local setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` in the project root.
3. In the Supabase Dashboard, open **Connect** and copy a Postgres connection string. Use the session pooler for local development on IPv4-only networks. For Vercel serverless functions, use the transaction pooler connection string. Replace `[YOUR-PASSWORD]` with your database password, URL-encoding reserved characters.
4. Put the connection string in `.env.local` as `DATABASE_URL`. Fill in the other required values:

   ```dotenv
   DATABASE_URL=                 # Supabase Postgres connection string
   NEXT_PUBLIC_SUPABASE_URL=     # Supabase project URL
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # Supabase publishable key
   BLOB_READ_WRITE_TOKEN=        # Vercel Blob read/write token
   NEXT_PUBLIC_SITE_URL=         # Public URL, for example https://your-domain.example
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

The public pages render without database configuration. Account, room, and admin features require the Supabase Postgres connection string and the migration above. The app does not create database tables at runtime. The migration creates a new, empty application schema; it does not transfer existing users, room listings, requests, or saved rooms from another database.

## Deploy to Vercel

1. Add all ten environment variables above to the Vercel project settings for Production (and Preview if desired). Set `DATABASE_URL` to the Supabase transaction-pooler connection string for serverless deployments.
2. Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS deployment URL.
3. Import this project into Vercel and deploy.
4. Open `/admin/login` and sign in with the configured admin email and password.

Password reset links are delivered through Resend; configure a verified sender address before enabling that flow.

### Google sign-in setup

1. In Supabase, enable **Authentication → Sign In / Providers → Google** and add the Google OAuth client ID and secret.
2. In Google Cloud, enable the OpenID `openid` scope, add `https://roomito.in` as an authorized JavaScript origin, and add this authorized redirect URI:

   ```text
   https://zpgwytdbxvxfockjnsgn.supabase.co/auth/v1/callback
   ```

3. In Supabase **Authentication → URL Configuration**, set the Site URL to `https://roomito.in` and add `https://roomito.in/auth/callback` to the redirect URL allow list. Add your local development callback (`http://localhost:3000/auth/callback`) if needed.
4. Apply the database migration with `supabase db push` before deploying. Google accounts matching an existing Roomito email are linked; new accounts are created as renters after the user provides a 10-digit mobile number.

## Important behavior

- Only signed-in users can submit room listings. Signed-out visitors are prompted to log in or create an account, and the listing API also requires a valid session.
- Public listing queries return only approved/booked room fields; owner names, owner mobile numbers and exact addresses remain admin-only.
- Photos are stored privately in Vercel Blob and served through an access-checked image route. Approved/booked listing photos are public through the app; pending/cancelled photos require admin access.
- Room images are converted to WebP, resized to at most 1200 px and compressed below 300,000 bytes before upload.
- To add photos to an already-approved room, open the admin dashboard's Rooms tab and use Add room photos. Existing submissions are not uploaded automatically when Blob is configured later.
- Sign-in cookies are HTTP-only; user passwords use bcrypt hashes; admin/user authentication and form endpoints are rate-limited.
- Brokerage is 50% of one month's rent. Public broker contact: +91 98372 74296 and @rentroomsdehradun.

## Checks

```powershell
npm run typecheck
npm run lint
npm run build
```
