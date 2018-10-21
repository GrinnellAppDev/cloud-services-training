FROM node:8.9

COPY . /var/api
WORKDIR /var/api
RUN yarn install

ENV NODE_ENV=production

EXPOSE 80

CMD ["node", "index.js"]
