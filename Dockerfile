FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Expose port 3000
EXPOSE 3000

# Set environment variable
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/pokerboard

# Start the development server
CMD ["npm", "run", "dev"]