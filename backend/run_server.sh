#!/bin/bash
# Run the Flask API server. Ensure backend_venv is activated and .env is configured.
cd "$(dirname "$0")"
python app.py
