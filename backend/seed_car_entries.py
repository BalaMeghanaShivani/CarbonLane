#!/usr/bin/env python3
"""
Script to add dummy data to car_entries table and display it.
"""

import os
import random
import sys
from datetime import datetime, timedelta

# Load .env file from script directory
from pathlib import Path
_env_path = Path(__file__).resolve().parent / ".env"
if _env_path.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(_env_path)
    except ImportError:
        for line in _env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                value = value.strip().strip("'\"").strip()
                if key.strip():
                    os.environ.setdefault(key.strip(), value)

try:
    import psycopg2
except ImportError:
    print("Error: psycopg2 is required. Install with: pip install psycopg2-binary")
    sys.exit(1)


def get_connection():
    """Create database connection using environment variables."""
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        conn_string = database_url
    else:
        username = os.environ.get("DB_USERNAME")
        url = os.environ.get("DB_URL")
        password = os.environ.get("DB_PASSWORD")
        if not all([username, url, password]):
            print("Error: Set DATABASE_URL or DB_USERNAME, DB_URL, DB_PASSWORD in .env")
            sys.exit(1)
        host = url.replace("https://", "").replace("http://", "").split("/")[0]
        if ":" not in host:
            host = f"{host}:5432"
        db_name = os.environ.get("DB_NAME", "postgres")
        conn_string = f"postgresql://{username}:{password}@{host}/{db_name}?sslmode=require"

    try:
        return psycopg2.connect(conn_string)
    except psycopg2.Error as e:
        print(f"Connection failed: {e}")
        sys.exit(1)


def insert_dummy_data(conn):
    """Insert dummy car entries. Enter/exit timestamps are 3-20 minutes apart."""
    dummy_entries = []
    base_times = [
        datetime.now() - timedelta(minutes=45),
        datetime.now() - timedelta(minutes=30),
        datetime.now() - timedelta(minutes=20),
        datetime.now() - timedelta(minutes=15),
        datetime.now() - timedelta(minutes=8),
    ]
    plates = ["ABC1234", "XYZ5678", "DEF9012", "GHI3456", "JKL7890"]
    for plate, enter in zip(plates, base_times):
        duration_mins = random.randint(3, 20)
        exit_ts = enter + timedelta(minutes=duration_mins)
        dummy_entries.append((plate, enter, exit_ts))
    with conn.cursor() as cur:
        cur.executemany(
            """
            INSERT INTO car_entries (numberplate, enter_timestamp, exit_timestamp)
            VALUES (%s, %s, %s)
            """,
            dummy_entries,
        )
        conn.commit()
    print(f"Inserted {len(dummy_entries)} dummy entries.\n")


def view_data(conn):
    """Query and display all car entries."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT entry_id, numberplate, enter_timestamp, exit_timestamp, minutes_elapsed, fuel_used, carbon_produced
            FROM car_entries
            ORDER BY entry_id
            """
        )
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]

    # Print table
    col_widths = [max(len(str(col)), 10) for col in columns]
    for row in rows:
        for j, val in enumerate(row):
            col_widths[j] = max(col_widths[j], len(str(val)) if val is not None else 4)

    header = " | ".join(str(c).ljust(col_widths[i]) for i, c in enumerate(columns))
    separator = "-+-".join("-" * w for w in col_widths)
    print(header)
    print(separator)
    for row in rows:
        cells = [str(v) if v is not None else "NULL" for v in row]
        print(" | ".join(cells[i].ljust(col_widths[i]) for i in range(len(cells))))
    print(f"\nTotal rows: {len(rows)}")


def main():
    conn = get_connection()
    try:
        insert_dummy_data(conn)
        view_data(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
