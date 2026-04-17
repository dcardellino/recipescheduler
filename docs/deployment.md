# RecipeScheduler — Deployment & Operations Guide

Self-Hosting-Handbuch speziell für Dominic (DevOps Engineer).
Ersetzt die klassische `gtm.md`, weil es sich um ein privates Tool handelt — das "Go-to-Market" ist hier "Go-to-Production-für-die-Familie".

---

## 1. Infrastruktur-Architektur

### Zielbild

- **Ein Hetzner VPS** (CX22 als Start) mit:
  - Coolify als PaaS-Layer (oder Dokploy als Alternative)
  - Docker Compose Stack: Next.js App, Postgres, Minio, Uptime Kuma
  - Let's Encrypt SSL (Coolify automatisch)
- **Externe Komponenten:**
  - Cloudflare: DNS + CDN (optional, aber empfohlen)
  - Resend: Transactional Emails (Magic Links)
  - Hetzner Storage Box oder Backblaze B2: Off-site Backups

### Warum so?

- **Hetzner CX22 (€4,50/Monat):** Günstig, EU-Datenschutz-freundlich, schnelles Netzwerk, SSD.
- **Coolify/Dokploy:** Self-hosted Heroku-Ersatz. Git-Push-to-Deploy, automatisches SSL, Logs/Metrics UI. Du willst nicht Nginx-Configs von Hand pflegen für eine Rezept-App.
- **Docker Compose:** Alle Services versionierbar, reproducible, einfache Backups der Volumes.
- **Postgres lokal (kein Managed):** Bei 6 Usern und ~1000 Rezepten ist Managed-DB Overkill.
- **Minio statt S3/R2:** Self-hosted passt zum Prinzip. Upgrade-Pfad auf R2/Backblaze jederzeit möglich (API-kompatibel).

---

## 2. Initial Setup

### 2.1 Hetzner VPS provisionieren

