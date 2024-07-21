# Use the official lightweight Node.js image.
FROM node:19-alpine

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package*.json ./

# Install production dependencies.
RUN npm install

# Copy local code to the container image.
COPY . .

# Build the application.
RUN npm run build

# Expose the port on which the app runs.
EXPOSE 3000

# Run the web service on container startup.
CMD [ "npm", "start" ]
