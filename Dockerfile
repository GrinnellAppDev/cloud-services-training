FROM node:8.9

ENV REACT_APP_API_ROOT="https://cst-api.appdev.grinnell.edu/"
EXPOSE 5000 5050

COPY ./webapp /var/webapp
WORKDIR /var/webapp
RUN yarn install
RUN yarn build

COPY ./server /var/server
WORKDIR /var/server
RUN yarn install

ENV NODE_ENV=production

CMD ["yarn", "start"]
