# RecipeScheduler — Product Roadmap

Phasen-basierter Bauplan. Jede Phase produziert eine lauffähige, demofähige Version. Checkboxes werden vom Coding-Agent (Claude Code) abgehakt während der Umsetzung.

---

## Build Philosophy

1. **Jede Phase endet in einem nutzbaren Zustand.** Keine Phase hinterlässt die App broken.
2. **Magic Moment früh erreichen.** Am Ende von Phase 3 ist der Sonntag-Abend-Flow bereits funktionsfähig, auch wenn Details noch fehlen.
3. **Deploy früh, deploy oft.** Ab Phase 1 bereits auf Hetzner VPS deployed. Lokale Entwicklung + Prod-Deploy parallel.
4. **Strikte Scope-Disziplin.** Wenn eine Feature-Idee auftaucht, die nicht in der Roadmap steht → in einen "Ideas"-Block (unten) schreiben, nicht sofort bauen.
5. **DevOps-Flow von Tag 1.** Git, CI (optional), Backups, Monitoring gehören ab Phase 0 dazu.

---

## Phase 0 — Foundation & Setup

**Goal:** Leeres Next.js-Projekt mit DB-Verbindung, Auth, Minio-Upload, deployed auf Hetzner VPS.
**Demo:** Login per Magic Link funktioniert; "Hello World" Dashboard nach Login sichtbar; Foto hochladen und anzeigen.
**Reference-Sections:** PRD § 2 (Architecture), § 3 (Data Model: users/sessions/households), § 10 (Auth), § 11 (Email), deployment.md § 1–3.

