# 🚀 ENTERPRISE DEPLOYMENT MANUAL

**Project Name**: Portfolio Bot System (`portfolio-bot`)  
**Target Platform**: Linux (Ubuntu 22.04 LTS / Debian 12 / RHEL 9), Node.js v18+, Docker, PM2  
**Document Version**: 1.0.0 (Production Certified)

---

## 1. PRE-DEPLOYMENT PREREQUISITES

Before deploying `portfolio-bot` to a live production server, ensure the following prerequisites are installed:

- **Node.js**: v18.17.0 LTS or higher (`node -v`)
- **npm**: v9.0.0 or higher (`npm -v`)
- **Git**: v2.34.0 or higher (`git --version`)
- **Process Manager**: PM2 (`npm install -g pm2`) or Docker Runtime
- **Reverse Proxy**: NGINX or Caddy (for SSL termination on port 443 -> local 3001)

---

## 2. ENVIRONMENT CONFIGURATION (.env)

Create a production `.env` file in the root directory:

```ini
# Production Environment Configuration
NODE_ENV=production
PORT=3001

# Telegram Bot Credentials
TELEGRAM_BOT_TOKEN=7654321098:AAH_ExampleSecretBotTokenStringHere
TELEGRAM_ADMIN_CHAT_ID=1053901081

# External Integration Credentials
GEMINI_API_KEY=AIzaSy_ExampleGeminiKeyHere
PORTFOLIO_WEBSITE_URL=https://sagdullayev.uz
```

---

## 3. BUILD & LAUNCH METHOD 1: PM2 (RECOMMENDED FOR VM / VPS)

### Step 1: Clone Repository
```bash
git clone https://github.com/sagdullayev-a/portfolio-bot.git /var/www/portfolio-bot
cd /var/www/portfolio-bot
```

### Step 2: Install Production Dependencies
```bash
npm ci --only=production
```

### Step 3: Compile TypeScript to Production Bundle (`dist/`)
```bash
npm run build
```

### Step 4: Launch via PM2 Process Manager
```bash
pm2 start dist/index.js --name "portfolio-bot" --max-memory-restart 500M --env production
pm2 save
pm2 startup
```

### Step 5: Verify Process Status & Logs
```bash
pm2 status portfolio-bot
pm2 logs portfolio-bot --lines 50
```

---

## 4. BUILD & LAUNCH METHOD 2: DOCKER CONTAINER

### Dockerfile (`Dockerfile`):
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### Build & Run Container:
```bash
docker build -t portfolio-bot:latest .
docker run -d --name portfolio-bot --restart always --env-file .env -p 3001:3001 -v $(pwd)/src/database:/app/dist/database portfolio-bot:latest
```

---

## 5. NGINX REVERSE PROXY CONFIGURATION

To route public HTTP POST requests (`/notify/contact`) from `https://api.sagdullayev.uz` to local Express port `3001`:

```nginx
server {
    listen 80;
    server_name api.sagdullayev.uz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.sagdullayev.uz;

    ssl_certificate /etc/letsencrypt/live/api.sagdullayev.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.sagdullayev.uz/privkey.pem;

    location /notify/contact {
        proxy_pass http://127.0.0.1:3001/notify/contact;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 6. SANITY CHECK & HEALTH VERIFICATION

1. **Verify HTTP API**:
   ```bash
   curl -X POST http://localhost:3001/notify/contact \
     -H "Content-Type: application/json" \
     -d '{"name":"Deployment Verification","message":"Testing deployment pipeline"}'
   ```
   *Expected Response*: `{"success":true,"message":"Notification sent successfully."}`

2. **Verify Telegram Admin Panel**:
   - Open Telegram and send `/admin` to the bot.
   - Verify that the Admin Dashboard renders in $< 100\text{ms}$.
