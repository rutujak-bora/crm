# Build Stage
FROM node:18-alpine as build

WORKDIR /app

# Install dependencies (use legacy-peer-deps as used in development)
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps && npm install ajv@8 --legacy-peer-deps

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