1. Account bei [hetzner.com](https://www.hetzner.com/cloud) anlegen
2. Cloud Console → "Neues Projekt" → "RecipeScheduler"
3. Server erstellen:
   - Image: **Ubuntu 24.04**
   - Typ: **CX22** (2 vCPU, 4GB RAM, 40GB SSD)
   - Standort: **Nürnberg** oder **Falkenstein**
   - SSH-Key hinzufügen (deinen Public Key)
   - Name: `recipescheduler-prod`
4. Firewall (empfohlen): Cloud-Firewall anlegen
   - Inbound erlaubt: SSH (22), HTTP (80), HTTPS (443)
   - Alles andere: closed

### 2.2 Server-Grundkonfiguration

```bash
ssh root@<VPS-IP>

# System updates
apt update && apt upgrade -y

# Firewall (UFW als zweite Verteidigungslinie)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Fail2ban gegen SSH-Brute-Force
apt install -y fail2ban
systemctl enable --now fail2ban

# Nicht-Root-User anlegen (optional aber empfohlen)
adduser dominic
usermod -aG sudo dominic
mkdir -p /home/dominic/.ssh
cp ~/.ssh/authorized_keys /home/dominic/.ssh/
chown -R dominic:dominic /home/dominic/.ssh

# SSH: Password-Login deaktivieren (falls noch aktiv)
sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload ssh

# Swap (hilft bei Build-Peaks)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 2.3 Coolify installieren

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Nach Installation:
- UI erreichbar unter `https://<VPS-IP>:8000`
- Initial-Account anlegen
- Server selbst als "localhost" Target einrichten (automatisch)

**Alternative Dokploy:**
```bash
curl -sSL https://dokploy.com/install.sh | sh
```

Pick eins und bleib dabei. Ich empfehle Coolify — mehr Dokumentation, größere Community, breiter Feature-Support.

### 2.4 Domain vorbereiten

1. Domain bei Registrar deiner Wahl (Netcup, Namecheap, Cloudflare Registrar)
2. DNS Records (Empfehlung: via Cloudflare für DDoS-Schutz):
   - `A` Record: `@` → VPS-IP
   - `A` Record: `www` → VPS-IP (optional)
   - `A` Record: `recipes` → VPS-IP (wenn Subdomain)
3. Proxy-Status bei Cloudflare: Für die App-Domain: **DNS only** (grau, da Coolify SSL managed). Alternativ Cloudflare-Proxy aktiv + Full (Strict) Mode — dann Coolify mit selfsigned oder Origin-Cert.

### 2.5 Resend für Magic Links

1. Account bei [resend.com](https://resend.com)
2. Domain hinzufügen, DNS-Records kopieren → zur Domain hinzufügen (SPF, DKIM, DMARC)
3. API Key generieren → für Coolify-Env bereithalten
4. Test-Mail an dich selbst senden vor Rollout

### 2.6 Coolify App & Services einrichten

**In Coolify:**

1. Neues Projekt: "RecipeScheduler"
2. Neue Resource: **Postgres** (16-alpine)
   - Name: `recipes-db`
   - Postgres-Password: auto-generate
   - Persist Volume: ja (standard)
3. Neue Resource: **Minio** (via Docker-Compose-Template oder manuell)
   - Ports: 9000 (API), 9001 (Console)
   - Env: `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`
   - Volume: `/data`
4. Neue Resource: **Application** → "Public Repository"
   - Git Repo: deines (GitHub/Gitea)
   - Branch: `main`
   - Build Pack: Dockerfile (mit `output: "standalone"` in next.config)
   - Domain: z.B. `recipes.deine-domain.de`
   - SSL: auto (Let's Encrypt)
5. **Env-Variablen** der App setzen:
   ```
   DATABASE_URL=postgres://recipes:<password>@recipes-db:5432/recipes
   BETTER_AUTH_SECRET=<openssl rand -hex 32>
   BETTER_AUTH_URL=https://recipes.deine-domain.de
   RESEND_API_KEY=re_xxx
   MAIL_FROM=noreply@deine-domain.de
   MINIO_ENDPOINT=http://recipes-minio:9000
   MINIO_PUBLIC_URL=https://recipes-storage.deine-domain.de
   MINIO_ACCESS_KEY=<key>
   MINIO_SECRET_KEY=<secret>
   MINIO_BUCKET=recipes
   NEXT_PUBLIC_APP_URL=https://recipes.deine-domain.de
   ```
6. Deploy triggern

### 2.7 Minio initial Bucket + Public-Policy

Nach dem Minio-Start:

```bash
# via Coolify-Console oder SSH + mc-Client
mc alias set local http://localhost:9000 <MINIO_ROOT_USER> <MINIO_ROOT_PASSWORD>
mc mb local/recipes
mc anonymous set download local/recipes   # nur wenn Public-Read gewünscht
```

**Public-Read vs. Signed-GET:**

- Public-Read: einfacher, aber URLs sind guessable (falls Bucket-Name bekannt). Für Rezept-Fotos akzeptabel.
- Signed-GET: mehr Privatsphäre, komplexer (URLs expiren, braucht Server-seitige Generation). Überfläche für MVP.

Default-Empfehlung: **Public-Read**. Umstellen auf Signed-GET wenn du das später willst.

---

## 3. Deployment-Workflow

### 3.1 Git-Workflow

- Repo bei **GitHub Private** oder **self-hosted Gitea** (auch auf dem VPS möglich, Phase 2 Setup)
- Branch-Strategie: `main` = Production, Feature-Branches per Phase (siehe PLAID PR-Workflow)
- Coolify deployed automatisch on push to `main`

### 3.2 Dockerfile

```dockerfile
# Multi-stage für schlanke Images
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

### 3.3 Next.js Config für Standalone

```js
// next.config.mjs
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'recipes-storage.deine-domain.de' },
    ],
  },
}
export default nextConfig
```

### 3.4 Database Migrations bei Deploy

**Option A — Manuell nach Deploy (sicherer):**
```bash
# lokal gegen Prod-DB (via Port-Forward oder VPN)
DATABASE_URL=<prod-url> npx drizzle-kit migrate
```

**Option B — Automatisch im Container-Start (riskanter):**
```json
// package.json scripts
"start:prod": "node scripts/migrate.js && node server.js"
```

**Empfehlung:** Option A mit explizitem Ausführen nach kritischen Migrations. Für kleine additive Migrations B ok.

---

## 4. Backups — Pflicht ab Tag 1

### 4.1 Postgres Backups

**Tägliches Logical Backup:**

```bash
# /root/scripts/backup-postgres.sh
#!/usr/bin/env bash
set -e
STAMP=$(date -u +"%Y%m%d-%H%M%S")
BACKUP_DIR=/var/backups/postgres
mkdir -p "$BACKUP_DIR"

