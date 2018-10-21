FROM node:8.9

COPY . /var/webapp
WORKDIR /var/webapp
RUN yarn install
RUN yarn build

ENV NODE_ENV=production

EXPOSE 80

CMD ["node", "index.js"]
