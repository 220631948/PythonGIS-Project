# Builder stage
FROM node:20-alpine AS builder

# Allow passing release info at build time
ARG SENTRY_RELEASE=""
ENV VITE_SENTRY_RELEASE=${SENTRY_RELEASE}

WORKDIR /build

# Copy dependency definitions
COPY package.json package-lock.json ./

# Clean install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build for production (VITE_* envs are read at build time)
RUN npm run build

# Runtime stage
FROM nginx:alpine AS runtime

# Copy built artifacts (vite.config.js outDir is ../static relative to /build)
COPY --from=builder /static /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --retries=1 \
    CMD wget --quiet --spider http://localhost:80 || exit 1

# Expose port 80
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
