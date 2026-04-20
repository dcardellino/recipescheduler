# RecipeScheduler — Product Vision

> Persönliche Rezept-Bibliothek mit Wochenplaner und automatischer Einkaufsliste, self-hosted für die Familie.

---

## 1. Vision & Mission

**Vision**
Jeder Sonntagabend ist ruhig, weil die Woche kulinarisch geplant ist — ohne Zettelwirtschaft, ohne doppeltes Einkaufen, ohne "Was kochen wir eigentlich?".

**Mission**
RecipeScheduler bündelt Rezept-Bibliothek, Wochenplaner und Einkaufsliste in einer schlanken, self-hosted PWA, die Dominic und seine Frau täglich benutzen — ohne Abo, ohne Werbung, ohne Datenabfluss.

**Founder's Why**
Dominic kocht viel, sammelt Rezepte aus verschiedenen Quellen und will Kontrolle über seine Daten behalten. Die existierenden Lösungen (Paprika, Notion, Chefkoch) sind entweder proprietär, zu generisch, oder decken den gesamten Flow Library→Plan→Liste nicht ab. Als DevOps-Engineer will er die Infrastruktur selbst kontrollieren und die App genau auf seinen Workflow zuschneiden.

**Core Values**

1. **Datenhoheit** — Nichts wird zu Drittanbietern geschickt. Postgres, Minio und App laufen auf eigener Infrastruktur.
2. **Ruhige UX** — Kein Gamification, keine Push-Notifications, keine Onboarding-Wizards. Die App soll sich anfühlen wie ein aufgeräumter Küchenzettel, nicht wie Social Media.
3. **Täglich nutzbar** — Jedes Feature muss den Sonntag-Abend-Flow oder die Mittwoch-Abend-Frage "Was kochen wir?" messbar verkürzen.
4. **Familien-tauglich** — Auch die Ehefrau (weniger technisch) muss es ohne Einweisung verstehen und nutzen wollen.

---

## 2. User Research

### Primary Persona: Dominic (der Planer)

- 30er, DevOps Engineer
- Kocht 4–5× pro Woche, plant und kauft ein
- Sammelt Rezepte in Screenshots, Notion, Bookmark-Ordnern
- Frustriert von: Rezepte wiederfinden, Einkaufslisten zusammenstellen, Montag-früh noch entscheiden zu müssen
- Erwartet: Schnelligkeit, Tastatur-Navigation wenn am Desktop, mobile-first Einkaufslisten
- Nutzt die App auf: Desktop (Rezept anlegen), Handy (Einkaufsliste abhaken), Tablet am Küchentisch (Wochenplan)

### Secondary Persona: Ehefrau (die Co-Nutzerin)

- Nutzt die App primär zum Nachschlagen ("Was kochen wir heute?") und gelegentlich zum Hinzufügen eines Favorite
- Wenig Interesse an Konfiguration oder Technik
- Erwartet: Klar erkennbare Buttons, Fotos, keine Lernkurve
- Nutzt die App hauptsächlich auf: Handy

### Tertiary Persona (Phase 3): Familie (Eltern, Geschwister)

- Eigene Haushalte, könnten ihre eigene Rezeptsammlung führen
- Teilen-Feature wäre willkommen ("Mama, schau dir dieses Rezept an")

### Jobs to be Done

| Situation | Job | Outcome |
|---|---|---|
| Sonntag 20 Uhr, Woche steht an | Wochenplan erstellen + Einkaufsliste generieren | In <5min fertige Liste auf dem Handy |
| Mittwoch 18 Uhr, müde | Nachschauen, was heute geplant ist + Rezept öffnen | In <10sek bei der Zubereitungs-Anleitung |
| Montag, im Supermarkt | Einkaufsliste abhaken, nichts vergessen | Alle Zutaten beisammen, keine Doppelkäufe |
| Samstag, Instagram-Scrolling | Gutes Rezept entdeckt, speichern | URL in App einfügen → strukturiert abgespeichert |
| Sonntagnachmittag, Rezept-Suche | "Etwas Schnelles, Vegetarisches" finden | Filter nach Tag+Zeit → Vorschläge |

### Pain Points (aktuell gelöst mit...)