docker exec recipes-db pg_dump -U recipes -d recipes -Fc -f /tmp/backup.dump
docker cp recipes-db:/tmp/backup.dump "$BACKUP_DIR/recipes-$STAMP.dump"
docker exec recipes-db rm /tmp/backup.dump

# Nur letzte 7 lokale behalten
find "$BACKUP_DIR" -name "recipes-*.dump" -mtime +7 -delete
```

**Crontab:**
```cron
0 3 * * * /root/scripts/backup-postgres.sh >> /var/log/backup-postgres.log 2>&1
```

### 4.2 Off-site Backup (Storage Box)

Hetzner Storage Box: €3.50/Monat für 1TB (bei Hetzner Cloud Konto vergünstigt).

```bash
# Einmalig: rclone konfigurieren
apt install -y rclone
rclone config  # Typ: SFTP, Host: u123456.your-storagebox.de, ...

# /root/scripts/backup-offsite.sh
#!/usr/bin/env bash
set -e
rclone sync /var/backups/postgres storagebox:/recipes/postgres
rclone sync /var/backups/minio storagebox:/recipes/minio
```

Cron nach Postgres-Backup: `30 3 * * * /root/scripts/backup-offsite.sh`

### 4.3 Minio Backups

Option A — `mc mirror` zu Storage Box (einfachster Weg):

```bash
# /root/scripts/backup-minio.sh
mc alias set local http://localhost:9000 <user> <secret>
# Spiegel zur Storage-Box via rclone (nachdem du mit mc eine lokale Kopie gemacht hast)
mc mirror --overwrite local/recipes /var/backups/minio/recipes
```

Für wenige hundert Fotos reicht das völlig.

### 4.4 Restore-Drill

**Einmal pro Quartal ausführen** — auf einem Scratch-Server oder lokal:

```bash
# 1. Aktuelles Backup ziehen
scp root@vps:/var/backups/postgres/recipes-*.dump .

# 2. Neues Postgres-Container starten
docker run -d --name restore-test -e POSTGRES_PASSWORD=test -p 5433:5432 postgres:16-alpine

# 3. Restore
docker exec -i restore-test createdb -U postgres recipes
docker cp recipes-YYYYMMDD-HHMMSS.dump restore-test:/tmp/backup.dump
docker exec restore-test pg_restore -U postgres -d recipes /tmp/backup.dump

# 4. Inspect
docker exec -it restore-test psql -U postgres -d recipes -c "SELECT COUNT(*) FROM recipes;"
```

Wenn das funktioniert: Backup ist verifiziert. Markiere im Kalender, wann der letzte erfolgreiche Restore-Drill war.

---

## 5. Monitoring

### 5.1 Uptime Kuma

- Deploy als weitere Coolify-Application (Image: `louislam/uptime-kuma:latest`)
- Monitors:
  - HTTP(s): `https://recipes.deine-domain.de/api/health` — alle 60s
  - TCP: `recipes-db:5432` — alle 5min
  - TCP: `recipes-minio:9000` — alle 5min
- Notifications: E-Mail (via Resend oder direktes SMTP) oder Telegram-Bot

### 5.2 Health-Check-Endpoint

Bereits Task TASK-087. Einfaches Beispiel:

