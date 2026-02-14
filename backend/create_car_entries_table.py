#!/usr/bin/env python3
"""
Script to connect to PostgreSQL (Snowflake Postgres) and create the car_entries table.
Uses environment variables for credentials: DB_USERNAME, DB_URL, DB_PASSWORD
"""

import os
import sys

# Load .env file from script directory
from pathlib import Path
_env_path = Path(__file__).resolve().parent / ".env"
if _env_path.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(_env_path)
    except ImportError:
        # Fallback: manually load .env when python-dotenv not installed
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
    # Option 1: Full connection string (e.g. DATABASE_URL from hosting providers)
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        conn_string = database_url
    else:
        # Option 2: Separate credentials
        username = os.environ.get("DB_USERNAME")
        url = os.environ.get("DB_URL")
        password = os.environ.get("DB_PASSWORD")

        if not all([username, url, password]):
            print(
                "Error: Missing credentials. Set DB_USERNAME, DB_URL, and DB_PASSWORD, "
                "or DATABASE_URL with full connection string."
            )
            print("Example:")
            print("  export DB_USERNAME='your_username'")
            print("  export DB_URL='your-account.postgres.snowflakecomputing.com'")
            print("  export DB_PASSWORD='your_password'")
            sys.exit(1)

        # Build connection string - Snowflake Postgres uses port 5432 with SSL
        host = url.replace("https://", "").replace("http://", "").split("/")[0]
        if ":" not in host:
            host = f"{host}:5432"
        db_name = os.environ.get("DB_NAME", "postgres")
        conn_string = f"postgresql://{username}:{password}@{host}/{db_name}?sslmode=require"

    try:
        conn = psycopg2.connect(conn_string)
        return conn
    except psycopg2.Error as e:
        print(f"Connection failed: {e}")
        sys.exit(1)


def create_car_entries_table(conn):
    """Drop and recreate the car_entries table.
    fuel_used and carbon_produced are auto-calculated: 12 g/min fuel, 27 g/min carbon.
    Both are NULL when exit_timestamp is NULL.
    """
    try:
        with conn.cursor() as cur:
            cur.execute("DROP TABLE IF EXISTS car_entries")
            conn.commit()
    except psycopg2.Error as e:
        print(f"Error dropping table: {e}")
        conn.rollback()
        raise

    create_table_sql = """
    CREATE TABLE car_entries (
        entry_id SERIAL PRIMARY KEY,
        numberplate VARCHAR(20) NOT NULL,
        enter_timestamp TIMESTAMP,
        exit_timestamp TIMESTAMP,
        minutes_elapsed DECIMAL(10, 2) GENERATED ALWAYS AS (
            CASE
                WHEN exit_timestamp IS NOT NULL AND enter_timestamp IS NOT NULL
                THEN ROUND((EXTRACT(EPOCH FROM (exit_timestamp - enter_timestamp)) / 60)::numeric, 2)
                ELSE NULL
            END
        ) STORED,
        fuel_used DECIMAL(10, 2) GENERATED ALWAYS AS (
            CASE
                WHEN exit_timestamp IS NOT NULL AND enter_timestamp IS NOT NULL
                THEN ROUND((EXTRACT(EPOCH FROM (exit_timestamp - enter_timestamp)) / 60 * 12)::numeric, 2)
                ELSE NULL
            END
        ) STORED,
        carbon_produced DECIMAL(10, 2) GENERATED ALWAYS AS (
            CASE
                WHEN exit_timestamp IS NOT NULL AND enter_timestamp IS NOT NULL
                THEN ROUND((EXTRACT(EPOCH FROM (exit_timestamp - enter_timestamp)) / 60 * 27)::numeric, 2)
                ELSE NULL
            END
        ) STORED
    );
    """
    try:
        with conn.cursor() as cur:
            cur.execute(create_table_sql)
            conn.commit()
            print("Table 'car_entries' dropped and recreated successfully.")
    except psycopg2.Error as e:
        print(f"Error creating table: {e}")
        conn.rollback()
        raise


def main():
    conn = get_connection()
    try:
        create_car_entries_table(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
