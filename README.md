# CarbonLane

## About the Project

# CarbonLane

**CarbonLane** helps fast-food businesses measure and offset the carbon footprint of their drive-through operations by turning idling cars into measurable climate data.

---

### 1. Climate Action

Idling cars in drive-throughs are an underrated carbon leak. Every minute a car sits with its engine running burns fuel and emits CO₂. Most businesses have no visibility into this. CarbonLane changes that:

- **Measure** – We track when cars enter and exit the drive-through, compute idle time, and quantify emissions (fuel wasted + CO₂ produced).
- **Visualize** – A real-time dashboard shows total emissions, peak hours, efficiency scores, and carbon hotspots by day and hour.
- **Offset** – Businesses can purchase carbon credits via Cloverly or fund tree planting through vetted organizations (One Tree Planted, Arbor Day Foundation), turning measurement into action.

### 2. Built for Business: Low-Cost, Fast, and Actionable

We don’t just help businesses _learn_ their footprint — we make it practical to act on it:

| Benefit                    | How                                                                |
| -------------------------- | ------------------------------------------------------------------ |
| **Zero API cost**          | On-device AI using ExecuTorch — no cloud APIs, no per-request fees |
| **Fast latency**           | Inference runs locally on device —no network round-trips           |
| **Path to carbon neutral** | Cloverly carbon credits + tree-planting partners for offsetting    |

### 3. On-Device AI: ExecuTorch on Raspberry Pi & iOS

We demonstrate **ExecuTorch** on **both** Raspberry Pi 4 and iOS Mobile device — showcasing the potential of this ML runtime for edge deployment:

- **Raspberry Pi 4** – Two Logitech cameras at drive-through entry/exit; YOLO + OCR run on-device to detect cars and license plates.
- **iOS** – Same YOLO + OCR stack runs on iPhone/iPad for portable or mobile deployment.

---

### Emissions Model

- 1 minute idling = 12g fuel
- 12g fuel = 27g CO₂
- 1 Cloverly carbon credit = 1 kg CO₂
- 1 mature tree absorbs 22 kg CO₂ per year

#### Scenario: One Busy Drive-Through

**Assumptions**

- 300 cars per day
- 7 minutes average idle time

**Daily Impact**

- 300 × 7 = 2,100 idle minutes per day
- 2,100 × 27 g = 56,700 g CO₂ per day
- = 56.7 kg CO₂ per day

**Annual Impact**

- 56.7 × 365 = 20,696 kg CO₂ per year
- = 20.7 metric tons annually

**Offset Equivalent**

- 20,696 carbon credits to go carbon neutral, or plant 941 trees

A single drive-through lane can produce over **20 metric tons of CO₂ per year** from idling alone. CarbonLane makes this measurable and actionable.

CarbonLane turns overlooked carbon leaks into measurable climate action.

## Setup

### Prerequisites

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
