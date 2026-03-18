# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# ssh2 needs these native libs at runtime
RUN apk add --no-cache openssh-client

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create writable directories for config and ssh keys
RUN mkdir -p /app/config /home/nextjs/.ssh \
    && chown -R nextjs:nodejs /app/config /home/nextjs/.ssh \
    && chmod 700 /home/nextjs/.ssh

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
