FROM tiangolo/uvicorn-gunicorn-fastapi:python3.9

WORKDIR /usr/app/api

CMD ["bash", "-c", "pip3 install -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"]