- [x] **TASK-001** — Next.js 15 Projekt initialisieren mit TypeScript, Tailwind, App Router
  Files: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.mjs`, `.gitignore`
  Notes: `npx create-next-app@latest --typescript --tailwind --app --src-dir --eslint --no-turbopack`. Strict TS.

- [x] **TASK-002** — shadcn/ui initialisieren und Basis-Komponenten installieren
  Files: `components.json`, `src/components/ui/*`
  Notes: `npx shadcn@latest init` — wähle Cream-Theme manuell editieren. Installiere: button, input, label, form, card, dialog, sheet, dropdown-menu, toast (sonner), badge, avatar, skeleton, checkbox, separator, tabs, textarea, select, scroll-area.

- [x] **TASK-003** — Custom Tailwind-Theme mit Design-Tokens einrichten
  Files: `tailwind.config.ts`, `src/app/globals.css`
  Notes: Farben aus PRD § 9. Fonts via `next/font/google` (Fraunces für heading, Inter für body).

- [x] **TASK-004** — Postgres lokal via Docker Compose starten
  Files: `docker-compose.yml`, `.env.local`, `.env.example`
  Notes: postgres:16-alpine, port 5432, password in .env. Minio-Service auch gleich dazupacken (port 9000, Console 9001).

- [x] **TASK-005** — Drizzle ORM installieren und konfigurieren
  Files: `drizzle.config.ts`, `src/db/index.ts`, `src/db/schema.ts`
  Notes: `npm i drizzle-orm postgres` + `npm i -D drizzle-kit`. Connection aus `process.env.DATABASE_URL`.

- [x] **TASK-006** — Users, Sessions, VerificationTokens Schema anlegen (better-auth Felder)
  Files: `src/db/schema.ts`
  Notes: Siehe PRD § 3. Tabellen: users, sessions, accounts, verification_tokens. better-auth benötigt bestimmte Felder — siehe better-auth Docs.

- [x] **TASK-007** — Households + HouseholdMembers Schema hinzufügen
  Files: `src/db/schema.ts`
  Notes: Siehe PRD § 3. `householdMembers` mit enum role.

- [x] **TASK-008** — Initiale Migration erstellen und ausführen
  Files: `src/db/migrations/*`
  Notes: `npx drizzle-kit generate` dann `npx drizzle-kit migrate`.

- [x] **TASK-009** — better-auth Setup + Magic Link Plugin
  Files: `src/lib/auth.ts`, `src/app/api/auth/[...all]/route.ts`
  Notes: Siehe PRD § 10. `BETTER_AUTH_SECRET` in .env.

- [x] **TASK-010** — Resend Account anlegen + API Key + sendMagicLinkEmail Helper
  Files: `src/lib/email.ts`, `.env.local`
  Notes: Siehe PRD § 11. Verifiziere Domain in Resend-Dashboard. Für Dev reicht `onboarding@resend.dev` als From.

- [x] **TASK-011** — Login-Seite implementieren (E-Mail → Magic Link)
  Files: `src/app/(auth)/login/page.tsx`, `src/components/auth/login-form.tsx`
  Notes: shadcn Form + react-hook-form + Zod. States: idle, sending, sent, error.

- [x] **TASK-012** — Middleware für Protected Routes
  Files: `src/middleware.ts`
  Notes: Siehe PRD § 10. Redirect zu `/login` wenn keine Session.

- [x] **TASK-013** — Post-Login Household-Auto-Creation Hook
  Files: `src/lib/auth.ts`, `src/actions/household.ts`
  Notes: In better-auth `databaseHooks` nach Session-Creation prüfen, ob User in `householdMembers` ist. Falls nein: neuen Household anlegen.

- [x] **TASK-014** — Placeholder-Layout mit Top-Nav (Desktop) + Bottom-Nav (Mobile)
  Files: `src/app/(app)/layout.tsx`, `src/components/layout/top-nav.tsx`, `src/components/layout/bottom-nav.tsx`
  Notes: Links: Library, Woche, Liste, Settings. User-Avatar mit Dropdown (Abmelden).

- [x] **TASK-015** — Placeholder-Seiten für /recipes, /week, /shopping, /settings
  Files: `src/app/(app)/{recipes,week,shopping,settings}/page.tsx`
  Notes: Nur Heading + "Coming soon". Navigation testen.

- [x] **TASK-016** — Minio Docker-Service + Bucket "recipes" initial anlegen
  Files: `docker-compose.yml`, `scripts/init-minio.sh`
  Notes: mc-Client verwenden oder via Minio-Console. Access + Secret Key in .env.

- [x] **TASK-017** — Upload-API-Route mit Signed-URL-Generierung
  Files: `src/app/api/upload/route.ts`, `src/lib/storage.ts`
  Notes: `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`. Endpoint `http://minio:9000` (Docker) / `http://localhost:9000` (dev).

- [x] **TASK-018** — Test-Seite `/dev/upload-test` zum Verifizieren des Flows
  Files: `src/app/dev/upload-test/page.tsx`
  Notes: File-Input → POST to /api/upload → PUT zum Signed URL → Image anzeigen. Wird in Phase 3 entfernt.

- [x] **TASK-019** — Dockerfile für Next.js App
  Files: `Dockerfile`, `.dockerignore`
  Notes: Multi-stage build, `output: "standalone"` in next.config. Siehe deployment.md.

- [ ] **TASK-020** — Hetzner VPS provisionieren + Coolify installieren
  Files: — (manuell + dokumentiert in deployment.md)
  Notes: Siehe deployment.md § 2.

- [ ] **TASK-021** — Erstes Deployment auf Coolify (mit Postgres + Minio Services)
  Files: — (Coolify-Config)
  Notes: Env-Vars setzen, Domain verbinden, Let's Encrypt aktivieren.

- [ ] **TASK-022** — End-to-End Smoke Test: Login + Upload funktioniert auf Prod
  Files: — (manueller Test)
  Notes: Magic-Link-Mail empfangen, einloggen, Upload-Test-Seite erfolgreich.

**Phase 0 Summary Prompt für Claude Code:**
> "Setup Phase 0 ausführen: Next.js Projekt, Tailwind mit unseren Farben, shadcn/ui, Drizzle+Postgres, better-auth mit Magic Link via Resend, Minio-Upload-Flow, Placeholder-Layout, und Deployment-ready Dockerfile. Folge der Task-Reihenfolge strikt und markiere in product-roadmap.md jedes erledigte Task mit `[x]`."

---

## Phase 1 — Recipe Library (CRUD)

**Goal:** Rezepte manuell anlegen, ansehen, editieren, löschen. Library-Listing funktioniert. Tags & Rating.
**Demo:** 5 Rezepte manuell erfasst, durchsuchbar, filterbar.
**Reference-Sections:** PRD § 3 (recipes/ingredients/steps/tags), § 5 (US-01..04), § 6 (FR-004..009), § 8 (Library, Create, Detail Screens).

- [x] **TASK-023** — Recipes, RecipeIngredients, RecipeSteps, Tags, RecipeTags Schema
  Files: `src/db/schema.ts`
  Notes: Siehe PRD § 3. Enum `ingredient_category` hinzufügen.

- [x] **TASK-024** — Migration generieren + ausführen
  Files: `src/db/migrations/*`

- [x] **TASK-025** — Zod-Schemas für Recipe Create/Update
  Files: `src/lib/schemas/recipe.ts`
  Notes: `createRecipeSchema`, `updateRecipeSchema`, `ingredientSchema`, `stepSchema`.

- [x] **TASK-026** — Server Actions: createRecipe, updateRecipe, deleteRecipe
  Files: `src/actions/recipes.ts`
  Notes: Authorization: User muss Household-Member sein. `revalidatePath` nach Änderung.

- [x] **TASK-027** — Rezept-Library-Seite (Listing)
  Files: `src/app/(app)/recipes/page.tsx`, `src/components/recipe/recipe-card.tsx`, `src/components/recipe/recipe-grid.tsx`
  Notes: Server Component. Grid: 1 Spalte Mobile, 2 Tablet, 3 Desktop. Empty State mit CTA.

- [x] **TASK-028** — Rezept-Erstellen-Seite (manuell)
  Files: `src/app/(app)/recipes/new/page.tsx`, `src/components/recipe/recipe-form.tsx`, `src/components/recipe/ingredients-input.tsx`, `src/components/recipe/steps-input.tsx`
  Notes: react-hook-form mit useFieldArray für Zutaten + Schritte. Tab-Navigation durch Felder.

- [x] **TASK-029** — Foto-Upload Integration in Recipe-Form
  Files: `src/components/recipe/image-upload.tsx`
  Notes: Client-seitiges Resize (max 1600px breit) via Canvas API. Preview-Anzeige.

- [x] **TASK-030** — Rezept-Detail-Seite
  Files: `src/app/(app)/recipes/[id]/page.tsx`, `src/components/recipe/recipe-detail.tsx`
  Notes: Hero-Image + Metadaten-Zeile + Zutaten (links) + Schritte (rechts). Mobile stacked.

- [x] **TASK-031** — Rezept-Bearbeiten-Seite (reuse Form)
  Files: `src/app/(app)/recipes/[id]/edit/page.tsx`
  Notes: Form mit defaultValues aus geladenem Rezept.

- [x] **TASK-032** — Rezept-Löschen mit Confirm-Dialog
  Files: `src/components/recipe/delete-recipe-dialog.tsx`
  Notes: shadcn AlertDialog. Nach Löschen redirect auf /recipes.

- [x] **TASK-033** — Tag-Management (Create, List, Assign)
  Files: `src/actions/tags.ts`, `src/components/recipe/tag-input.tsx`
  Notes: Combobox mit "Create new tag" Option (cmdk). Tags sind Household-scoped.

- [x] **TASK-034** — Rating-Component (1–5 Sterne, clickable)
  Files: `src/components/recipe/rating-input.tsx`
  Notes: Lucide Star icons. Keyboard-accessible (arrow keys).

- [x] **TASK-035** — Library-Suche (Titel + Zutaten)
  Files: `src/components/recipe/recipe-search.tsx`, `src/actions/recipes.ts`
  Notes: URL-Param `?q=...` für Bookmarkability. Postgres ILIKE oder pg_trgm Similarity.

- [x] **TASK-036** — Tag-Filter-Chips in Library
  Files: `src/components/recipe/tag-filter.tsx`
  Notes: Multi-Select, URL-Params `?tags=id1,id2`. AND-Logik (Rezept muss alle haben).

- [x] **TASK-037** — Sortierung (Rating, A-Z, zuletzt hinzugefügt)
  Files: `src/components/recipe/sort-dropdown.tsx`
  Notes: URL-Param `?sort=rating|title|recent`.

- [x] **TASK-038** — Unit-Tests für Recipe-Zod-Schemas
  Files: `src/lib/schemas/recipe.test.ts`
  Notes: Vitest. Edge Cases: leere Zutaten, negative Portionen, etc.

**Phase 1 Summary Prompt für Claude Code:**
> "Phase 1 umsetzen: Vollständiges Recipe-CRUD mit Zutaten, Schritten, Tags, Rating, Foto-Upload, Suche und Sortierung. Keine URL-Import-Features — nur manuelle Eingabe. Orientiere dich strikt am PRD § 6 FR-004 bis FR-009 und den Screens in § 8."

---

## Phase 2 — Recipe URL-Import

**Goal:** URL einfügen → JSON-LD Parser → Preview → Bearbeiten → Speichern.
**Demo:** Link von Chefkoch, NYT Cooking oder Kitchen Stories wird automatisch gescraped und ist nach 3 Klicks in der Library.
**Reference-Sections:** PRD § 4 (API: /api/recipes/import), § 5 (US-01), § 6 (FR-005), § 13 (Edge Cases: URL-Import).

- [x] **TASK-039** — URL-Fetch + JSON-LD-Parser implementieren
  Files: `src/lib/recipe-parser.ts`, `src/lib/recipe-parser.test.ts`
  Notes: `fetch(url)` server-side, DOMParser via `linkedom` (npm install), JSON-LD extrahieren, `@type: "Recipe"` finden (auch nested in `@graph`).

- [x] **TASK-040** — Einheiten-Normalisierung für importierte Zutaten
  Files: `src/lib/ingredient-normalizer.ts`, `*.test.ts`
  Notes: "2 EL" + "2 Esslöffel" → beide als `{quantity: 2, unit: "EL"}`. Deutsche + englische Einheiten. Rundung auf 2 Nachkommastellen.

- [x] **TASK-041** — Kategorie-Klassifikation für importierte Zutaten
  Files: `src/lib/ingredient-categorizer.ts`, `*.test.ts`
  Notes: Keyword-basiertes Matching (z.B. "Zwiebel"/"Karotte"/... → gemuese). Fallback `andere`. Minimal-Dictionary ca. 200 Zutaten reicht für MVP.

- [x] **TASK-042** — API Route `/api/recipes/import`
  Files: `src/app/api/recipes/import/route.ts`
  Notes: Body: `{url}`. Zod-Validate. Fehler-Responses: 400 (invalid URL), 422 (kein JSON-LD), 502 (fetch failed). Rate-Limit: 10/min pro Session.

- [x] **TASK-043** — "Rezept importieren" UI: URL-Input → Preview-Form
  Files: `src/app/(app)/recipes/new/page.tsx` (erweitern), `src/components/recipe/import-form.tsx`
  Notes: Tabs: "Importieren" | "Manuell". Import-Flow: URL → Loading → Form vorbefüllt → Submit.

- [x] **TASK-044** — Fallback bei Import-Fehler: Manual-Form mit vorausgefülltem Titel
  Files: `src/components/recipe/import-form.tsx`
  Notes: Fetch `<title>`-Tag als Fallback. User sieht freundliche Meldung + kann weitermachen.

- [x] **TASK-045** — Foto-Import aus Meta-Tags (`og:image` / JSON-LD `image`)
  Files: `src/lib/recipe-parser.ts`
  Notes: Herunterladen, auf Minio uploaden (server-side). Falls fail, User kann später manuell hochladen.

- [x] **TASK-046** — Test mit 5 realen Kochseiten (Chefkoch, NYT, Kitchen Stories, BBC Good Food, einfachbacken.de)
  Files: `src/lib/recipe-parser.test.ts`, Fixtures in `test/fixtures/*.html`
  Notes: Vitest Snapshots für geparste Outputs. Dokumentiere in Kommentar, welche Seiten funktionieren.

**Phase 2 Summary Prompt für Claude Code:**
> "Phase 2 umsetzen: URL-Import für Rezepte via JSON-LD-Parsing. Deutsche Kochseiten (Chefkoch, einfachbacken) haben Priorität. Inkl. Einheiten-Normalisierung, Kategorie-Klassifikation, Foto-Download. Robuste Error-Handling gemäß PRD § 13."

---

## Phase 3 — Meal Planning + Shopping List (Magic Moment)

**Goal:** Der komplette Sonntag-Abend-Flow funktioniert. Wochenplan erstellen → Einkaufsliste generieren → abhaken.
**Demo:** 5 Rezepte werden in eine Woche eingeplant, Einkaufsliste wird generiert, auf dem Handy abgehakt.
**Reference-Sections:** PRD § 3 (mealPlanEntries, shoppingLists, shoppingListItems), § 4 (Aggregation Algorithm), § 5 (US-05..10), § 6 (FR-010..019), § 8 (Wochenplan, Einkaufsliste Screens).

- [x] **TASK-047** — MealPlanEntries, ShoppingLists, ShoppingListItems Schema
  Files: `src/db/schema.ts`
  Notes: Siehe PRD § 3. Migrations generieren + ausführen.

- [x] **TASK-048** — Server Actions: addMealPlanEntry, removeMealPlanEntry, updateServings
  Files: `src/actions/week.ts`
  Notes: Date-Handling mit `date-fns` (Zeitzone beachten — verwende `startOfWeek` mit `weekStartsOn: 1` für Montag).

- [x] **TASK-049** — Wochenplan-Seite Desktop (7-Spalten-Grid)
  Files: `src/app/(app)/week/page.tsx`, `src/components/week/week-grid.tsx`, `src/components/week/day-column.tsx`
  Notes: URL-Param `?week=2026-W16` für Navigation. Aktuelle Woche als Default.

- [x] **TASK-050** — Wochenplan-Seite Mobile (Liste mit 7 Sections)
  Files: `src/components/week/week-grid.tsx` (responsive: Grid+List in einer Komponente via `hidden md:grid` / `flex md:hidden`)
  Notes: Responsive: unter 768px die Liste, darüber das Grid.

- [x] **TASK-051** — Rezept-Picker-Sheet (Mobile + Desktop)
  Files: `src/components/week/recipe-picker.tsx`
  Notes: Sheet mit Suche + Tag-Filter (reuse von Phase 1). Klick → zu Tag hinzufügen.

- [x] **TASK-052** — Portionen-Anpassung pro Entry (Inline-Input)
  Files: `src/components/week/day-entry.tsx`
  Notes: Optimistic UI. Bei Blur → Server Action.

- [x] **TASK-053** — Entry löschen (Click desktop + mobile mit Confirm-Dialog)
  Files: `src/components/week/day-entry.tsx`
  Notes: AlertDialog-Bestätigung statt Swipe-Gesture (Phase 4 polish kann `react-swipeable` nachrüsten).

- [x] **TASK-054** — Woche-Navigation (vor/zurück Buttons + aktuelle Woche anzeigen)
  Files: `src/components/week/week-header.tsx`
  Notes: ISO-Wochennummer anzeigen ("KW 17").

- [x] **TASK-055** — Shopping-List-Aggregationslogik
  Files: `src/lib/shopping-list.ts`, `src/lib/shopping-list.test.ts`
  Notes: Siehe PRD § 4 Pseudocode. Unit-Converter für g↔kg, ml↔l, TL↔EL. 15 Vitest-Cases inkl. Einheiten-Konvertierung, Kategorie-Tiebreak, Sortierung.

- [x] **TASK-056** — Server Action: generateShoppingList
  Files: `src/actions/shopping.ts`
  Notes: Idempotent. Bei existierender Liste: Custom-Items (customAdded=true) bleiben erhalten, nur die Rezept-Items werden neu generiert.

- [x] **TASK-057** — "Einkaufsliste generieren"-Button im Wochenplan
  Files: `src/components/week/generate-shopping-list-button.tsx`
  Notes: Bei bestehender Liste: Confirm-Dialog. Nach Generation: redirect zu `/shopping`.

- [x] **TASK-058** — Einkaufsliste-Seite
  Files: `src/app/(app)/shopping/page.tsx`, `src/components/shopping/shopping-list.tsx`, `src/components/shopping/category-group.tsx`, `src/components/shopping/item-row.tsx`
  Notes: Gruppiert nach Kategorie (Reihenfolge laut PRD § 6 FR-016).

- [x] **TASK-059** — Item abhaken mit Optimistic UI
  Files: `src/components/shopping/item-row.tsx`, `src/actions/shopping.ts`
  Notes: Lokaler State + useTransition für Optimistic Toggle. Fehler-Handling: revert + Toast.

- [x] **TASK-060** — Custom-Item hinzufügen (Name + optional Menge/Einheit/Kategorie)
  Files: `src/components/shopping/add-custom-item.tsx`
  Notes: Inline-Form am Ende der Liste.

- [x] **TASK-061** — Progress-Anzeige "X von Y erledigt"
  Files: `src/components/shopping/progress-bar.tsx`
  Notes: Sticky Top-Header.

- [x] **TASK-062** — Historie: Ältere Einkaufslisten zugreifbar
  Files: `src/app/(app)/shopping/page.tsx` (Tabs: "Aktuell" / "Verlauf"), `src/components/shopping/history-list.tsx`
  Notes: Liste der letzten 8 Wochen; Detail-View via `?list=<id>` (read-only).

- [ ] **TASK-063** — E2E-Test für den Magic Moment (Playwright) *(deferred to Phase 4)*
  Files: `e2e/magic-moment.spec.ts`
  Notes: Playwright nicht installiert; Entscheidung: Phase 4 zusammen mit Polish-Work. Manual Verification in Phase 3 ausreichend.

**Phase 3 Summary Prompt für Claude Code:**
> "Phase 3 umsetzen: Wochenplan + Einkaufsliste. Der Sonntag-Abend-Flow muss am Ende in unter 5 Minuten durchlaufbar sein. Aggregation korrekt mit Einheiten-Konvertierung. E2E-Test für den gesamten Magic-Moment-Flow."

---

## Phase 4 — Installable + Polish

**Goal:** Installierbar auf Handy (Home-Screen-Icon), UX-Schliff, Lighthouse grün.
**Demo:** App auf iPhone via "Zum Home-Bildschirm" installiert, fullscreen gestartet, alle Pages laden in <1s mit sauberen Loading/Error-States.
**Reference-Sections:** PRD § 6 (FR-020, FR-024), § 7 (Performance, Accessibility).

**Scope-Entscheidung (2026-04-19):** Service-Worker-basiertes Offline-Sync (ehemals TASK-064 + TASK-066) wurde aus Phase 4 entfernt und ins Ideas Backlog verschoben. Begründung: App ist extern erreichbar, Komplexität von IndexedDB-Queue + Sync-Konflikten nicht gerechtfertigt ohne konkreten Supermarkt-Netz-Pain. PWA-Manifest bleibt drin, weil billig und hoher UX-Nutzen. Re-evaluieren nach 2-3 Monaten realer Nutzung.

- [x] **TASK-064** — PWA Manifest + Icons
  Files: `public/manifest.json`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/maskable-512.png`, `src/app/layout.tsx` (metadata)
  Notes: Icons im Terracotta/Cream Design. Manifest mit `display: standalone`, theme_color, background_color aus PRD § 9. `<link rel="manifest">` in root layout. Kein Service Worker.

- [x] **TASK-065** — Offline-Indikator Banner
  Files: `src/components/layout/offline-banner.tsx`, `src/app/(app)/layout.tsx`
  Notes: `navigator.onLine` + `online`/`offline` Events. Banner oben sichtbar wenn offline: "Du bist offline. Änderungen werden nicht gespeichert." Auch ohne Service Worker nützlich als Warnung.

- [x] **TASK-066** — Lighthouse-Audit durchführen und Issues fixen
  Files: diverse
  Notes: Ziel: Accessibility ≥95, Performance ≥80, Best Practices ≥90. (PWA-Score ohne Service Worker limitiert — nicht als Ziel.) Fix typische Issues (Image-Dimensionen, Contrast, Labels).

- [x] **TASK-067** — Tastatur-Navigation testen und fixen
  Files: diverse
  Notes: Tab-Order, Focus-Visible, Esc schließt Dialoge, Enter submitted Forms.

- [x] **TASK-068** — Loading-Skeletons für alle Pages
  Files: `src/app/(app)/**/loading.tsx`
  Notes: Next.js `loading.tsx` Convention.

- [x] **TASK-069** — Error-Boundaries + freundliche Error-Pages
  Files: `src/app/(app)/**/error.tsx`, `src/app/global-error.tsx`
  Notes: Reset-Button, Fehler-ID für Debugging.

- [x] **TASK-070** — Toast-Feedback für alle Actions (sonner)
  Files: diverse Server Actions + Components
  Notes: Erfolg: "Rezept gespeichert." / Fehler: konkrete Meldung.

- [x] **TASK-071** — Deutsche Datumsformatierung überall
  Files: `src/lib/date.ts`
  Notes: `date-fns` mit `de` locale. Format "Mo, 17. Apr".

**Phase 4 Summary Prompt für Claude Code:**
> "Phase 4 umsetzen: Aus der Web-App wird eine installierbare App via PWA-Manifest (Home-Screen, Standalone-Display). Kein Service Worker, kein Offline-Sync — nur Manifest, Offline-Indikator, Lighthouse-Polish und UX-Schliff überall."

---

## Phase 5 — Household Sharing + Settings

**Goal:** Ehefrau wird eingeladen und kann die App nutzen. Settings-Page funktional.
**Demo:** Dominic lädt Frau ein → Frau empfängt E-Mail → klickt Link → ist drin → sieht gleiche Rezepte + Plan.
**Reference-Sections:** PRD § 5 (US-11, US-12), § 6 (FR-003, FR-023).

- [x] **TASK-072** — Settings-Page: Household-Section
  Files: `src/app/(app)/settings/page.tsx`, `src/components/settings/household-section.tsx`
  Notes: Name editieren, Mitglieder-Liste, "+ Einladen".

- [x] **TASK-073** — Invite-Flow: Mitglied einladen
  Files: `src/actions/household.ts`, `src/components/settings/invite-member-dialog.tsx`
  Notes: E-Mail-Eingabe → Magic-Link wird generiert mit Household-ID im Query-Param (signiert, nicht raw ID).

- [x] **TASK-074** — Invite-Link-Handler: Neuer User wird Household-Member nach Login
  Files: `src/app/api/auth/[...all]/route.ts` (Hook erweitern), `src/actions/household.ts`
  Notes: Bei erstem Login mit Invite-Token: statt neuen Household anzulegen → bestehenden joinen.

- [x] **TASK-075** — E-Mail-Template für Invite
  Files: `src/lib/email.ts`
  Notes: "Dominic hat dich zu Familie Cardellino eingeladen. Klick hier, um beizutreten."

- [x] **TASK-076** — Mitglied entfernen (nur owner)
  Files: `src/components/settings/member-row.tsx`
  Notes: Confirm-Dialog. Owner kann sich nicht selbst entfernen (Ownership-Transfer nötig, Phase 6).

- [x] **TASK-077** — Account-Section: Abmelden-Button
  Files: `src/components/settings/account-section.tsx`
  Notes: Sign-out Action → redirect zu /login.

- [x] **TASK-078** — Authorization-Layer: alle Reads/Writes prüfen auf Household-Membership
  Files: `src/lib/authz.ts`, diverse Server Actions + Queries
  Notes: Helper `requireHouseholdAccess(resourceHouseholdId)` — throw wenn not member. Audit: jede Action muss das nutzen.

- [x] **TASK-079** — E2E-Test: Zwei-User-Flow
  Files: `e2e/household.spec.ts`
  Notes: User A erstellt Rezept → User B wird eingeladen → sieht das Rezept.

**Phase 5 Summary Prompt für Claude Code:**
> "Phase 5 umsetzen: Household-Sharing-Features. Invite-Flow via Magic Link, Settings-Page, strikte Authorization, dass Daten nur innerhalb des eigenen Household sichtbar sind."

---

## Phase 6 — Backup, Monitoring, Operational Hardening

**Goal:** Produktiv betriebsbereit ohne Sorgen. Backups automatisiert, Monitoring live.
**Demo:** Postgres-Dump vom gestrigen Tag wiederherstellbar. Uptime-Kuma zeigt grün.
**Reference-Sections:** deployment.md § 4 (Backup), § 5 (Monitoring).

- [ ] **TASK-080** — pgBackRest oder `pg_dump` Cron-Job auf VPS einrichten
  Files: `scripts/backup-postgres.sh`, Crontab-Eintrag
  Notes: Täglich 03:00 Uhr. 7 Tage Retention lokal, 30 Tage off-site.

- [ ] **TASK-081** — Off-site Backup zu Hetzner Storage Box via `rclone`
  Files: `scripts/backup-offsite.sh`, `/root/.config/rclone/rclone.conf`
  Notes: Nach jedem lokalen Backup triggern.

- [ ] **TASK-082** — Minio-Daten-Backup (auch inkl. Photos)
  Files: `scripts/backup-minio.sh`
  Notes: `mc mirror` zu zweitem Minio oder Storage Box.

- [ ] **TASK-083** — Restore-Testlauf dokumentieren
  Files: `docs/runbooks/restore-postgres.md`
  Notes: Einmal ausführen auf Staging → bestätigen dass es funktioniert. Dokumentieren.

- [ ] **TASK-084** — Uptime Kuma deployen (auch im Coolify-Stack)
  Files: Coolify-Config
  Notes: Monitoring für Main-App, Postgres-Port, Minio-Port.

- [ ] **TASK-085** — Health-Check-Endpoint `/api/health`
  Files: `src/app/api/health/route.ts`
  Notes: Testet DB-Connection + Minio-Connection. Returns 200 oder 503.

- [ ] **TASK-086** — Alerting via Email oder Telegram einrichten
  Files: Uptime-Kuma-Config
  Notes: Bei 2min Downtime → Benachrichtigung. Keep it simple.

- [ ] **TASK-087** — Rate-Limit für Magic-Link-Endpoint aktivieren
  Files: `src/app/api/auth/[...all]/route.ts` oder Middleware
  Notes: 5 Requests/h pro E-Mail-Adresse. Simple in-memory mit LRU oder Redis falls verfügbar.

**Phase 6 Summary Prompt für Claude Code:**
> "Phase 6 umsetzen: Produktion-Hardening. Backups, Monitoring, Health-Checks, Rate-Limiting. Ziel: wir können 3 Monate ohne Blick drauf den Betrieb laufen lassen."

---

## Phase 7 — AI-Import (Post-MVP)

**Goal:** Screenshots, Instagram-Links, Freitext → strukturiertes Rezept via LLM.
**Demo:** Screenshot einer Instagram-Story mit Rezept → 5 Sekunden später als Eintrag in der Library.
**Reference-Sections:** PRD § 6 (FR-028).

- [x] **TASK-088** — Provider-Wahl: Claude API (Anthropic) oder OpenAI
  Files: `src/lib/ai-import.ts`, `src/lib/ai-providers/{types,anthropic,gemini}.ts`
  Notes: Statt einer einmaligen Provider-Wahl ist der Provider jetzt zur Laufzeit per
  `AI_PROVIDER=anthropic|gemini`-Env-Var umschaltbar (kein automatischer Fallback).
  Claude Sonnet und Gemini nutzen beide Vision + strukturierten JSON-Output
  (Tool-Use bzw. `responseSchema`), validiert gegen dasselbe Zod-Schema in
  `src/lib/ai-providers/types.ts`. OpenAI wurde nicht umgesetzt — Gemini statt
  OpenAI gewählt (Nutzerentscheidung).

- [ ] **TASK-089** — UI: "AI-Import"-Tab in /recipes/new
  Files: `src/components/recipe/ai-import-form.tsx`
  Notes: **Abweichung vom ursprünglichen Plan:** Statt eines separaten Tabs mit drei
  Input-Varianten (URL/Foto/Freitext) wurde der Instagram-Import bewusst in den
  bestehenden "Importieren"-Tab integriert (`src/components/recipe/import-form.tsx`).
  Die API-Route erkennt `instagram.com`-URLs am Hostname und schaltet automatisch
  auf den KI-Pfad um — kein manuelles Foto-Upload/Freitext-Feld in der UI, rein
  URL-basiert. Siehe TASK-090/091. Nutzerentscheidung, daher bewusst nicht abgehakt.

- [x] **TASK-090** — Bild-Analyse (Vision-Input)
  Files: `src/lib/instagram-import.ts`, `src/lib/ai-import.ts`
  Notes: Statt Foto-Upload durch die Nutzerin: `og:image` des Instagram-Posts wird
  automatisch geladen und bei fehlender/unbrauchbarer Caption per Claude Vision
  analysiert.

- [x] **TASK-091** — Freitext-Analyse
  Files: `src/lib/instagram-import.ts`, `src/lib/ai-import.ts`
  Notes: `og:description` (Instagram-Caption) wird automatisch geladen, bereinigt
  und bei Erfolg per Claude strukturiert. `src/app/api/recipes/import/route.ts`
  routet `instagram.com`-URLs automatisch auf diesen Pfad statt auf den
  JSON-LD-Parser.

- [x] **TASK-092** — Cost-Tracking (simpler Counter pro Household/Monat)
  Files: `src/db/schema.ts` (`aiImportUsage` Tabelle), `src/lib/ai-usage.ts`
  Notes: Limit 40 KI-Importe pro Haushalt / rollierendem 30-Tage-Fenster, zusätzlich
  zum bestehenden In-Memory-Rate-Limit (10/min/User) in `route.ts`.

- [x] **TASK-093** — Preview-Form für User-Review (reuse aus URL-Import)
  Files: bestehende Komponenten
  Notes: `fetchInstagramRecipe()` liefert denselben `ParseResult`-Vertrag wie
  `fetchRecipeFromUrl()` — die bestehende `RecipeForm`-Vorschau/Bearbeitung aus dem
  URL-Import wird unverändert wiederverwendet, keine neue UI nötig.

**Phase 7 Summary Prompt für Claude Code:**
> "Phase 7 umsetzen: AI-Import via Claude Vision + Text. Für Screenshots, Instagram-Screenshots, und Freitext. User bestätigt immer vor Speichern."

---

## Phase 8 — Optional Nice-to-Haves

Reihenfolge nach Lust und Zeit:

- [ ] **TASK-094** — Wochenplan duplizieren / als Template speichern
- [ ] **TASK-095** — Rezept-Historie "zuletzt gekocht am"
- [ ] **TASK-096** — Rezept als PDF exportieren
- [ ] **TASK-097** — Dark Mode (System-adaptive)
- [ ] **TASK-098** — Command Palette (Cmd+K)
- [ ] **TASK-099** — "Gäste heute?" Flag pro Entry → Portionen ×2

---

## Agent Session Guide

**Wie Claude Code am besten mit diesem Projekt arbeiten soll:**

1. **Eine Session pro Phase.** Starte mit dem Summary-Prompt der Phase. Halte dich an die Task-Reihenfolge.
2. **Nach jedem Task:** Markiere ihn mit `- [x]` in dieser Datei, committe die Änderung, gehe zum nächsten.
3. **Wenn du auf eine Entscheidung stößt, die nicht in PRD/Vision ist:** Stelle sie als Frage, bleibe in der Session, erwarte Antwort bevor du weitermachst.
4. **Wenn ein Task größer ist als gedacht:** Splitte ihn in Sub-Tasks mit eigenem Commit, aber markiere den Parent-Task erst komplett wenn alle Sub-Tasks fertig.
5. **Phase-Ende:** Erstelle einen Phase-PR (siehe PLAID-Workflow), lasse ggf. CodeRabbit drüberschauen, merge.
6. **Referenzen selektiv lesen:** Lies nur die in der Phase genannten PRD-Sektionen — nicht jedes Mal das ganze Dokument.

---

## Ideas Backlog (nicht priorisiert, nicht eingeplant)

- **Offline-Support für Einkaufsliste via Service Worker** (ehemals Phase 4 TASK-064 + TASK-066): Serwist + IndexedDB-Queue für Toggle-Actions + Background Sync. Re-evaluieren nach 2-3 Monaten Nutzung — nur bauen, wenn reales Feedback zeigt, dass Supermarkt-Netzempfang ein Problem ist.
- Siri/Alexa-Integration ("Was kochen wir heute?")
- Weight-Watcher/Kalorien (low effort mit `foodrepo` oder OpenFoodFacts API)
- Automatische Saison-Empfehlungen (Gemüse der Saison highlighten)
- Familien-Mitglieds-Präferenzen ("X mag keinen Fisch" → Warnung beim Planen)
- Integration mit Rewe/Edeka App (Einkaufsliste direkt in deren Bestell-UI) — unwahrscheinlich
- Voice-to-Recipe während man kocht ("Nächster Schritt")
- Dynamischer Wochen-Plan-Generator auf Basis von Lust-Tags + Inventar



876532931f2a089c1622f8dac69e6787