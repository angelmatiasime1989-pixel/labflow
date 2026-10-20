FROM node:24.19.0-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --chown=node:node package.json ./
COPY --chown=node:node worker ./worker
COPY --chown=node:node vps ./vps
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 8787
CMD ["node", "vps/server.mjs"]
