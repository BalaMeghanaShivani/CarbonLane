#!/usr/bin/env python3
"""
Flask API serving dashboard metrics from PostgreSQL car_entries table.
"""
import os
import random
from datetime import datetime, timezone

import psycopg2
from flask import Flask, jsonify, request
from flask_cors import CORS

from db import get_connection

app = Flask(__name__)

# In-memory carbon credits account (Cloverly mimic). 1 CO2 kg = 1 carbon credit.
# For production, persist to DB. Set CLOVERLY_API_KEY to use real Cloverly sandbox.
_carbon_credits_balance = 0.0
_carbon_credits_purchase_history = []


def _ts_iso_utc(dt):
    """Serialize datetime to ISO 8601 with UTC. DB stores UTC (Snowflake default)."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat().replace("+00:00", "Z")
CORS(app)

TREES_KG_PER_YEAR = 22


def _get_metrics_last_hours(conn, hours=2):
    """Get aggregated metrics for the last N hours, per hour."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                DATE_TRUNC('hour', enter_timestamp) AS hour,
                COUNT(*) AS total_cars,
                COALESCE(AVG(minutes_elapsed), 0) AS avg_minutes,
                COALESCE(SUM(carbon_produced), 0) / 1000.0 AS total_co2_kg,
                COALESCE(SUM(fuel_used), 0) AS fuel_grams
            FROM car_entries
            WHERE enter_timestamp >= NOW() - (%s::integer * INTERVAL '1 hour')
              AND exit_timestamp IS NOT NULL
            GROUP BY DATE_TRUNC('hour', enter_timestamp)
            ORDER BY hour DESC
        """, (hours,))
        return cur.fetchall()


def _get_all_time_metrics(conn, hours=24):
    """Get overall metrics for last N hours (or all time if hours=None)."""
    with conn.cursor() as cur:
        if hours:
            cur.execute("""
                SELECT
                    COUNT(*) AS total_cars,
                    COALESCE(AVG(minutes_elapsed), 0) AS avg_minutes,
                    COALESCE(SUM(carbon_produced), 0) / 1000.0 AS total_co2_kg,
                    COALESCE(SUM(fuel_used), 0) AS fuel_grams
                FROM car_entries
                WHERE enter_timestamp >= NOW() - (%s::integer * INTERVAL '1 hour')
                  AND exit_timestamp IS NOT NULL
            """, (hours,))
        else:
            cur.execute("""
                SELECT
                    COUNT(*) AS total_cars,
                    COALESCE(AVG(minutes_elapsed), 0) AS avg_minutes,
                    COALESCE(SUM(carbon_produced), 0) / 1000.0 AS total_co2_kg,
                    COALESCE(SUM(fuel_used), 0) AS fuel_grams
                FROM car_entries
                WHERE exit_timestamp IS NOT NULL
            """)
        return cur.fetchone()


def _get_peak_hour(conn, hours=168, tz="America/Los_Angeles"):
    """
    Find the 1-hour window with highest CO2. Returns time range like '4:00 – 5:00' in user's timezone.
    DB stores UTC; we convert to tz for display. Only returns if total_co2_kg > 0.
    """
    with conn.cursor() as cur:
        if hours:
            cur.execute("""
                SELECT
                    TO_CHAR(hour_local, 'HH24:MI') AS hour_start,
                    TO_CHAR(hour_local + INTERVAL '1 hour', 'HH24:MI') AS hour_end,
                    total_co2_kg
                FROM (
                    SELECT
                        DATE_TRUNC('hour', (enter_timestamp AT TIME ZONE 'UTC') AT TIME ZONE %s) AS hour_local,
                        COALESCE(SUM(carbon_produced), 0) / 1000.0 AS total_co2_kg
                    FROM car_entries
                    WHERE enter_timestamp >= NOW() - (%s::integer * INTERVAL '1 hour')
                      AND exit_timestamp IS NOT NULL
                    GROUP BY DATE_TRUNC('hour', (enter_timestamp AT TIME ZONE 'UTC') AT TIME ZONE %s)
                    HAVING COALESCE(SUM(carbon_produced), 0) > 0
                    ORDER BY total_co2_kg DESC
                    LIMIT 1
                ) sub
            """, (tz, hours, tz))
        else:
            cur.execute("""
                SELECT
                    TO_CHAR(hour_local, 'HH24:MI') AS hour_start,
                    TO_CHAR(hour_local + INTERVAL '1 hour', 'HH24:MI') AS hour_end,
                    total_co2_kg
                FROM (
                    SELECT
                        DATE_TRUNC('hour', (enter_timestamp AT TIME ZONE 'UTC') AT TIME ZONE %s) AS hour_local,
                        COALESCE(SUM(carbon_produced), 0) / 1000.0 AS total_co2_kg
                    FROM car_entries
                    WHERE exit_timestamp IS NOT NULL
                    GROUP BY DATE_TRUNC('hour', (enter_timestamp AT TIME ZONE 'UTC') AT TIME ZONE %s)
                    HAVING COALESCE(SUM(carbon_produced), 0) > 0
                    ORDER BY total_co2_kg DESC
                    LIMIT 1
                ) sub
            """, (tz, tz))
        row = cur.fetchone()
    if not row or not row[0] or (row[2] or 0) <= 0:
        return ""
    return f"{row[0]}-{row[1]}"


def _get_emissions_timeseries(conn, bucket_minutes=5):
    """
    Time-series of CO2 for the last 1 hour from the latest exit_timestamp.
    Each complete record (has exit_timestamp) contributes its carbon_produced to the bucket
    where its exit_timestamp falls. Returns 5-min buckets by default.
    """
    with conn.cursor() as cur:
        cur.execute("""
            WITH latest_exit AS (
                SELECT COALESCE(MAX(exit_timestamp), NOW()) AS latest
                FROM car_entries
                WHERE exit_timestamp IS NOT NULL
            ),
            bounds AS (
                SELECT
                    (SELECT latest FROM latest_exit) - INTERVAL '1 hour' AS start_time,
                    (SELECT latest FROM latest_exit) AS end_time
            ),
            buckets AS (
                SELECT generate_series(
                    (SELECT start_time FROM bounds),
                    (SELECT end_time FROM bounds) - (%s::integer * INTERVAL '1 minute'),
                    %s::integer * INTERVAL '1 minute'
                ) AS bucket_start
            )
            SELECT
                TO_CHAR(b.bucket_start, 'HH24:MI') AS time,
                ROUND((COALESCE(SUM(c.carbon_produced), 0) / 1000.0)::numeric, 2) AS co2_kg
            FROM buckets b
            LEFT JOIN car_entries c
                ON c.exit_timestamp >= b.bucket_start
                AND c.exit_timestamp < b.bucket_start + (%s::integer * INTERVAL '1 minute')
                AND c.exit_timestamp IS NOT NULL
            GROUP BY b.bucket_start
            ORDER BY b.bucket_start
        """, (bucket_minutes, bucket_minutes, bucket_minutes))
        rows = cur.fetchall()
    return [{"time": r[0], "co2_kg": float(r[1])} for r in rows]


def _get_idle_distribution(conn):
    """
    Count complete records by idle time bucket (minutes_elapsed).
    Buckets: <5 mins, 5-10 mins, 10+ mins
    """
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                SUM(CASE WHEN minutes_elapsed < 5 THEN 1 ELSE 0 END) AS bucket_under_5,
                SUM(CASE WHEN minutes_elapsed >= 5 AND minutes_elapsed < 10 THEN 1 ELSE 0 END) AS bucket_5_10,
                SUM(CASE WHEN minutes_elapsed >= 10 THEN 1 ELSE 0 END) AS bucket_10_plus
            FROM car_entries
            WHERE exit_timestamp IS NOT NULL AND minutes_elapsed IS NOT NULL
        """)
        row = cur.fetchone()
    if not row:
        return []
    return [
        {"range": "<5 mins", "count": row[0] or 0},
        {"range": "5-10 mins", "count": row[1] or 0},
        {"range": "10+ mins", "count": row[2] or 0},
    ]


