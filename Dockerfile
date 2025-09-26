###############################################################################
# Stage 1 – Builder + Test Runner (Debian/glibc → Rollup native sorunsuz)
###############################################################################
FROM node:lts-alpine3.22 AS builder  

ARG TOKEN
ENV NODE_AUTH_TOKEN=$TOKEN \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false

# ensure we have a writable working dir owned by node
WORKDIR /app
RUN chown -R node:node /app

# Configure your private registry/token once
RUN npm config set @ctrlcan:registry=https://gitcan.kalecanbazoglu.synology.me/api/packages/Ctrlcan/npm/ && \
    npm config set //gitcan.kalecanbazoglu.synology.me/api/packages/Ctrlcan/npm/:_authToken=$TOKEN
RUN npm install -g npm@latest
# Drop root before touching deps
USER node

# deterministic install using the lockfile if you have it; otherwise keep ci when lockfile is present
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# build
COPY --chown=node:node . .
RUN npm run build

# default command runs tests/coverage
CMD ["npm", "run", "cov"]