FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm install --workspace=apps/api

EXPOSE 3000

CMD ["node","apps/api/src/main.js"]
