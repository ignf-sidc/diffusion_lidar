FROM node:latest

WORKDIR /usr/app/frontend

ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "npm install && npm run build && npm start"]
# CMD ["sh", "-c", "while :; do node app.js; done"]
