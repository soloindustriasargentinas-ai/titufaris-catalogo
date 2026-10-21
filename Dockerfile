# Multi-stage build for Coolify / Docker
# Uses AWS ECR Public official mirrors to prevent Docker Hub anonymous 429 Rate Limits
FROM public.ecr.aws/docker/library/node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies cleanly
RUN npm install

# Copy all project source files
COPY . .

# Compile production bundle
RUN npm run build

# Stage 2: High-performance Nginx production server
FROM public.ecr.aws/docker/library/nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]