def _get_hotspots_grid(conn, tz="America/Los_Angeles"):
    """
    CO2 aggregated by day-of-week (0=Mon, 6=Sun) and hour (0-23).
    Returns 7x24 grid: grid[day][hour] = co2_kg.
    Converts enter_timestamp from UTC to target timezone for bucketing (matches user's local view).
    """
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                EXTRACT(ISODOW FROM ((enter_timestamp AT TIME ZONE 'UTC') AT TIME ZONE %s))::int - 1 AS day,
                EXTRACT(HOUR FROM ((enter_timestamp AT TIME ZONE 'UTC') AT TIME ZONE %s))::int AS hour,
                COALESCE(SUM(carbon_produced), 0) / 1000.0 AS co2_kg
            FROM car_entries
            WHERE exit_timestamp IS NOT NULL
            GROUP BY 1, 2
        """, (tz, tz))
        rows = cur.fetchall()
    grid = [[0.0] * 24 for _ in range(7)]
    for day, hour, co2_kg in rows:
        if 0 <= day <= 6 and 0 <= hour <= 23:
            grid[day][hour] = round(float(co2_kg), 2)
    return grid


def _get_hourly_trends(conn, hours=24):
    """Get hourly aggregates for charts (last N hours, or all time if empty)."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                TO_CHAR(DATE_TRUNC('hour', enter_timestamp), 'HH24:00') AS hour,
                COUNT(*) AS total_cars,
                COALESCE(SUM(minutes_elapsed * 60), 0)::bigint AS total_idle_seconds
            FROM car_entries
            WHERE enter_timestamp >= NOW() - (%s::integer * INTERVAL '1 hour')
              AND exit_timestamp IS NOT NULL
            GROUP BY DATE_TRUNC('hour', enter_timestamp)
            ORDER BY hour
        """, (hours,))
        rows = cur.fetchall()
    return [{"hour": r[0], "total_cars": r[1], "total_idle_seconds": r[2]} for r in rows]


def _compute_efficiency_score(total_co2_kg, avg_minutes, total_cars):
    """
    Efficiency 0-100: lower CO2 and idle = higher score.
    Formula: score = 100 - co2_penalty - idle_penalty
      co2_penalty = min(50, co2_per_vehicle_kg * 30)
      idle_penalty = min(40, avg_minutes * 4)
    Min score from formula is 10 (max penalties 50+40=90). Floor at 1 when we have data.
    """
    total_cars = float(total_cars or 0)
    total_co2_kg = float(total_co2_kg or 0)
    avg_minutes = float(avg_minutes or 0)
    if total_cars == 0:
        return 100.0
    co2_per_vehicle = total_co2_kg / total_cars
    co2_penalty = min(50, co2_per_vehicle * 30)
    idle_penalty = min(40, avg_minutes * 4)
    score = max(1, min(100, 100 - co2_penalty - idle_penalty))
    return round(float(score), 1)


def _pct_change(current, prev):
    if prev == 0:
        return 0
    return round(((current - prev) / prev) * 100)


@app.route("/car-entries/enter", methods=["POST"])
def car_enter():
    """Simulate car entering drive-through. Creates record with enter_timestamp, exit_timestamp=null."""
    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    try:
        data = request.get_json() or {}
        numberplate = data.get("numberplate") or f"SIM-{random.randint(10000, 99999)}"
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO car_entries (numberplate, enter_timestamp, exit_timestamp)
                VALUES (%s, NOW(), NULL)
                RETURNING entry_id, numberplate, enter_timestamp
                """,
                (numberplate,),
            )
            row = cur.fetchone()
            conn.commit()
        return jsonify({"entry_id": row[0], "numberplate": row[1], "enter_timestamp": _ts_iso_utc(row[2])})
    except psycopg2.Error as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/car-entries/exit", methods=["POST"])
