# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install all dependencies including devDependencies for building
RUN yarn install --frozen-lockfile

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build the TypeScript code
RUN yarn build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --frozen-lockfile --production && \
  yarn cache clean

# Copy built application from builder stage
COPY --from=builder /app/build ./build

# Copy database migrations
COPY db_migrations ./db_migrations

RUN mkdir /db \
  && chown -R node:node /db \
  && chown -R node:node /app

# Switch to non-root user
USER node

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "build/index.js"]
