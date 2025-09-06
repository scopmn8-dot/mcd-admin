FROM node:18-alpine

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Set working directory and change ownership
WORKDIR /app
RUN chown backend:nodejs /app

# Switch to non-root user
USER backend

# Copy package files with correct ownership
COPY --chown=backend:nodejs package*.json ./

# Install dependencies using npm install instead of ci for better compatibility
RUN npm install --production --no-audit --no-fund

# Copy source code with correct ownership
COPY --chown=backend:nodejs . .

# Create directory for frontend build
RUN mkdir -p public

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["node", "index.js"]