def car_exit():
    """Simulate car leaving. Updates the car waiting longest (FIFO) with exit_timestamp."""
    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE car_entries
                SET exit_timestamp = NOW()
                WHERE entry_id = (
                    SELECT entry_id FROM car_entries
                    WHERE exit_timestamp IS NULL
                    ORDER BY enter_timestamp ASC
                    LIMIT 1
                )
                RETURNING entry_id, numberplate, enter_timestamp, exit_timestamp
                """
            )
            row = cur.fetchone()
            conn.commit()
        if not row:
            return jsonify({"error": "No car in drive-through to exit"}), 400
        return jsonify({
            "entry_id": row[0],
            "numberplate": row[1],
            "enter_timestamp": _ts_iso_utc(row[2]),
            "exit_timestamp": _ts_iso_utc(row[3]),
        })
    except psycopg2.Error as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/car-entries")
def car_entries_list():
    """Recent car entries, order by enter_timestamp desc. Includes entries without exit."""
    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    try:
        limit = request.args.get("limit", 100, type=int)
        limit = min(max(limit, 1), 500)
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    numberplate,
                    enter_timestamp,
                    exit_timestamp,
                    minutes_elapsed,
                    fuel_used,
                    carbon_produced
                FROM car_entries
                WHERE enter_timestamp IS NOT NULL
                ORDER BY enter_timestamp DESC
                LIMIT %s
                """,
                (limit,),
            )
            rows = cur.fetchall()
        return jsonify([
            {
                "numberplate": r[0],
                "enter_timestamp": _ts_iso_utc(r[1]) if r[1] else None,
                "exit_timestamp": _ts_iso_utc(r[2]) if r[2] else None,
                "minutes_elapsed": round(float(r[3]), 2) if r[3] is not None else None,
                "fuel_used": round(float(r[4]), 2) if r[4] is not None else None,
                "carbon_produced": round(float(r[5]), 2) if r[5] is not None else None,
            }
            for r in rows
        ])
    except psycopg2.Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/car-entries/pending")
