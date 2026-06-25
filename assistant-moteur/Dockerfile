FROM node:22-alpine

# Chromium + polices (pour le rendu PDF et les accents francais)
RUN apk add --no-cache \
    chromium \
    nss freetype freetype-dev harfbuzz ca-certificates \
    ttf-freefont font-noto

ENV CHROME_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production \
    PORT=4321

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

EXPOSE 4321
CMD ["node", "server.js"]