```typescript
// src/app/api/health/route.ts
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`)
    return Response.json({ status: 'ok', time: new Date().toISOString() })
  } catch (error) {
    return Response.json({ status: 'error', error: String(error) }, { status: 503 })
  }
}
```

### 5.3 Logs

- Coolify zeigt Container-Logs im UI
- Für persistent Logs: optional Promtail → Grafana Loki (overkill für MVP)

### 5.4 Metriken (optional)

Für einen DevOps-Engineer angenehm, aber nicht essenziell:
- Grafana + Prometheus als Coolify-Stack
- `node_exporter` auf Host
- postgres_exporter für DB-Metriken

Gehört in Phase 8+ wenn du Spaß daran hast. MVP kommt auch ohne aus.

---

## 6. Security-Baseline

- [ ] SSH: nur Key-Auth, Port 22 → hinter Firewall
- [ ] Fail2ban aktiv
- [ ] UFW + Hetzner-Cloud-Firewall als double-layer
- [ ] Let's Encrypt SSL (Coolify automatisch)
- [ ] HSTS Header in Next.js Config aktivieren
- [ ] Content-Security-Policy einrichten (Phase 4)
- [ ] Secret Rotation: `BETTER_AUTH_SECRET` nicht rotieren außer bei Verdacht (kicks all sessions)
- [ ] Resend API-Key Scope so eng wie möglich (nur send, nicht admin)
- [ ] Postgres nicht public exposen (keine 5432 Port-Forward außer via SSH-Tunnel)
- [ ] Minio-Access-Keys rotation-fähig (env-basiert)

### Minimal-HTTP-Header

```javascript
// next.config.mjs
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

export default {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  output: 'standalone',
}
```

---

## 7. Rollout-Plan (statt Go-to-Market)

### 7.1 Week 0 — Infra Ready

- VPS provisioniert, Coolify läuft, Domain konfiguriert
- Resend Domain verifiziert
- Erstes Placeholder-Deploy live + SSL

### 7.2 Week 1–2 — MVP Phase 0–1 Deploy

- Rezept-Library manuell nutzbar
- Dominic legt 5 Rezepte an
- Feedback sammeln (eigene Use-Notes)

### 7.3 Week 3 — URL-Import (Phase 2) + Wife-Onboarding-Preview

- URL-Import mit 3 Lieblings-Kochseiten getestet
- Ehefrau wird inoffiziell gezeigt ("Was denkst du?")
- Feedback auf UI sammeln

### 7.4 Week 4–5 — Magic Moment (Phase 3)

- Wochenplan + Einkaufsliste live
- Erstes echtes "Sonntag-Ritual"
- Zeitmessung: wie lange braucht Dominic für die Woche?

### 7.5 Week 6 — PWA + Polish (Phase 4)

- Installation auf iPhone von Dominic + Frau
- Offline-Test im Supermarkt
- Lighthouse-Audit

### 7.6 Week 7 — Ehefrau offiziell dazu (Phase 5)

- Invite gesendet, sie installiert die App
- Gemeinsame Nutzung startet

### 7.7 Week 8 — Stabilität (Phase 6)

- Backups laufen automatisch
- Uptime-Kuma grün
- Restore-Drill ein Mal gemacht

### Erfolgsmetriken (nach 4 Wochen Produktiv-Nutzung)

- ≥20 Rezepte in Library
- 4 Wochenpläne erstellt, alle mit Einkaufsliste
- Ehefrau hat App mindestens 1×/Woche selbständig genutzt
- Sonntag-Ritual dauert <5min
- 0 Datenverluste, 0 Downtime-Incidents >15min

---

## 8. Operational Runbooks

### 8.1 App ist down

1. Uptime Kuma Alert erhalten → SSH zu VPS
2. `docker ps` → läuft der App-Container?
3. Coolify-UI öffnen → Logs der App anschauen
4. Häufige Ursachen:
   - Out of memory → `docker stats` → ggf. VPS upgraden
   - Postgres down → `docker logs recipes-db`
   - Env-Var fehlt nach Re-Deploy → in Coolify setzen
5. Wenn nichts hilft: Rollback auf letzten bekannten Commit via Coolify-UI

### 8.2 Datenbank-Verbindung schlägt fehl

1. Postgres-Container running? `docker ps | grep recipes-db`
2. Im Container testen: `docker exec -it recipes-db psql -U recipes -c "SELECT 1"`
3. Connection-String stimmt? `DATABASE_URL` in Coolify App Env prüfen
4. Bei Korruption-Verdacht: Restore aus letztem Backup (§ 4.4)

### 8.3 E-Mails kommen nicht an

1. Resend-Dashboard öffnen → Delivery-Log prüfen
2. Status "delivered"? → Inbox / Spam / Promotions des Empfängers checken
3. Status "bounced"? → DNS-Records (SPF/DKIM) validieren via Resend-UI
4. Fallback: SMTP-Transport in better-auth umstellen (Postmark, Brevo)

### 8.4 Foto-Upload schlägt fehl

1. Minio läuft? `docker ps | grep minio`
2. Bucket existiert? `mc ls local/recipes`
3. Access-Keys korrekt in App-Env?
4. Network: kann App-Container Minio erreichen? `docker exec recipes-app curl http://recipes-minio:9000/minio/health/live`

