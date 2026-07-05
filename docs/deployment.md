# RecipeScheduler — Deployment & Operations (Vercel + Supabase)

Betriebshandbuch für das Familien-Tool. Die App läuft als **Next.js** auf
**Vercel** und nutzt **Supabase** für Postgres, Auth und Storage. Kein VPS,
kein Docker, keine eigene DB-Pflege mehr.

---

## 1. Architektur

| Komponente | Dienst |
|---|---|
| Hosting / SSR / Serverless | **Vercel** (Git-Push-Deploy) |
| Datenbank | **Supabase Postgres** (Zugriff via Drizzle ORM) |
| Authentifizierung | **Supabase Auth** — passwordless Magic Link, invite-only |
| Datei-Storage | **Supabase Storage** (public Bucket für Rezeptbilder) |
| E-Mail (Invites) | **Resend** |

Autorisierung passiert app-seitig (`src/lib/authz.ts`, Haushalts-Scoping).
Drizzle verbindet über die Pooler-Rolle und umgeht damit RLS. RLS kann später
als zusätzliche Absicherung ergänzt werden.

---

## 2. Supabase einrichten

1. Projekt auf [supabase.com](https://supabase.com) anlegen (Region EU, z.B.
   Frankfurt).
2. **Connection-Strings** (Project Settings → Database → Connection string):
   - `DATABASE_URL` = **Transaction Pooler** (Port **6543**) — für die Runtime.
   - `DIRECT_URL` = **Direct connection** (Port **5432**) — nur für Migrations.
3. **API-Keys** (Project Settings → API):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY` (geheim halten).
4. **Auth → Custom SMTP**: Resend als SMTP-Provider hinterlegen (Host
   `smtp.resend.com`, Port 465, User `resend`, Passwort = `RESEND_API_KEY`).
   Absenderadresse = verifizierte Resend-Domain. Danach das
   „Magic Link"-E-Mail-Template auf Deutsch anpassen.
5. **Auth → URL Configuration**: Site URL = Produktions-URL, und die
   Redirect-URL `https://<deine-domain>/auth/callback` (sowie
   `http://localhost:3000/auth/callback` für lokale Entwicklung) erlauben.
6. **Storage**: public Bucket `recipe-images` anlegen (Name muss zu
   `RECIPE_IMAGE_BUCKET` passen).

---

## 3. Vercel einrichten

1. Repo auf [vercel.com](https://vercel.com) importieren (Framework: Next.js —
   wird automatisch erkannt).
2. **Environment Variables** setzen (siehe `.env.example`): `DATABASE_URL`,
   `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `INVITE_TOKEN_SECRET`,
   `RECIPE_IMAGE_BUCKET`, `RESEND_API_KEY`, `MAIL_FROM`.
   - `INVITE_TOKEN_SECRET`: `openssl rand -hex 32`.
   - `NEXT_PUBLIC_SITE_URL`: die finale Domain (z.B.
     `https://recipes.deine-domain.de`).
3. Deploy auslösen. Vercel baut und hostet die App automatisch bei jedem Push.

---

## 4. Datenbank-Migrations

Migrations liegen als Drizzle-SQL unter `src/db/migrations/`. Sie werden **nicht**
im Vercel-Build ausgeführt, sondern separat gegen die Direct-Connection:

- **Lokal / manuell:** `DIRECT_URL=<supabase-direct> npm run db:migrate`
- **CI:** Die GitHub-Action `.github/workflows/migrate.yml` führt bei Push auf
  den Default-Branch (wenn sich `src/db/migrations/**` ändert)
  `npm run db:migrate` gegen das Repo-Secret `DIRECT_URL` aus.

Neue Migration erzeugen nach Schema-Änderung: `npm run db:generate`.

---

## 5. Datenmigration vom alten Server (einmalig)

Die Domänendaten hängen an `household_id` (uuid) und überleben; nur die User-IDs
wechseln von better-auth-Text-IDs auf Supabase-`auth.users`-UUIDs.

