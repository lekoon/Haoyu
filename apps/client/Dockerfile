# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the client using Nx (Vite)
RUN npx nx build client

# Production stage
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist/apps/client /usr/share/nginx/html

# Copy custom nginx configuration if needed
# COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
