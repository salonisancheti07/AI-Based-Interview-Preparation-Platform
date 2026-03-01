# Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Build final image with backend
FROM node:20-alpine

WORKDIR /app

# Install backend dependencies
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --only=production

# Copy built frontend
COPY --from=frontend-builder /app/dist ./public/dist

# Copy server code
COPY server ./server

EXPOSE 5000

WORKDIR /app/server

CMD ["npm", "start"]