- **Rezept-Chaos** → Screenshots, Notion, Bookmarks, Kochbücher (verteilt, nicht durchsuchbar)
- **Planungs-Paralyse** → mentaler Wochenplan, oft am Tag selbst entschieden
- **Einkaufs-Reibung** → handschriftlicher Zettel, teils vergessene Zutaten
- **Wiederholung** → keine Historie → jede Woche von Null

### Key Assumptions to Validate

1. URL-Import aus deutschen Kochportalen (Chefkoch, Kitchen Stories) funktioniert zuverlässig via JSON-LD
2. Die Ehefrau akzeptiert Magic-Link-Login (einmalig einrichten, dann selten wieder)
3. Das Sonntag-Abend-Ritual setzt sich tatsächlich durch (nicht "cool in Theorie, nie genutzt")
4. Einkaufsliste gruppiert nach Kategorie ist wertvoller als Liste in Rezept-Reihenfolge
5. Portionen-Skalierung ist oft genug relevant, um das Feature zu rechtfertigen (vs. mental umrechnen)

### User Journey: Sonntag-Abend-Ritual (der Magic Moment)

1. Dominic öffnet die App auf dem Tablet, wechselt in "Wochenplan"
2. Sieht leere Woche (Mo-So) → öffnet Rezept-Library in Sidebar
3. Filtert auf "schnell" oder "vegetarisch" → sieht Favoriten
4. Zieht/klickt 4–5 Rezepte in die Wochentage
5. Klickt "Einkaufsliste generieren"
6. Sieht gruppierte Liste (Gemüse, Milchprodukte, Tiefkühl, Trocken, Getränke)
7. Entfernt Zutaten, die er noch zuhause hat
8. Liste wird automatisch synchronisiert — am nächsten Tag im Supermarkt am Handy abhakbar

---

## 3. Product Strategy

### Product Principles

1. **Der Workflow ist wichtiger als die Feature-Liste.** Jede neue Funktion muss den Sonntag-Flow oder den Mittwoch-Flow verbessern — sonst wird sie abgelehnt.
2. **Mobile wins for consumption, Desktop wins for curation.** Desktop für Rezept-Anlegen und Wochenplan-Erstellung, Handy für Einkaufsliste und Rezept-Anschauen beim Kochen.
3. **Keine Daten ohne Zweck.** Wir speichern nur, was der User aktiv eingibt oder was nützlich für ihn ist. Keine Analytics, kein Tracking.
4. **Lokale Geschwindigkeit über Cloud-Features.** Optimistisches UI, keine Ladespinner für Standard-Aktionen, schneller First-Paint durch serverseitiges Rendering.

### Market Differentiation

Im Vergleich zu Paprika/Mealime/Plan to Eat:

- **Self-hosted** → Datenhoheit, keine Abo-Kosten
- **Deutsche Kochportale als first-class URL-Import** (Chefkoch etc. — nicht alle US-Apps unterstützen das)
- **Household-Model** statt Single-User oder vollem Multi-Tenant → realistisch für eine Familie
- **Keine Social Features** → keine Ablenkung, keine Rezept-Shops, keine "Cookbooks to Buy"

### Magic Moment Design

**Trigger:** Sonntag um 20:00 Uhr öffnet Dominic die App.

**Flow:** Leere Woche → 5 Rezepte picken (dauert 2–3min) → "Einkaufsliste" klicken → fertig.

**Payoff:** Am Montag im Supermarkt ist die Liste einsortiert nach Regal-Reihenfolge, mit Häkchen abhakbar, synchronisiert mit Ehefrau.

**Messbarkeit:** Zeit von "App geöffnet" bis "Einkaufsliste fertig" < 5min in 80% der Fälle.

### MVP Definition

**In Scope (MVP — Phase 0–2):**

- Authentication (Better Auth Magic Link)
- Household-Model (Dominic + Ehefrau teilen Rezepte, Plan, Einkaufsliste)
- Rezept-CRUD (anlegen, editieren, löschen, anschauen)
- URL-Import aus JSON-LD-Recipe-Quellen
- Foto-Upload (Minio)
- Rezept-Suche + Tag-Filter + Rating
- Wochenplan-View mit Drag oder Klick
- Portionen-Skalierung pro Planungs-Eintrag
- Einkaufsliste — auto-generiert, nach Kategorie gruppiert, abhakbar
- PWA-Manifest (installierbar, Home-Screen-Icon, Standalone-Display)
- Deutsche Sprache UI

