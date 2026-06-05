# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RPNMore is a marketing website for a UAE-Africa business platform. It has a Vite-built static frontend and a Node.js/Express backend with PostgreSQL.

## Development Commands

### Frontend
- `npm run dev` — Start the Vite development server (listens on `0.0.0.0:5173`, proxies `/api` and `/admin` to `localhost:3000`)
- `npm run build` — Build the site for production into `dist/`
- `npm run preview` — Preview the production build locally

### Backend
- `cd backend && npm run dev` — Start the Express backend with file watching (port `3000`)
- `cd backend && npm run start` — Start the Express backend in production mode
- `cd backend && npm run db:migrate` — Run Prisma migrations (interactive, for development)
- `cd backend && npm run db:deploy` — Run Prisma migrations (non-interactive, for production/Docker)
- `cd backend && npm run db:studio` — Open Prisma Studio to browse the database
- `cd backend && node scripts/hash-password.js <password>` — Generate a bcrypt hash for `ADMIN_PASSWORD_HASH`

### Full Stack (with Docker)
- `docker-compose up` — Start the backend API and PostgreSQL database (API on port `3000`, DB on `5432`)

## Architecture

### Frontend
- **Vite** handles the build. It processes `index.html` as the entry point and bundles `style.css` and `main.js` with hashed filenames in `dist/assets/`.
- Each page is a standalone HTML file in the repository root sharing `style.css` and `main.js`.
- Images in `public/` are copied verbatim to `dist/` during the build.

### Backend (`/backend`)
- **Express.js** server serves the API, admin dashboard, and production frontend static files.
- **Prisma ORM** manages PostgreSQL schema and queries.
- **Session-based auth** protects the CMS API and admin dashboard.

### Database Schema
- **Lead tables**: `ContactLead`, `CarLead`, `PropertyLead`, `AiLead` — store form submissions.
- **CMS tables**: `BlogPost`, `CarListing`, `PropertyListing`, `Testimonial` — managed via the admin dashboard.

### API Endpoints
- `POST /api/leads/{contact|car|property|ai}` — Public form submission endpoints
- `GET /api/leads/{contact|car|property|ai}` — Admin: list leads
- `POST /api/auth/login` — Admin login
- `POST /api/auth/logout` — Admin logout
- `/api/cms/*` — CRUD for CMS content (requires admin auth)

### Admin Dashboard
- Available at `/admin` when the backend is running.
- Default login: `admin` / `admin` (unless `ADMIN_PASSWORD_HASH` is set).
- Provides lead viewing and CMS management for blog posts, car listings, property listings, and testimonials.

### Form Submission Flow
1. User fills out any form on the site.
2. `main.js` intercepts the submit event and `fetch()` POSTs the data to the backend API.
3. The form data is also formatted into a WhatsApp message and redirected to `wa.me` as before.
4. If the backend is unavailable, the WhatsApp redirect still fires so no leads are lost.

### Deployment
- `Dockerfile` builds the frontend with Vite, then packages the Express backend with the built assets.
- `docker-compose.yml` runs the backend API and a PostgreSQL container.
- The backend server serves the frontend from `dist/` and handles SPA fallback to `index.html`.
