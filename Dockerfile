# Multi-stage build for Coolify / Docker
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies cleanly
RUN npm install

# Copy application source files and Firebase config
COPY tsconfig.json vite.config.ts index.html firebase-applet-config.json ./
COPY public/ ./public/
COPY src/ ./src/

# Compile production bundle
RUN npm run build

# Stage 2: High-performance Nginx production server
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
