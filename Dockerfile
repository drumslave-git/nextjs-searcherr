FROM node:23-alpine AS base

# Step 1. Rebuild the source code only when needed
FROM base AS builder

RUN apk add --no-cache libc6-compat python3 py3-pip make gcc g++ openssl

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci --force

COPY . .

RUN mkdir -p config
RUN npm run db:generate
RUN npm run build

# Note: It is not necessary to add an intermediate step that does a full copy of `node_modules` here

# Step 2. Production image, copy all the files and run next
FROM base AS runner

RUN apk add --no-cache shadow su-exec python3 py3-pip make gcc g++ libffi-dev openssl

WORKDIR /app

COPY start.sh .
RUN chmod +x ./start.sh

ENV PUID=1001
ENV PGID=1001

# Don't run production as root
RUN addgroup --system --gid $PGID nodejs \
    && adduser --system --uid $PUID nextjs \
    && usermod -u $PUID -g $PGID nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/config ./config
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
RUN mkdir -p ./node_modules/.bin
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["./start.sh"]

CMD ["node", "server.js"]