# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig*.json ./

# Install all dependencies including devDependencies for build
RUN npm install

# Copy source code and Prisma schema
COPY . .

# Generate Prisma Client
RUN npx prisma generate --schema ./apps/api/prisma/schema.prisma

# Build the API using Nx
RUN npx nx build api

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only if possible, or just copy node_modules
# For Prisma, we need the prisma engine
COPY --from=builder /app/dist/apps/api ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma ./prisma

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Run migrations and start the server
# In a real production environment, migrations might be handled differently
CMD ["node", "dist/main.js"]
