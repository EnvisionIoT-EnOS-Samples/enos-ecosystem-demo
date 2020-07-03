FROM node:12

# Create app directory
WORKDIR /usr/src/app

# Add wait-for-it
COPY wait-for-it.sh ./
RUN chmod +x wait-for-it.sh

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3000

ARG REACT_APP_WEBSOCKET_PORT
ENV REACT_APP_WEBSOCKET_PORT ${REACT_APP_WEBSOCKET_PORT}

CMD ["./wait-for-it.sh", "edge-gateway:9000", "--", "npm", "start"]