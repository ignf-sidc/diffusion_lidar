FROM node:latest

WORKDIR /usr/app

COPY package.json .

RUN npm install

EXPOSE 3000

COPY . .
COPY .env /frontend/.env

CMD ["npm", "start"]