**Explicitly Out of Scope (für MVP):**

- AI-Import (Instagram, Screenshots, Freitext) → Phase 3
- Social Features (Rezept teilen mit Nicht-Household-Members)
- Kommentare, mehrere Bewertende
- Nährwerte / Kalorien-Tracking
- Meal-Prep-Batch-Features
- Multi-Language (nur Deutsch im MVP)
- Public Rezept-Database / Rezept-Discovery zwischen fremden Usern
- Inventar-Tracking ("was habe ich zuhause?")
- iOS/Android Native Apps
- Kalender-Sync (Google Cal, iCal)
- Rezept-Versionierung

### Feature Priority (MoSCoW)

**Must Have (MVP)**
Auth + Household, Rezept-CRUD, URL-Import, Wochenplan, Einkaufsliste, PWA mobile.

**Should Have (Post-MVP Phase 2)**
Foto-Upload, Portionen-Skalierung, Tag-Filter, Rating+Notizen, Shopping-List Kategorisierung-Customization.

**Could Have (Phase 3+)**
AI-Import, Export-Funktionen (PDF Rezept), Wochenplan-Duplizierung/Templates, Rezept-Historie ("wann zuletzt gekocht").

**Won't Have (explicit)**
Social Features, Nährwerte, Native Apps, multi-tenant SaaS.

### Core User Flows

1. **Rezept aus URL speichern** → Paste URL → Preview → Bearbeiten → Tags → Speichern
2. **Rezept manuell erstellen** → Foto → Titel → Zutaten (strukturiert) → Zubereitung → Metadaten
3. **Woche planen** → Wochenansicht → Rezept aus Library picken → Tag zuordnen → Portionen anpassen
4. **Einkaufsliste generieren** → aus Wochenplan → gruppiert → editierbar → abhakbar
5. **Einkaufen** → Mobile Liste → Abhaken → Sync mit Partner

### Success Metrics

**Produkt-Erfolg:**

- 4 Wochen hintereinander genutzt (= Gewohnheit etabliert)
- ≥20 Rezepte in der Bibliothek
- ≥80% der geplanten Wochen haben generierte Einkaufsliste
- Ehefrau nutzt App mindestens 1×/Woche selbständig

**Technische KPIs:**

- Page-Load < 1.5s (self-hosted)
- PWA-Manifest installiert auf Dominics + Ehefraus Handy (Home-Screen-Icon)
- 99% Uptime (messbar via Uptime Kuma oder ähnlich)

### Risks

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|
| URL-Import bricht bei Seiten ohne JSON-LD | mittel | mittel | Fallback auf manuelle Eingabe, klare UX bei Fehler |
| Ehefrau nutzt App nicht (UX-Problem) | mittel | hoch | Regelmäßiges Feedback einholen, simple UI, gemeinsames Onboarding |
| Self-Hosting-Zeitaufwand höher als gedacht | mittel | mittel | Coolify/Dokploy nutzen, nicht alles from scratch |
| Feature-Creep — nie fertig | hoch | hoch | Strikte Phasen-Einteilung (siehe Roadmap), MVP first |
| Magic-Link-Email landet im Spam | niedrig | mittel | Resend mit SPF/DKIM korrekt konfigurieren |
| Postgres-Datenverlust ohne Backup | niedrig | sehr hoch | Automatisiertes Backup ab Tag 1 (siehe deployment.md) |

---

## 4. Brand Strategy

### Positioning Statement

Für kochende Paare und Familien, die Datenhoheit und Alltagsfunktion über cloud-basierte Features stellen, ist **RecipeScheduler** die self-hosted PWA, die Rezept-Bibliothek, Wochenplan und Einkaufsliste in einem ruhigen, warmen Interface vereint — ohne Abo, ohne Werbung, ohne Tracking.

### Brand Personality

- **Ruhig** — keine Aufregung, keine Notifications, kein Dark Pattern
- **Warm** — Farben und Typografie wirken wie eine gut ausgestattete Küche
- **Zuverlässig** — schnell, vorhersehbar, klar kommuniziert wenn mal etwas nicht funktioniert (z.B. offline)
- **Diskret** — keine Account-Felder die nicht gebraucht werden, kein Überreden

