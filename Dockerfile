# ---- Build stage: install deps and build the React frontend ----
FROM node:20-alpine AS build

WORKDIR /app

# Install root (frontend) dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Install backend dependencies
COPY server/package.json server/package-lock.json* ./server/
RUN npm install --prefix server

# Copy the rest of the source and build the frontend
COPY . .
RUN npm run build

# ---- Runtime stage: only what's needed to run the backend ----
FROM node:20-alpine

WORKDIR /app

# Copy backend with its installed node_modules
COPY --from=build /app/server ./server

# Copy the built frontend into the folder Express serves as static files
COPY --from=build /app/dist ./server/public

WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]
