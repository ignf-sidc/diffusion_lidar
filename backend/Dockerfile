FROM python:3.9

RUN mkdir -p /backend
WORKDIR /backend

COPY . .

RUN pip3 install  --upgrade  -r requirements.txt


ENTRYPOINT ["/bin/bash", "./docker-entrypoint.sh"]
