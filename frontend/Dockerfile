# compile react assets
FROM node:22-alpine AS build

WORKDIR /app

#Copy dependency
COPY package*.json ./

#install dependency
RUN npm install

#copy source code
COPY . .
RUN npm run build

#compiling assets using Nginx
FROM nginx:alpine

#copy custom reverse-proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf

#copy compiled frontend assets into nginx
COPY --from=build /app/dist /usr/share/nginx/html

#expose the port
EXPOSE 80

#start the server
CMD ["nginx", "-g", "daemon off;"]