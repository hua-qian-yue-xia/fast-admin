FROM node:16

CMD ["mkdir", "-p", "/fast-admin"]

WORKDIR /servers

COPY . .

ENV TZ=Asia/Shanghai

RUN npm config set registry https://registry.npmmirror.com -g \
    && npm install -g npm@8.19.4 \
    && npm install -g pnpm@8.15.6 \
    && npm config set registry https://registry.npmmirror.com \
    && pnpm i --registry=https://registry.npmmirror.com \
    && pnpm run build \

EXPOSE 3000

CMD ["node", "/servers/dist/main.js"]
