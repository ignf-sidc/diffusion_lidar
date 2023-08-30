FROM tiangolo/uvicorn-gunicorn-fastapi:python3.9

RUN mkdir -p /backend
WORKDIR /backend

COPY . .

RUN pip3 install -r requirements.txt

CMD ["uvicorn", "api.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
