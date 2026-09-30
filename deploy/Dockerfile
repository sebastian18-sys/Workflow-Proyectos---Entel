# --------------- Stage Dev ---------------
FROM node:20-alpine AS dev
WORKDIR /app

# # Certs NPM
# RUN apk add --no-cache ca-certificates openssl && update-ca-certificates
# COPY certs/zscaler.pem /usr/local/share/ca-certificates/zscaler.crt
# RUN update-ca-certificates

# # Node SSl
# ENV NODE_OPTIONS=--use-openssl-ca

# # Config
# RUN npm config set cafile /etc/ssl/certs/ca-certificates.crt \
#     && npm config set strict-ssl true \
#     && npm config set registry https://registry.npmjs.org/

# RUN npm cache clean --force

# RUN grep -n "Zscaler" /etc/ssl/certs/ca-certificates.crt || true
# RUN openssl s_client -quiet -connect registry.npmjs.org:443 -servername registry.npmjs.org -brief </dev/null || true

# Dependencies
COPY package*.json /app/
RUN npm install

COPY . /app/
ENV CHOKIDAR_USEPOLLING=1
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# --------------- Stage Prod ---------------
FROM node:20-alpine AS prod
WORKDIR /app

# Dependencies
COPY package*.json /app/
RUN npm install

COPY . /app/

# ARG

RUN env

RUN npm run build

# EXPOSE 80

# --------------- Config NGINX ---------------
FROM nginx:latest AS runtime

ENV TZ=America/Lima
COPY --from=prod /app/dist /usr/share/nginx/html
COPY ./deploy/default.conf /etc/nginx/conf.d/default.conf

# NEW 0104 -> rollback
RUN mkdir -p /etc/nginx/certs
COPY ./certs/_entel.net.pe_2027.crt /etc/nginx/certs/_entel.net.pe_2027.crt
COPY ./certs/entel.net.pe_2027.key /etc/nginx/certs/entel.net.pe_2027.key

RUN env
