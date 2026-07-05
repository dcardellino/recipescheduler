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
4. **Auth → Providers**: Email-Provider aktiv lassen (Default). Login läuft über
   E-Mail + Passwort — es wird für den Login **keine** E-Mail versendet, daher ist
   Custom SMTP für Auth nicht erforderlich. (Resend wird nur für die App-eigenen
   Haushalts-Invite-Mails genutzt.)
5. **Storage**: public Bucket `recipe-images` anlegen (Name muss zu
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
MIGRATION_DEFAULT_PASSWORD=<start-passwort> \
  node scripts/migrate-to-supabase.mjs

# 3. Migration ausführen
OLD_DATABASE_URL=<alt-db> DIRECT_URL=<supabase-direct> \
NEXT_PUBLIC_SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> \
MIGRATION_DEFAULT_PASSWORD=<start-passwort> \
  node scripts/migrate-to-supabase.mjs --commit
```

**Passwörter:** Da die Auth auf E-Mail + Passwort läuft, bekommt jeder migrierte Nutzer
das `MIGRATION_DEFAULT_PASSWORD` als Start-Passwort (individuell weiterzugeben). Ein
Self-Service-Reset ist derzeit nicht implementiert — Passwörter lassen sich sonst nur über
das Supabase-Dashboard ändern.

**Bilder:** `recipe.image_url` zeigt in der Alt-DB auf den alten Storage-Proxy.
Die Bild-Objekte müssen aus MinIO in den Supabase-Bucket kopiert und die URLs
auf die neuen Supabase-Public-URLs umgeschrieben werden (oder Bilder neu
hochladen). Das Skript lässt `image_url` unangetastet.

---

## 6. Auth-Flow (wie es funktioniert)

Authentifizierung per **E-Mail + Passwort** (Supabase Auth), Registrierung invite-only.

1. **Login:** Nutzer gibt E-Mail + Passwort auf `/login` ein → Server-Action `signIn`
   (`signInWithPassword`). Bei Erfolg Weiterleitung nach `/recipes`.
2. **Registrierung (nur per Einladung):** Owner lädt per E-Mail ein (`inviteMember`),
   signierter JWT-Token (`INVITE_TOKEN_SECRET`). Über den Invite-Link setzt die Person
   Name + Passwort → Server-Action `registerWithInvite` legt den Account per Service-Role
   an (`admin.createUser`, `email_confirm: true`), meldet ihn an, provisioniert Profil
   (`ensureProfile`) + Solo-Haushalt (`ensureHousehold`) und tritt via `joinHousehold`
   dem einladenden Haushalt bei.
3. `src/middleware.ts` schützt alle `(app)`-Routen und aktualisiert die Session.

Hinweis: Für den Login wird **keine E-Mail** versendet — Custom SMTP ist für Auth nicht
nötig (Resend nur für Haushalts-Invite-Mails). Ein Passwort-Reset-Flow ist derzeit nicht
implementiert; Passwörter lassen sich vorübergehend über das Supabase-Dashboard setzen.

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

- **„E-Mail oder Passwort ist falsch":** Zugangsdaten prüfen; bei migrierten
  Nutzern das `MIGRATION_DEFAULT_PASSWORD`. Passwort ggf. im Supabase-Dashboard
  (Auth → Users) neu setzen.
- **Registrierung nicht möglich:** erwartetes Verhalten ohne gültigen Invite-Token
  (invite-only). Owner muss über die App einladen.
- **DB-Verbindungsfehler auf Vercel:** `DATABASE_URL` muss der **Pooler** (6543)
  sein, nicht die Direct-Connection.
- **Bilder laden nicht:** Bucket `recipe-images` muss public sein und der
  Supabase-Host in `next.config.ts` (`images.remotePatterns`) hinterlegt —
  wird automatisch aus `NEXT_PUBLIC_SUPABASE_URL` abgeleitet.
- **Migration schlägt fehl:** `DIRECT_URL` (Port 5432) verwenden, nicht den
  Pooler.
