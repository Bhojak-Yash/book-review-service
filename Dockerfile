# # Use an official Node.js runtime as a parent image
# FROM node:20

# # Set the working directory in the container
# WORKDIR /app

# # Copy package.json and package-lock.json
# COPY package*.json ./

# # Install dependencies and nodemon globally
# RUN npm install -g nodemon && npm install

# # Copy the rest of the application code
# COPY . .

# # Set permissions for node_modules
# RUN chmod -R 755 /app/node_modules

# # Expose port (if applicable)
# EXPOSE 3000

# # Run as a non-root user
# USER node

# # Command to run the application
# CMD ["npm", "start"]

# Use official slim base image
FROM node:20-slim AS build

# Set working directory
WORKDIR /app

# Only copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy app source code
COPY . .

# Optionally, build your app if needed
# RUN npm run build

# Use smaller runtime image
FROM node:20-slim

# Create app directory
WORKDIR /app

# Copy only necessary files from build stage
COPY --from=build /app /app

# Use non-root user
USER node

# Expose your port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
