FROM node:23-alpine

RUN apk update && apk add --no-cache python3 py3-pip make gcc g++ libffi-dev openssl

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci --force

COPY . .

RUN mkdir -p config
RUN npm run db:generate

CMD ["sh", "-c", "npm run db:push && npm run dev:all"]