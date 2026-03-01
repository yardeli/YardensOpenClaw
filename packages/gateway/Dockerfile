FROM node:20-slim

# Install pnpm
RUN npm install -g pnpm

# Install Claude CLI
RUN npm install -g @anthropic-ai/claude-code

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./

# Copy shared package
COPY packages/shared/ packages/shared/

# Copy gateway package
COPY packages/gateway/ packages/gateway/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Build shared first, then gateway
RUN pnpm build:shared && pnpm build:gateway

# Copy workspace template
COPY workspace/ workspace/

EXPOSE 4000

ENV NODE_ENV=production
ENV GATEWAY_PORT=4000
ENV GATEWAY_HOST=0.0.0.0

CMD ["node", "packages/gateway/dist/index.js"]
