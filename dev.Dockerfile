FROM node:23-alpine

RUN apk update && apk add --no-cache python3 py3-pip make gcc g++ libffi-dev openssl

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci --force

COPY . .

RUN npm run db:push
RUN npm run db:generate

CMD ["npm", "run", "dev:all"]