FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .

ARG REACT_APP_API_URL=http://localhost:8000/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# Serve stage — lightweight nginx
FROM nginx:alpine

# Copy built React app
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config template (uses $PORT variable injected by Railway)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# nginx:alpine automatically runs envsubst on /etc/nginx/templates/*.template at startup
CMD ["nginx", "-g", "daemon off;"]
