# Use the official lightweight Node.js image.
FROM node:19-alpine

# Install bash
RUN apk add --no-cache bash

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package*.json ./

# Install production dependencies.
RUN npm install

# Copy local code to the container image.
COPY . .

# Copy wait-for-it script
COPY wait-for-it.sh /usr/src/app/wait-for-it.sh
RUN chmod +x /usr/src/app/wait-for-it.sh

# Expose the port on which the app runs.
EXPOSE ${APP_PORT}

# Run the web service on container startup.
CMD ["./wait-for-it.sh", "db:5432", "--", "sh", "-c", "npx prisma db push && npm run build && npm start"]
