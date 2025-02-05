# 构建阶段
FROM node:20-slim AS builder

# 安装 Playwright 依赖
RUN apt-get update && apt-get install -y \
  libwoff1 \
  libopus0 \
  libwebp7 \
  libwebpdemux2 \
  libenchant-2-2 \
  libgudev-1.0-0 \
  libsecret-1-0 \
  libhyphen0 \
  libgdk-pixbuf2.0-0 \
  libegl1 \
  libnotify4 \
  libxslt1.1 \
  libevent-2.1-7 \
  libgles2 \
  libvpx7 \
  libxcomposite1 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libepoxy0 \
  libgtk-3-0 \
  libharfbuzz-icu0 \
  libgstreamer-gl1.0-0 \
  libgstreamer-plugins-bad1.0-0 \
  gstreamer1.0-plugins-good \
  gstreamer1.0-libav \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制项目文件
COPY package*.json ./
COPY . .

# 安装依赖并构建
RUN npm ci
RUN npx playwright install
RUN npm run build

# 生产阶段
FROM node:20-slim AS runner

# 安装运行时所需的 Playwright 依赖和 curl
RUN apt-get update && apt-get install -y \
  libwoff1 \
  libopus0 \
  libwebp7 \
  libwebpdemux2 \
  libenchant-2-2 \
  libgudev-1.0-0 \
  libsecret-1-0 \
  libhyphen0 \
  libgdk-pixbuf2.0-0 \
  libegl1 \
  libnotify4 \
  libxslt1.1 \
  libevent-2.1-7 \
  libgles2 \
  libvpx7 \
  libxcomposite1 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libepoxy0 \
  libgtk-3-0 \
  libharfbuzz-icu0 \
  libgstreamer-gl1.0-0 \
  libgstreamer-plugins-bad1.0-0 \
  gstreamer1.0-plugins-good \
  gstreamer1.0-libav \
  curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 从构建阶段复制必要文件
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 设置环境变量
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

EXPOSE 3000

CMD ["npm", "start"] 