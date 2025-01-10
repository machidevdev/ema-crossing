FROM node:20-alpine

WORKDIR /app

# Install required tools
RUN apk add --no-cache openssl netcat-openbsd

# Copy package files first
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy wait-for script and make it executable
COPY wait-for.sh /wait-for.sh
RUN chmod +x /wait-for.sh

# Copy rest of the code
COPY . .

# Build
RUN npm run build
RUN npm run prisma:generate

# Change ownership
RUN chown -R node:node /app

USER node

CMD /wait-for.sh postgres:5432 -- sh -c "npx prisma migrate deploy && npm start" 