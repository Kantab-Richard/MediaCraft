# MediCraft

MediCraft is a full-stack media workflow app for downloading, organizing, and processing social media content.

It combines:
- a `Next.js` frontend in `frontend/`
- a `NestJS` backend in `backend/`
- PostgreSQL via Prisma
- workspace projects and saved download history
- multi-platform video/audio download support
- installable PWA support

## What It Does

- Download video or audio from supported social platforms
- Choose output quality and format
- Preview processed media in the app
- Save downloads into workspace projects
- Track recent download history
- Manage accounts, keys, and admin data
- Open the app as a PWA where supported

## Repository Structure

```text
MediCraft/
├── backend/     # NestJS API, Prisma schema, download pipeline
├── frontend/    # Next.js app, workspace UI, PWA support
├── README.md    # Main project overview
├── READ.ME      # Legacy note file
└── RUN.ME       # Quick local startup guide
```

## Local Development

### Backend

```powershell
cd backend
npm install
npm run dev
```

Runs on:
- `http://localhost:3001`

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Runs on:
- `http://localhost:3000`

## Environment Variables

### Backend example

Create `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5200/MediCraft_DB?schema=public"
ALLOWED_ORIGINS="http://localhost:3000"
NODE_ENV="development"
PORT=3001
PUBLIC_MAX_DURATION=18000
GOOGLE_CLIENT_ID="your-google-client-id"
```

### Frontend example

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## Database Setup

From `backend/`:

```powershell
npx prisma generate
npx prisma migrate deploy
```

Optional admin seed:

```powershell
npm run seed:admin
```

## Deployment Notes

This project is best suited to infrastructure that supports:
- Node.js frontend and backend processes
- PostgreSQL
- ffmpeg / yt-dlp
- local or mounted file storage

A VPS is the safest default deployment target for the current stack.

## Stack

- Frontend: Next.js, React, Tailwind CSS, Framer Motion
- Backend: NestJS, Prisma, PostgreSQL
- Media tooling: yt-dlp, ffmpeg
- Auth/workspace: API key auth, user accounts, saved projects

