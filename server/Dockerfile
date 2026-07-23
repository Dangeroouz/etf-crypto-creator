FROM node:22-alpine

WORKDIR /server

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3333/', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["npm", "start"]
