# CarbonLane

Carbon footprint tracking for fast-food drive-throughs. A camera at the start and end records when cars enter and exit; the app computes idle time, fuel wasted, and CO₂ produced.

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL (or Snowflake Postgres) database

## Backend

1. **Create a virtual environment and install dependencies:**

   ```bash
   cd backend
   python -m venv backend_venv
   source backend_venv/bin/activate   # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure the database.** Create a `.env` file in `backend/`:

   ```
   DATABASE_URL=postgres://user:password@host:5432/postgres?sslmode=require
   DB_USERNAME='snowflake_admin'
   DB_PASSWORD=******
   ```

3. **Create the table and seed data (No need to rerun this, data already present):**

   ```bash
   python create_car_entries_table.py
   python seed_car_entries.py
   ```

4. **Start the Flask server:**
   ```bash
   python app.py
   ```
   The API runs at `http://localhost:8000`.

## Frontend

1. **Install dependencies:**

   ```bash
   cd frontend
   npm install
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```
   The app runs at `http://localhost:5173` and proxies `/api` to the backend.

## Quick Start

1. Start the backend: `cd backend && python app.py`
2. Start the frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173` in your browser.
