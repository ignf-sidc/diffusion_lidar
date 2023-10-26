# python3 ./api/app/adapters/drop_data.py

# python3 ./api/app/adapters/migration.py

uvicorn api.app.main:app --proxy-headers --host 0.0.0.0 --port 80 --reload