FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

EXPOSE 3000
EXPOSE 3001

CMD ["node", "app.js"]