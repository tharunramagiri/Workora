# Workora Command Center — standalone service for Dokploy.
# Build arg WORKORA_API is baked into the Next rewrites at build time
# (changing the backend URL requires a rebuild).

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG WORKORA_API=http://localhost:7777
ENV WORKORA_API=${WORKORA_API}
RUN npm run typecheck && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.mjs ./next.config.mjs
COPY --from=build /app/next-env.d.ts ./next-env.d.ts
EXPOSE 3001
CMD ["npm", "start"]
