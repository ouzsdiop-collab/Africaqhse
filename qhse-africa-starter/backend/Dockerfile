# API QHSE — image production (Prisma CLI requis pour migrate deploy au démarrage)
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl libstdc++

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY scripts ./scripts
RUN npx prisma generate

COPY src ./src
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3001
ENTRYPOINT ["/docker-entrypoint.sh"]
