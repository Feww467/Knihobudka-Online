FROM node:18-alpine

WORKDIR /app

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy rest of application
COPY . .

# Make sure your start command handles migrations
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]