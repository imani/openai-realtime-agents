# -------- Build Stage --------
FROM node:22.14.0-alpine AS build_image

RUN echo "http://mirrors.pardisco.co/alpine/v3.19/main/" > /etc/apk/repositories \
    && echo "http://mirrors.pardisco.co/alpine/v3.19/community/" >> /etc/apk/repositories \
    && apk update && apk upgrade && apk add --no-cache libc6-compat

WORKDIR /app

# Set faster and local registry for NPM
RUN npm config set registry https://mirror-npm.runflare.com \
  && npm config set legacy-peer-deps true

COPY package.json package-lock.json ./

RUN npm install

ENV NODE_ENV=production 

COPY . .

RUN npm run build

# -------- Production Stage --------
FROM node:22.14.0-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app


COPY --from=build_image /app/public ./public
COPY --from=build_image /app/.next ./.next
COPY --from=build_image /app/node_modules ./node_modules
COPY --from=build_image /app/package.json ./package.json
COPY --from=build_image /app/next.config.js ./next.config.js
COPY --from=build_image /app/tsconfig.json ./tsconfig.json

EXPOSE 3000

CMD sh -c "npm run dev"