#use the Node 22 base image
FROM node:22-alpine

WORKDIR /app

#Copy dependency
COPY package*.json ./

# installing dependencies
RUN npm install --include=dev --ignore-scripts

#copy source code
COPY . .

#javacript build
RUN npm run build

#expose the port
EXPOSE 3000

#start the server
CMD ["npm", "run", "start"]