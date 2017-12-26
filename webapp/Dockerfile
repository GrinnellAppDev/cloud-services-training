FROM node:8.9

COPY . /var/webapp
WORKDIR /var/webapp
RUN yarn install
RUN yarn build

ENV NODE_ENV=production
ENV REACT_APP_API_ROOT="https://cst-api.appdev.grinnell.edu/"

EXPOSE 2000

CMD ["node", "index.js"]
