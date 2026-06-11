# SpiceFlow — Frontend

React + TypeScript frontend for SpiceFlow, a business management system for spice sellers.

## Tech Stack

- React 18 + TypeScript
- Vite
- React Router DOM
- Zustand (global state)
- TanStack React Query (server state)
- Axios (HTTP client)
- React Hook Form + Zod (forms & validation)
- Recharts (charts)

## Prerequisites

- Node.js 20+
- npm 9+

## Getting Started

```bash
# Clone the repo
git clone git@github.com:YOUR_USERNAME/spiceflow-frontend.git

# Install dependencies
npm install

# Create local env file
cp .env.example .env.local
# Edit .env.local → set VITE_API_BASE_URL=http://localhost:8080

# Start dev server
npm run dev

App runs at: http://localhost:5173