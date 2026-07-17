# Use the official Bun image
FROM oven/bun:1.1-alpine

WORKDIR /app

# Copy workspace package and lock files
COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/database/package.json ./packages/database/
COPY packages/ai/package.json ./packages/ai/


# Install workspace dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the project source files
COPY . .

# Set working directory to the backend application
WORKDIR /app/apps/backend

# Expose the API port
EXPOSE 4000

# Run the persistent Hono API server with active loop scheduler
CMD ["bun", "run", "src/index.ts"]
