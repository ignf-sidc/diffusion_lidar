FROM node:latest

WORKDIR /usr/app

COPY package.json .

RUN npm install

RUN npm run build

EXPOSE 3000

COPY . .

ENV NODE_ENV=production

CMD ["sh", "-c", "npm start"]
