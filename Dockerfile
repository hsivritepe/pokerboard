FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema first
COPY prisma ./prisma/

# Install dependencies (this will run prisma generate via postinstall)
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Create startup script
RUN echo '#!/bin/sh\nnpx prisma migrate deploy\nnpm start' > /app/start.sh && chmod +x /app/start.sh

# Start the production server
CMD ["/app/start.sh"]