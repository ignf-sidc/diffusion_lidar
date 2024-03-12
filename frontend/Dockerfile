FROM node:latest

WORKDIR /usr/app

COPY package.json .


COPY . .

RUN npm run build

EXPOSE 3000



ENV NODE_ENV=production

CMD ["sh", "-c", "npm start"]
