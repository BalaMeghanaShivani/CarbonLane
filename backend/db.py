"""Database connection helper."""
import os
from pathlib import Path

import psycopg2

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


def get_connection():
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        return psycopg2.connect(database_url)
    username = os.environ.get("DB_USERNAME")
    url = os.environ.get("DB_URL")
    password = os.environ.get("DB_PASSWORD")
    if not all([username, url, password]):
        raise ValueError("Set DATABASE_URL or DB_USERNAME, DB_URL, DB_PASSWORD in .env")
    host = url.replace("https://", "").replace("http://", "").split("/")[0]
    if ":" not in host:
        host = f"{host}:5432"
    db_name = os.environ.get("DB_NAME", "postgres")
    conn_string = f"postgresql://{username}:{password}@{host}/{db_name}?sslmode=require"
    return psycopg2.connect(conn_string)