def car_pending():
    """Cars currently in drive-through (exit_timestamp is null)."""
    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT entry_id, numberplate, enter_timestamp
                FROM car_entries
                WHERE exit_timestamp IS NULL
                ORDER BY enter_timestamp ASC
                """
            )
            rows = cur.fetchall()
        return jsonify([{"entry_id": r[0], "numberplate": r[1], "enter_timestamp": _ts_iso_utc(r[2])} for r in rows])
    except psycopg2.Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/metrics")
def metrics():
    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    try:
        hourly = _get_metrics_last_hours(conn, hours=24)
        all_time = _get_all_time_metrics(conn, hours=24)
        if all_time and all_time[0] == 0:
            all_time = _get_all_time_metrics(conn, hours=None)

        total_cars, avg_minutes, total_co2_kg, fuel_grams = all_time or (0, 0, 0, 0)

        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM car_entries WHERE enter_timestamp IS NOT NULL AND exit_timestamp IS NULL"
            )
            cars_in_drive_through = cur.fetchone()[0] or 0

        trees_required = round(total_co2_kg / TREES_KG_PER_YEAR, 1) if total_co2_kg else 0
        co2_per_vehicle = (total_co2_kg / total_cars) if total_cars else 0

        # Efficiency score: last 2 hours if available, else all-time (so seed data always counts)
        last_hr = hourly[0] if hourly else None
        if last_hr:
            _, lh_cars, lh_avg_min, lh_co2_kg, lh_fuel = last_hr
            sustainability_score = _compute_efficiency_score(lh_co2_kg, lh_avg_min, lh_cars)
        else:
            sustainability_score = _compute_efficiency_score(total_co2_kg, avg_minutes, total_cars) if total_cars else 100

        # vs last hr trends
        vehicles_trend = {"value": 0, "isPositive": False}
        co2_trend = {"value": 0, "isPositive": False}
        idle_trend = {"value": 0, "isPositive": False}

        if len(hourly) >= 2:
            curr = hourly[0]
            prev = hourly[1]
            curr_cars, curr_avg_min, curr_co2, _ = curr[1], curr[2], curr[3], curr[4]
            prev_cars, prev_avg_min, prev_co2, _ = prev[1], prev[2], prev[3], prev[4]

            v = _pct_change(curr_cars, prev_cars)
            vehicles_trend = {"value": abs(v), "isPositive": v > 0}

            c = _pct_change(curr_co2, prev_co2)
            co2_trend = {"value": abs(c), "isPositive": c < 0}

            curr_idle_sec = curr_avg_min * 60 * curr_cars if curr_cars else 0
            prev_idle_sec = prev_avg_min * 60 * prev_cars if prev_cars else 0
            i = _pct_change(curr_idle_sec, prev_idle_sec)
            idle_trend = {"value": abs(i), "isPositive": i < 0}

        tz = request.args.get("tz", "America/Los_Angeles")
        peak_hour = _get_peak_hour(conn, hours=168, tz=tz)
        if not peak_hour:
            peak_hour = _get_peak_hour(conn, hours=None, tz=tz)

        return jsonify({
            "total_cars": total_cars,
            "avg_idle_minutes": round(avg_minutes, 1),
            "total_co2_kg": round(total_co2_kg, 1),
            "trees_required": trees_required,
            "sustainability_score": sustainability_score,
            "fuel_wasted_grams": round(fuel_grams, 1),
            "co2_per_vehicle_kg": round(co2_per_vehicle, 3),
            "peak_hour": peak_hour,
            "cars_in_drive_through": cars_in_drive_through,
            "trends": {
                "vehicles": vehicles_trend,
                "co2": co2_trend,
                "idle": idle_trend,
            },
        })
    except psycopg2.Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/emissions-timeseries")
def emissions_timeseries():
    """Last 1 hour from latest exit_timestamp, 5-min buckets, CO2 per bucket."""
    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    try:
        data = _get_emissions_timeseries(conn, bucket_minutes=5)
        return jsonify(data)
    except psycopg2.Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/hotspots")
def hotspots():
    """CO2 heatmap grid: 7 days x 24 hours, values in kg. ?tz=America/Los_Angeles for local time."""
    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    try:
        tz = request.args.get("tz", "America/Los_Angeles")
        grid = _get_hotspots_grid(conn, tz=tz)
        return jsonify({"grid": grid})
    except psycopg2.Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/idle-distribution")
def idle_distribution():
    """Count of complete records by idle time bucket (<5 mins, 5-10 mins, 10+ mins)."""
    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    try:
        data = _get_idle_distribution(conn)
        return jsonify(data)
    except psycopg2.Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route("/trends")
def trends():
    try:
        conn = get_connection()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    try:
        data = _get_hourly_trends(conn)
        return jsonify(data)
    except psycopg2.Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


# --- Go Carbon Neutral: Cloverly-mimic carbon credits (1 CO2 kg = 1 credit) ---

@app.route("/carbon-neutral/account")
def carbon_neutral_account():
    """Get carbon credits balance and purchase history."""
    global _carbon_credits_balance, _carbon_credits_purchase_history
    return jsonify({
        "credits_balance": round(_carbon_credits_balance, 2),
        "purchase_history": list(_carbon_credits_purchase_history[-20:]),  # last 20
    })


@app.route("/carbon-neutral/purchase", methods=["POST"])
def carbon_neutral_purchase():
    """
    Purchase carbon credits. 1 CO2 kg = 1 carbon credit.
    Mimics Cloverly API - in sandbox mode we simulate; with CLOVERLY_API_KEY we could call real API.
    """
    global _carbon_credits_balance, _carbon_credits_purchase_history
    try:
        data = request.get_json() or {}
        credits = float(data.get("credits", 0))
        if credits <= 0:
            return jsonify({"error": "Credits must be a positive number"}), 400
        if credits > 10000:
            return jsonify({"error": "Maximum 10,000 credits per purchase"}), 400

        # Simulate Cloverly purchase (sandbox mode)
        cloverly_key = os.environ.get("CLOVERLY_API_KEY")
        if cloverly_key:
            # TODO: Call Cloverly API when key is set
            pass

        _carbon_credits_balance += credits
        record = {
            "credits": credits,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "balance_after": round(_carbon_credits_balance, 2),
        }
        _carbon_credits_purchase_history.append(record)

        return jsonify({
            "success": True,
            "credits_purchased": credits,
            "new_balance": round(_carbon_credits_balance, 2),
            "message": "Carbon credits purchased successfully (simulated)",
        })
    except (ValueError, TypeError) as e:
        return jsonify({"error": "Invalid credits value"}), 400


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
