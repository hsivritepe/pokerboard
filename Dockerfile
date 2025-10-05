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

# Expose port 3000
EXPOSE 3000

# Set environment variable
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/pokerboard

# Start the development server
CMD ["npm", "run", "dev"]