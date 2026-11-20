# Commerce OS — Production Deployment Guide

This guide describes how to deploy **Commerce OS (Release Candidate 1)** to production, with a focus on containerized single-instance deployments, Node.js PaaS hosting (specifically **Liara**), and standalone virtual machines.

---

## 🏛️ Deployment Architecture Principles

1. **Modular Monolith**: Single process containing the Express API server, React SSR engine, background Outbox worker, and SQLite storage engine.
2. **Persistence Guarantee**: SQLite requires a persistent disk mount. In containerized environments, ephemeral container storage will lead to data loss on container restart.
3. **Single Active Instance**: SQLite with Write-Ahead Logging (WAL) is designed for single-node vertical scaling (concurrent multi-threaded reads, sequential serialized writes). Do not deploy behind multi-container auto-scaling without external network volume locking.

---

## ☁️ Deployment on Liara PaaS (Node.js Platform)

Commerce OS is pre-configured with `liara.json` for rapid zero-configuration deployment to Liara.

### 1. Prerequisites
- Liara CLI installed: `npm i -g @liara/cli`
- Active account and logged in: `liara login`

### 2. Liara Persistent Disk Creation
SQLite data files must be preserved across app restarts and updates.
1. Navigate to Liara Console -> **Disks (دیسک‌ها)**.
2. Create a persistent disk:
   - **Disk Name**: `commerce-data`
   - **Size**: 2 GB (or larger depending on product media)
   - **Mount Path**: `/data`

### 3. Environment Variables Configuration
In the Liara Console -> App Settings -> **Environment Variables (متغیرهای محیطی)**, configure:

| Variable | Recommended Production Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables strict security, SSR caching, and disables dev paths |
| `PORT` | `3000` | Liara automatically assigns/manages container port |
| `COMMERCE_DB_PATH` | `/data/commerce.db` | Point to the persistent disk mount path |
| `DB_ENCRYPTION_KEY` | *(64-hex string)* | Cryptographic master key for AES-256-GCM at-rest encryption |
| `DB_ENCRYPTION_KEY_ID`| `k1` | Active encryption key ID |
| `WEBHOOK_ALLOW_LOOPBACK`| `false` | Enforce SSRF defense blocking loopback/private destinations |

*To generate a 64-hex string:*
```bash
openssl rand -hex 32
```

### 4. Deploying via CLI
The repository includes `liara.json`:
```json
{
  "platform": "node",
  "app": "commerce-os",
  "port": 3000,
  "build": {
    "command": "npm run build"
  },
  "start": "npm start",
  "disks": [
    {
      "name": "commerce-data",
      "mountTo": "/data"
    }
  ]
}
```

Run the deploy command from the project root:
```bash
liara deploy
```

---

## 🐳 Docker / Standalone Linux Deployment

### Dockerfile Specification
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
VOLUME ["/data"]
EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Run Command
```bash
docker run -d \
  --name commerce-os \
  -p 3000:3000 \
  -v /var/commerce-data:/data \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e COMMERCE_DB_PATH=/data/commerce.db \
  -e DB_ENCRYPTION_KEY="<64_HEX_RANDOM_KEY>" \
  -e DB_ENCRYPTION_KEY_ID="k1" \
  -e WEBHOOK_ALLOW_LOOPBACK="false" \
  --restart unless-stopped \
  commerce-os:rc1
```

---

## 🛡️ Health Checks & Monitoring

Commerce OS exposes system verification endpoints:
- `GET /system/db-info`: Database WAL checkpoint status, page size, encrypted record counts (requires auth token).
- `GET /robots.txt` & `GET /sitemap.xml`: SEO engine health checks.
- `GET /api/v1/catalog`: API health check.
