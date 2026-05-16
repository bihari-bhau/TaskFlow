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

# Custom nginx config for React Router support (using templates for ${PORT})
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy runtime entrypoint script to the official Nginx startup directory
COPY docker-entrypoint.sh /docker-entrypoint.d/40-env-config.sh
RUN chmod +x /docker-entrypoint.d/40-env-config.sh

# Set default port for local Docker (Railway overrides this)
ENV PORT=80

# Silence nginx "notice" logs so Railway doesn't flag them as [error]
RUN sed -i 's/notice/error/g' /etc/nginx/nginx.conf

CMD ["nginx", "-g", "daemon off;"]
