# Build stage for React app
FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ARG VITE_BASE_PATH
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BASE_PATH=$VITE_BASE_PATH

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Runtime stage - serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
