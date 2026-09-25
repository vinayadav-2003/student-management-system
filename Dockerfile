# ---- Build stage: install deps and build the React frontend ----
# Use the full node:20 image (not alpine) because it ships Python and the
# build tools (gcc, g++, make) required to compile the msnodesqlv8 native
# SQL Server module.
FROM node:20 AS build

WORKDIR /app

# Install root (frontend) dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Install backend dependencies
# --force bypasses npm engine-version warnings from mssql/msnodesqlv8
# (which expect Node 22+) while still allowing the native build to run
# against the available Python/build toolchain.
COPY server/package.json server/package-lock.json* ./server/
RUN npm install --prefix server --force

# Copy the rest of the source and build the frontend
COPY . .
RUN npm run build

# ---- Runtime stage: only what's needed to run the backend ----
FROM node:20

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
