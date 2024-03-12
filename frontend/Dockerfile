FROM node:20-alpine as builder

# ???
# ENV NODE_ENV=production

RUN mkdir -p /opt/frontend
WORKDIR /opt/frontend

# installation des dépendances
COPY package.json .


# copie du reste du code
COPY . .

# construction react
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine as production

COPY --from=builder /opt/frontend/build/ /usr/share/nginx/html/.
WORKDIR /usr/share/nginx/html
# NB : uid=101, gid=101 et port=8080