### 8.5 SSL-Cert expired

- Coolify renewt automatisch via Let's Encrypt. Falls doch failed:
- Coolify-UI → Application → "Re-issue Certificate"

---

## 9. Kosten-Überblick

| Item | €/Monat |
|---|---|
| Hetzner CX22 | 4,51 |
| Hetzner Storage Box (1TB) | 3,50 |
| Domain (gemittelt) | 1,00 |
| Resend (5k Mails/mo) | 0,00 |
| Cloudflare | 0,00 |
| **Total** | **~9 €** |

Später optional: Upgrade auf CX32 (€8,46) wenn die Family größer wird oder AI-Import viel genutzt wird.

---

## 10. Disaster Recovery Plan

**Szenario: VPS komplett verloren (Hetzner-Incident, versehentlich gelöscht)**

1. Neuen VPS provisionieren (§ 2.1)
2. Coolify installieren (§ 2.3)
3. Postgres-Container starten
4. Letztes Backup aus Storage Box pullen: `rclone copy storagebox:/recipes/postgres/recipes-YYYYMMDD-HHMMSS.dump .`
5. Restore: `pg_restore -U recipes -d recipes /tmp/backup.dump`
6. Minio-Bucket wiederherstellen: `rclone copy storagebox:/recipes/minio/ local/recipes/`
7. App neu deployen (Coolify pointiert auf Git-Repo, holt Code)
8. DNS auf neue IP umschreiben
9. SSL-Cert neu ausstellen

**Realistic RTO:** 1–2 Stunden wenn Backup-Drill gemacht wurde.
**RPO:** Letzte Nacht 03:00 Uhr (täglich Backup) → max. 24h Datenverlust.

Wer mehr Sicherheit will: Backup-Frequenz auf 6h erhöhen.

---

## 11. Future Considerations

- **Multi-Instance / HA?** → Nein, für Familien-Tool unnötig.
- **Staging-Umgebung?** → Zweiter kleiner VPS (CX11, ~€3) wenn du produktiv-unsicher wirst bei Migrations. Initial: Feature-Branches lokal + Vertrauen auf DB-Migrations-Review.
- **Scaling?** → CX32 (€8), dann CX42 (€15) — reicht für 100+ Users.
- **Migration zu Managed?** → Optional Neon/Supabase (Phase 2–3 Jahre) wenn du die Postgres-Pflege abgeben willst.

---

## 12. Appendix: Nützliche Commands

```bash
# Container Logs live
docker logs -f recipes-app

# Postgres-Size
docker exec recipes-db psql -U recipes -d recipes -c "SELECT pg_size_pretty(pg_database_size('recipes'));"

# Minio Storage-Size
docker exec recipes-minio du -sh /data

# Backup manuell triggern
/root/scripts/backup-postgres.sh && /root/scripts/backup-offsite.sh

# Letzte 10 Magic-Link-Logins
docker exec recipes-db psql -U recipes -d recipes -c "SELECT email, created_at FROM sessions ORDER BY created_at DESC LIMIT 10;"

# Health-Check testen
curl -f https://recipes.deine-domain.de/api/health | jq

# Coolify CLI (falls installiert)
coolify deployments list
coolify deployments redeploy recipes-app
```