### Voice & Tone Guide

**Sprache:** Deutsch, per Du, direkt, freundlich, ohne SaaS-Sprache.

**DO**
- "Rezept gespeichert." statt "Your recipe has been successfully saved!"
- "Woche planen" statt "Create a meal plan"
- "Zutaten" statt "Ingredients"
- Konkrete Fehlermeldungen: "Das sieht nicht nach einem gültigen Rezept-Link aus. Versuch's manuell?"

**DON'T**
- Keine "Amazing!"-Wörter, kein Emoji-Spam
- Keine Streaks, keine "Du hast 7 Tage in Folge geplant!"
- Keine Angst/FOMO-Trigger

### Messaging Framework

**Elevator Pitches**

- **5s:** Self-hosted Rezept-App mit Wochenplan und Einkaufsliste.
- **30s:** RecipeScheduler ist eine PWA für kochende Paare/Familien, die ihre Rezept-Bibliothek selbst hosten wollen. Du importierst Rezepte per URL, planst die Woche per Drag-and-Drop, und bekommst automatisch eine gruppierte Einkaufsliste aufs Handy.
- **2min:** Ausführlichere Version mit Problem (Rezept-Chaos, Planungs-Stress, Einkaufs-Reibung), Lösung (die drei Kern-Features), Differentiator (self-hosted, deutschsprachig, Household-Model), und Magic Moment (Sonntag-Ritual).

### Brand Anti-Patterns

- Keine Gamification (Badges, Streaks, Punkte)
- Keine Onboarding-Tutorials mit Overlays
- Keine Werbung, kein Cross-Selling
- Keine "AI-Chef schlägt dir ein Rezept vor"-Features im MVP (kommt eventuell sehr begrenzt in Phase 3)
- Kein Social Sharing-Druck
- Keine E-Mail-Newsletter / Push-Notifications

---

## 5. Design Direction

### Design Philosophy

**"Cozy Kitchen"** — Das Interface soll sich anfühlen wie eine gut organisierte, liebevoll eingerichtete Küche. Warme Farben, großzügiger Whitespace, essen-fokussierte Bilder im Vordergrund, UI-Elemente dezent im Hintergrund.

### Visual Mood

Inspirationen: Paprika App, Kitchen Stories, NYT Cooking (ohne deren Abo-Walls), Notion's ruhige Ästhetik.

**Stimmungs-Ankerpunkte:**
- Sonntagabend in der Küche
- Frisches Brot auf Holztisch
- Handgeschriebene Notizen in einem Rezeptbuch

### Color Palette

**Primary (Terracotta / Warmes Orange-Rot)**
- `--color-primary: #C85A3E` (Terracotta 600)
- `--color-primary-hover: #A84730`
- `--color-primary-soft: #F5E3DB` (für Hover-Backgrounds)

**Secondary (Olivgrün)**
- `--color-secondary: #6B7F3E` (Olive 600)
- `--color-secondary-soft: #E5EAD5`

**Neutrals (Cream / Warmes Grau)**
- `--color-bg: #FAF7F2` (Cream)
- `--color-bg-card: #FFFFFF`
- `--color-border: #E8E2D5`
- `--color-text: #2A2724` (fast schwarz, warm)
- `--color-text-muted: #6B665E`

**Accents**
- `--color-success: #5A7F3E` (Grün-Olive Variante)
- `--color-warning: #D99B33` (warmes Gelb)
- `--color-danger: #B54A3D` (warmes Rot, verwandt mit Primary)

**Dark Mode** (System-adaptive, Phase 2):
- `--color-bg-dark: #1F1C18`
- `--color-bg-card-dark: #2A2724`
- `--color-text-dark: #F5F1E8`

### Typography

**Headings: "Fraunces"** (Serif, warm, leicht verspielt — Google Fonts)
- Font-Weight: 500 (Medium) für H1/H2, 400 für H3+

**Body: "Inter"** (Sans-Serif, extrem lesbar — Google Fonts)
- Font-Weight: 400 regular, 500 medium für Buttons

