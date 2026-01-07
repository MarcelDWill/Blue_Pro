FROM node:22-alpine

# Install netcat for health checks
RUN apk add --no-cache netcat-openbsd

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma files (needed for postinstall hook)
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies (will run prisma generate)
RUN npm install

# Copy rest of application
COPY . .

# Copy and set entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]