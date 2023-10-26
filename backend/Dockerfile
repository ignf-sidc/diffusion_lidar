FROM tiangolo/uvicorn-gunicorn-fastapi:python3.9

RUN mkdir -p /backend
WORKDIR /backend

COPY . .

RUN pip3 install  --no-cache-dir --upgrade  -r requirements.txt

ENTRYPOINT ["/bin/bash", "./docker-entrypoint.sh"]
