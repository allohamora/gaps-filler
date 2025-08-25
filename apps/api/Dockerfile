FROM node:22.13.0-alpine AS prunner

# turborepo deps
RUN apk add --no-cache libc6-compat

WORKDIR /app
COPY . .
RUN npx turbo prune --scope=@gaps-filler/api --docker

FROM node:22.13.0-alpine AS runner

# turborepo deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=prunner /app/out/json .
COPY --from=prunner /app/out/package-lock.json .

# turborepo copies node_modules dir to a prunned build
# because of that it doesn't make sense to split installing of dev and production deps
# --ignore-scripts to prevent @weather-subscription/root's "postinstall" hook calling
RUN npm ci --ignore-scripts

COPY --from=prunner /app/out/full .
RUN npx turbo run build --filter @gaps-filler/api

ENV NODE_ENV=production

EXPOSE ${PORT}

CMD ["node", "apps/api/dist/index.js"]