**Optional Mono (für Timer/Portionen): "JetBrains Mono"**

**Scale:**
- H1: 2rem (32px) Fraunces 500
- H2: 1.5rem (24px) Fraunces 500
- H3: 1.25rem (20px) Fraunces 500
- Body: 1rem (16px) Inter 400
- Small: 0.875rem (14px) Inter 400

### Spacing & Layout

**Base Unit:** 4px
**Spacing Scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96px

**Layout-Prinzipien:**
- Maximum Content Width: 1280px (Desktop)
- Mobile Breakpoint: 640px
- Cards haben 16–24px Padding, 12px Border Radius
- Mindestens 24px Abstand zwischen Sektionen
- Rezept-Karten im Grid: 280px Min-Width, auto-fit

### Component Philosophy

- **shadcn/ui** als Basis-Komponentenset
- Kein "Button-Feuerwerk" — maximal 2 Primary-Actions pro View
- Modals nur für destruktive Aktionen (Löschen) oder Auth-Flows
- Forms mit inline-Validierung, klaren Fehlermeldungen auf Deutsch
- Rezept-Karten zeigen: Foto (wenn vorhanden), Titel, Zeit, Rating — Rest auf Detail-View

### Iconography

- **Lucide Icons** (shadcn/ui Default, sehr clean, konsistent)
- Stroke-Width: 1.75
- Größen: 16, 20, 24px
- Sparsam einsetzen — nicht jeder Button braucht ein Icon

### Accessibility Commitments

- WCAG AA Kontrast-Ratios für allen Text
- Fokus-Indikatoren auf allen interaktiven Elementen (2px Outline in Primary-Farbe)
- Tastatur-Navigation vollständig (Cmd+K für Search, Keyboard Shortcuts für Wochenplan)
- Semantisches HTML, korrekte Heading-Hierarchie
- Alt-Text-Feld für Rezept-Fotos
- Touch-Targets min. 44×44px auf Mobile

### Motion & Interaction

- Micro-Animationen (150–200ms ease-out) für Hover, Toggle, Slide-in
- Keine Spinner außer bei echten Netzwerk-Waits
- Optimistic UI für Checkbox in Einkaufsliste, Rezept-Speichern
- Drag & Drop mit subtiler Haptik/Visual Feedback (Elevation auf Drag Start)

### Design Tokens (CSS Variables)

```css
:root {
  /* Colors */
  --color-primary: #C85A3E;
  --color-primary-hover: #A84730;
  --color-primary-soft: #F5E3DB;
  --color-secondary: #6B7F3E;
  --color-secondary-soft: #E5EAD5;
  --color-bg: #FAF7F2;
  --color-bg-card: #FFFFFF;
  --color-border: #E8E2D5;
  --color-text: #2A2724;
  --color-text-muted: #6B665E;
  --color-success: #5A7F3E;
  --color-warning: #D99B33;
  --color-danger: #B54A3D;

  /* Typography */
  --font-heading: 'Fraunces', Georgia, serif;
  --font-body: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;

  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(42, 39, 36, 0.06);
  --shadow-md: 0 4px 12px rgba(42, 39, 36, 0.08);
}
```

### Tailwind Config Snippet

```js
// tailwind.config.js (theme.extend)
colors: {
  primary: { DEFAULT: '#C85A3E', hover: '#A84730', soft: '#F5E3DB' },
  secondary: { DEFAULT: '#6B7F3E', soft: '#E5EAD5' },
  surface: { DEFAULT: '#FAF7F2', card: '#FFFFFF' },
  ink: { DEFAULT: '#2A2724', muted: '#6B665E' },
  border: '#E8E2D5',
},
fontFamily: {
  heading: ['Fraunces', 'Georgia', 'serif'],
  body: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
},
```

---

## 6. Abschluss

Diese Vision ist der Kompass für alle weiteren Entscheidungen. Wenn eine Feature-Idee oder technische Wahl im Widerspruch zu Values, Product Principles oder Brand Anti-Patterns steht, wird sie entweder verworfen oder die Vision wird bewusst aktualisiert.

Nächste Dokumente: `prd.md` (technische Spec), `product-roadmap.md` (Phasen-Plan), `deployment.md` (Self-Hosting-Guide).
