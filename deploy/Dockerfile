# Drishti Greens: one bundled Node file (Hono + the site) with Node's built-in SQLite.
# node:24-alpine (Node 24.22.1, Alpine 3.24), pinned by digest.
ARG NODE_IMAGE=node:24-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53

FROM ${NODE_IMAGE} AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM ${NODE_IMAGE}
ENV NODE_ENV=production \
    DATA_DIR=/data \
    PORT=8790 \
    NODE_OPTIONS="--disable-warning=ExperimentalWarning --max-old-space-size=48 --max-semi-space-size=1"
WORKDIR /app
COPY --from=build /src/dist ./dist
COPY public ./public
COPY migrations ./migrations
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
USER 1000:1000
EXPOSE 8790
CMD ["node", "dist/server.js"]