**Variante A — Fresh Start (einfachste Option):** Nichts migrieren. Rezepte neu
anlegen und Familienmitglieder per Invite neu einladen.

**Variante B — Datenübernahme:** `scripts/migrate-to-supabase.mjs` ausführen.
Es legt pro Alt-User einen Supabase-Auth-User an, mappt die IDs und kopiert alle
Tabellen in FK-sicherer Reihenfolge.

```bash
# 1. Supabase-Schema aufsetzen
DIRECT_URL=<supabase-direct> npm run db:migrate

# 2. Dry-Run (keine Schreibvorgänge)
OLD_DATABASE_URL=<alt-db> DIRECT_URL=<supabase-direct> \
NEXT_PUBLIC_SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> \
  node scripts/migrate-to-supabase.mjs

# 3. Migration ausführen
OLD_DATABASE_URL=<alt-db> DIRECT_URL=<supabase-direct> \
NEXT_PUBLIC_SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> \
  node scripts/migrate-to-supabase.mjs --commit
```

**Bilder:** `recipe.image_url` zeigt in der Alt-DB auf den alten Storage-Proxy.
Die Bild-Objekte müssen aus MinIO in den Supabase-Bucket kopiert und die URLs
auf die neuen Supabase-Public-URLs umgeschrieben werden (oder Bilder neu
hochladen). Das Skript lässt `image_url` unangetastet.

---

## 6. Auth-Flow (wie es funktioniert)

1. Nutzer gibt E-Mail auf `/login` ein → Server-Action `requestLoginLink`.
   - Bestehende Nutzer: Magic-Link wird gesendet.
   - Neue Nutzer: nur mit gültigem, passendem Invite-Token (invite-only).
2. Supabase versendet die Magic-Link-Mail (SMTP → Resend).
3. Klick → `/auth/callback` tauscht den Code/Token gegen eine Session,
   provisioniert Profil (`ensureProfile`) + Solo-Haushalt (`ensureHousehold`)
   und leitet weiter (Standard `/recipes`).
4. `src/middleware.ts` schützt alle `(app)`-Routen und aktualisiert die Session.
5. Invites: Owner lädt per E-Mail ein (`inviteMember`), signierter JWT-Token
   (`INVITE_TOKEN_SECRET`), Beitritt via `joinHousehold`.

---

## 7. Backups & Monitoring

- **Backups:** Supabase erstellt automatische tägliche Backups (Pro-Plan: PITR).
  Für den Free-Plan periodisch `pg_dump` gegen `DIRECT_URL` ziehen.
- **Monitoring:** Vercel Deployments/Logs + Supabase Dashboard (DB-Health,
  Auth-Logs, Storage-Nutzung). Für externes Uptime-Monitoring genügt ein
  HTTP-Check auf die Produktions-URL.

---

## 8. Kosten (Richtwert)

| Item | €/Monat |
|---|---|
| Vercel Hobby | 0 |
| Supabase Free/Pro | 0 – ~25 |
| Resend | 0 (bis 3k Mails/mo) |
| Domain | ~1 |

Für ein Familien-Tool reichen die kostenlosen Tiers in der Regel aus.

---

## 9. Troubleshooting

- **Login-Mail kommt nicht:** Supabase → Auth → Logs prüfen; SMTP-Konfiguration
  (Resend) und verifizierte Absenderdomain checken.
- **„Registrierung nur mit Einladung":** erwartetes Verhalten für unbekannte
  E-Mails ohne Invite-Token.
- **DB-Verbindungsfehler auf Vercel:** `DATABASE_URL` muss der **Pooler** (6543)
  sein, nicht die Direct-Connection.
- **Bilder laden nicht:** Bucket `recipe-images` muss public sein und der
  Supabase-Host in `next.config.ts` (`images.remotePatterns`) hinterlegt —
  wird automatisch aus `NEXT_PUBLIC_SUPABASE_URL` abgeleitet.
- **Migration schlägt fehl:** `DIRECT_URL` (Port 5432) verwenden, nicht den
  Pooler.
