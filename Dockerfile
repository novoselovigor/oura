# Use node 20 alpine as light base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependecies
RUN npm ci

# Copy core files
COPY . .

# Build Vite frontend and Bundle Server
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Start server
CMD ["npm", "start"]
