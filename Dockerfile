# Builder Stage
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

ARG TARGETARCH  # Automatically set by Buildx

WORKDIR /app

COPY package.json package-lock.json* ./
COPY ./prisma ./prisma

# Set PRISMA_CLI_BINARY_TARGETS based on TARGETARCH and install dependencies
RUN case ${TARGETARCH} in \
    "amd64") export PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x" ;; \
    "arm64") export PRISMA_CLI_BINARY_TARGETS="linux-musl-arm64-openssl-3.0.x" ;; \
    "arm")   export PRISMA_CLI_BINARY_TARGETS="linux-musl-arm-openssl-3.0.x" ;; \
    *) echo "Unsupported ARCH: ${TARGETARCH}" && exit 1 ;; \
    esac && \
    npm install && \
    npx prisma generate

COPY . .
RUN npm run build

# Production Stage
FROM --platform=$TARGETPLATFORM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV production

# Copy built assets and dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js* ./

# Prune dev dependencies
RUN npm prune --production

EXPOSE 3000

# Dynamically set PRISMA_CLI_BINARY_TARGETS based on runtime architecture and start
CMD ["sh", "-c", "\
  export PRISMA_CLI_BINARY_TARGETS=$(case $(uname -m) in \
    x86_64)   echo linux-musl-openssl-3.0.x ;; \
    aarch64) echo linux-musl-arm64-openssl-3.0.x ;; \
    armv7l)  echo linux-musl-arm-openssl-3.0.x ;; \
    *) echo \"Unsupported architecture: $(uname -m)\" && exit 1 ;; \
  esac) && \
  npx prisma migrate deploy && \
  npm start"]