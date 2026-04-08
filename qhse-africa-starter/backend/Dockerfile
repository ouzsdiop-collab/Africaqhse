# API QHSE — image production (Prisma CLI requis pour migrate deploy au démarrage)
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl libstdc++

# 1) Métadonnées npm
# 2) Schéma Prisma AVANT `npm ci` : le script postinstall exécute `prisma generate`
COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm ci

# 3) Reste de l’application (le client Prisma est déjà généré)
COPY scripts ./scripts
COPY src ./src
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV NODE_ENV=production
# Logs immédiats sur stdout/stderr (utile hors TTY / agrégateurs)
ENV NODE_NO_WARNINGS=1

EXPOSE 3001
ENTRYPOINT ["/docker-entrypoint.sh"]
# `node` direct : PID 1 = Node, signaux et logs Railway plus fiables qu’avec `npm start`.
# Équivalent à `npm start` (même fichier d’entrée).
CMD ["node", "src/server.js"]
