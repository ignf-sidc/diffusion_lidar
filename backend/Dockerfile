FROM python:3.9

RUN mkdir -p /backend
WORKDIR /backend

COPY . .

RUN pip3 install  --no-cache-dir --upgrade  -r requirements.txt

CMD [ "uvicorn api.app.main:app --proxy-headers --host 0.0.0.0 --port 80 --reload" ]
