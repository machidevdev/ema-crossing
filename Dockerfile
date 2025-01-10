FROM node:20-alpine

# Install OpenSSL
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy rest of the code
COPY . .

# Clean previous builds and generate fresh
RUN rm -rf dist/
RUN npm run build

# Generate Prisma client
RUN npm run prisma:generate

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"] 