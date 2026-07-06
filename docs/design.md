---
version: alpha
name: RecipeScheduler
description: Warmes, redaktionelles Design-System für eine persönliche Rezept-Bibliothek mit Wochenplaner und Einkaufsliste — ein literarischer Almanach, kein kühles Tech-Tool. Die Design-Sprache (Token-Palette, Typografie, Shapes) wird gemeinsam mit der Schwesternapp "Atlas" geteilt. Hell und dunkel, ein Rost-Akzent, Serif/Sans/Mono-Trio.

colors:
  surface: "#F6ECE8"
  surface-dark: "#1A1614"
  surface-raised: "#FCF6F3"
  surface-raised-dark: "#241E1B"
  on-surface: "#1F1B19"
  on-surface-dark: "#EDE4DE"
  on-surface-muted: "#8C8178"
  on-surface-muted-dark: "#A2958C"
  border: "#E6DAD4"
  border-dark: "#332A26"
  accent: "#A8432B"
  accent-dark: "#C75A3E"
  on-accent: "#FBF4F1"
  on-accent-dark: "#1A1614"
  success: "#3E6B4F"
  success-dark: "#5E8C6F"
  warning: "#B57F2E"
  warning-dark: "#D19E4E"
  danger: "#8F2C20"
  danger-dark: "#C75144"
  info: "#3B5A6B"
  info-dark: "#6E93A6"
  cat-rust: "#A8432B"
  cat-forest: "#3E6B4F"
  cat-navy: "#2F4858"
  cat-gold: "#B57F2E"
  cat-maroon: "#6E2A2A"
  cat-teal: "#2C6E6A"
  cat-violet: "#6B5B95"
  cat-stone: "#8C8178"

typography:
  display:
    fontFamily: Newsreader, Georgia, serif
    fontSize: 40px
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: -0.02em
  title:
    fontFamily: Newsreader, Georgia, serif
    fontSize: 28px
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: -0.01em
  subtitle:
    fontFamily: Newsreader, Georgia, serif
    fontSize: 20px
    fontWeight: 500
    lineHeight: 1.2
  body:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "IBM Plex Mono", ui-monospace, monospace
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.08em
  meta:
    fontFamily: "IBM Plex Mono", ui-monospace, monospace
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0.06em

rounded:
  none: 0
  sm: 2px
  md: 4px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 64px

components:
  button-primary:
    backgroundColor: "{colors.on-surface}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 12px 20px
    height: 44px
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 12px 20px
    height: 44px
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 12px 20px
    height: 44px
  chip-filter:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.meta}"
    rounded: "{rounded.sm}"
    padding: 4px 10px
  chip-filter-active:
    backgroundColor: "{colors.on-surface}"
    textColor: "{colors.surface}"
    typography: "{typography.meta}"
    rounded: "{rounded.sm}"
    padding: 4px 10px
  input-text:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: 10px 12px
    height: 44px
  list-item:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    padding: 14px 0
  card:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  checkbox:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    size: 18px
  checkbox-checked:
    backgroundColor: "{colors.on-surface}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    size: 18px
---

# RecipeScheduler Design System

## Overview

RecipeScheduler ist eine ruhige, redaktionelle Rezept-Bibliothek mit integriertem Wochenplaner und automatisch generierter Einkaufsliste — sie soll sich wie ein gut gesetztes Kochbuch oder Almanach anfühlen, nicht wie ein kühles Produktivitäts-Tool. Der primäre Anwendungsfall ist das Sonntagsritual: ~5 Rezepte für die Woche auswählen, danach mit dem Handy den Einkauf abarbeiten, unter der Woche gezielt in der Bibliothek suchen. Die emotionale Reaktion soll sein: Ruhe, Ordnung, Vertrauen — das System hält die Wochenplanung verlässlich fest und drängt sich nie auf. Zwei Anti-Patterns bestimmen das System mehr als jede positive Regel: Es darf niemals **generisch/template-haft** wirken (kein Material- oder Bootstrap-Default-Look) und niemals **kühl/steril-technisch** werden. Wärme, redaktioneller Charakter und Zurückhaltung gewinnen im Zweifel immer.

## Colors

Die Fläche ist warmes Papier — ein blush-getöntes Cream (`surface`), das dem System seinen analogen, almanachhaften Grundton gibt; `surface-raised` hebt Karten und Eingabefelder minimal ab. Text ist ein warmes Fast-Schwarz (`on-surface`), Labels und Metadaten laufen im gedämpften Taupe (`on-surface-muted`). Ein **einziger** Akzent trägt die gesamte interaktive und emphatische Bedeutung: Terracotta/Rost (`accent`) für Rating-Sterne, den aktiven Navigations-Tab, fokussierte Eingaben, den „HEUTE"-Marker im Wochenplaner und den Fortschrittsbalken der Einkaufsliste — sparsam eingesetzt, damit er Gewicht behält. Semantische Zustände sind aus der kategorischen Projekt-Palette abgeleitet, damit sie mit dem Rost harmonieren statt zu konkurrieren: `success` (Forest, auch für den abgeschlossenen Einkaufslisten-Fortschrittsbalken bei 100%), `warning` (Amber), `danger` (Brick), `info` (Navy).

Die `cat-*`-Farben codieren im RecipeScheduler zwei Rollen: **Einkaufs-Kategorien** (die 13 Supermarkt-Kategorien der Einkaufsliste: Gemüse, Obst, Fleisch & Fisch, Milchprodukte, Tiefkühl, Trocken & Backen, Konserven, Gewürze, Getränke, Brot & Backwaren, Süßigkeiten, Haushalt, Andere) und **Rezept-Tags** (jeder Tag wird per Hash einer festen cat-Farbe zugeordnet). Sie erscheinen als kleine, ruhige Farbpunkte neben Kategorieköpfen und Tag-Chips — nie als großflächige Füllung. Dunkle `cat-*`-Varianten sind abgeleitet und aufgehellt; die konkreten Werte werden im Zuge des Dark-Mode-Feinschliffs festgelegt.

Jeder Token hat eine `-dark`-Variante: Dark-Mode ist bewusst **warm** (Espresso statt kühlem Slate), Akzent und Semantik werden leicht aufgehellt, damit sie auf dunklem Grund Kontrast halten. Textkontraste erfüllen mindestens WCAG AA.

## Typography

Drei Familien bilden die Persönlichkeit: eine literarische High-Contrast-**Serif** (*Newsreader*) für Display und Titel, eine neutrale humanistische **Sans** (*Inter*) für Body, Listen und Formularwerte, und eine **Monospace** (*IBM Plex Mono*) für alle Labels und Metadaten. Das Mono-Label in Versalien mit weitem Letter-Spacing (`label`, `meta`) ist die Signatur des Systems — es rahmt jede Serif-Headline als kleines Eyebrow und trägt sämtliche Statuszeilen, Button-Aufschriften und Chip-Labels (`SPEICHERN`, `NEUES REZEPT`, `ALLE`, `HEUTE`). Die Serif-Stufen (`display`, `title`, `subtitle`) sind für Seitentitel und Rezeptnamen reserviert und nie für Fließtext. Die Sans-Stufen (`body`, `body-sm`) tragen alles Lesbare und Funktionale. Versalien werden über CSS (`text-transform: uppercase`) erzeugt, nicht über den Schriftschnitt. Anti-Pattern: Body niemals in der Serif setzen, Labels niemals in der Sans — die Rollentrennung ist die halbe Identität.

## Layout

Das System ist mobile-first gedacht — die primäre Nutzung findet auf dem iPhone statt (PWA), am Desktop wird vor allem die Wochenplanung und Rezept-Pflege genutzt. Seiten folgen einem festen Muster: Mono-Eyebrow, große Serif-Headline, rechts ausgerichtete Meta, dann der Inhalt. Container haben großzügige Außenränder; Inhalt bleibt linksbündig und textgeführt. Der Spacing-Rhythmus basiert auf 8 (`xs`–`2xl`); die Dichte ist „comfortable" — luftiger als ein Dashboard, aber kompakt genug, damit dichte Listen auf kleinen Screens nicht zerfasern.

**Navigation:** Desktop — eine sticky Top-Nav mit Serif-Wortmarke links, Navigationslinks als Mono-Label in Versalien mittig und einem Avatar-Dropdown (Theme-Toggle, Abmelden) rechts. Mobile — eine fixed Bottom-Tab-Bar mit vier Tabs (Library, Woche, Liste, Einstellungen) und `meta`-Labels in Versalien; Tap-Targets mindestens 44px.

**Rezept-Library (`/recipes`):** Karten-Grid mit Suchfeld oben, Tag-Filter als horizontale, scrollbare Chip-Leiste darunter, Sortierungsauswahl als Mono-Label-Menü. Auf Mobile einspaltiges Layout. Kein Laden von Inhalten per endlosem Scroll wenn eine einfache Paginierung ausreicht.

**Rezept-Detail (`/recipes/[id]`):** Großes Rezeptfoto optional oben, Serif-Titel, Tag-Chips mit cat-Farbpunkten, Sterne-Rating in Rost. Zutaten- und Zubereitungsliste in der Sans. Bearbeiten-Aktion führt zu `/recipes/[id]/edit`, Neu-Anlegen zu `/recipes/new`.

**Wochenplaner (`/week`):** Sieben Tages-Spalten (Montag–Sonntag) auf Desktop nebeneinander; auf Mobile vertikal gestapelt. Heutiger Tag mit Rost-„HEUTE"-Marker. Jede Spalte listet zugewiesene Rezepte als `list-item`-Einträge; Portionsangabe rechts ausgerichtet in `meta`-Typografie.

**Einkaufsliste (`/shopping`):** Zwei Tabs — aktuelle Liste und Verlauf (History). Die aktuelle Liste ist nach Supermarkt-Kategorie gruppiert; jede Gruppe hat einen Kopf mit cat-Farbpunkt und Mono-Label. Items sind abhakbar; erledigte Items werden durchgestrichen und in `on-surface-muted` gedämpft. Ein Fortschrittsbalken zeigt den Gesamtfortschritt in Rost; bei 100% wechselt er auf `success` (Forest).

**Einstellungen (`/settings`):** Haushalt-Verwaltung (Mitglieder per E-Mail einladen, Owner/Member-Rollen), Account- und Theme-Einstellungen.

## Elevation & Depth

Das System ist flach. Tiefe entsteht nicht durch Schatten, sondern durch **Haarlinien** (`border`) zwischen Listeneinträgen und durch den minimalen Helligkeitsunterschied zwischen `surface` und `surface-raised`. Das hält den papierhaften, redaktionellen Charakter und vermeidet den generischen „Karten mit Drop-Shadow"-Look. Die einzige bewusste Ausnahme sind temporäre Overlays (Select-Popover, Toast, Modale), die eine sehr weiche, niedrige Erhöhung tragen dürfen, um sich vom Hintergrund zu lösen. Im Dark-Mode ersetzt der Helligkeitssprung zwischen `surface-dark` und `surface-raised-dark` die Linie dort, wo Haarlinien zu schwach würden.

## Shapes

Die Formensprache ist scharf und ruhig: `none` und `sm` (2px) dominieren, `md` (4px) nur für Karten. Buttons, Eingabefelder, Filter-Chips und Checkboxen sind nahezu eckig — das signalisiert Präzision und redaktionellen Ernst, nicht verspielte Weichheit. `full` ist ausschließlich kreisförmigen Elementen vorbehalten: Avataren, Kategorie- und Tag-Farbpunkten, dem Aufnahme-Indikator. Keine gemischten Radien innerhalb einer Komponentenklasse — Konsistenz der Kanten ist Teil der Identität.

## Components

`button-primary` ist das warme Fast-Schwarz mit hellem Text (`SPEICHERN`, `NEUES REZEPT`), Label-Typografie in Versalien; im `button-primary-hover` wechselt die Fläche bewusst auf den Rost-Akzent — der einzige Ort, an dem Schwarz zu Farbe wird, als kleine editoriale Geste. `button-secondary` bleibt flächig auf `surface-raised` mit einer Haarlinien-Border (in Prosa, da Border kein Token-Property ist). `chip-filter` trägt Mono-Meta in Taupe; im `-active`-Zustand invertiert es zu dunkler Fläche mit heller Schrift (z. B. `ALLE`, ein aktiver Tag-Filter). `input-text` sitzt auf `surface-raised`, im Fokus erhält es eine Rost-Unterlinie statt eines Glow. `list-item` nutzt keine Karte, sondern eine untere Haarlinie und großzügiges vertikales Padding — Listen sind textgeführt, nicht umrandet. `card` ist der Container für Rezept-Karten und abgegrenzte Inhaltsbereiche mit minimalem Radius. `checkbox` ist quadratisch; `checkbox-checked` füllt sich mit `on-surface` und einem hellen Haken.

**recipe-card:** Flache Haarlinien-Karte (kein Schatten). Oben optional ein Vorschaubild. Serif-Titel (`title` oder `subtitle`). Darunter Tag-Chips (`chip-filter`) mit je einem kreisförmigen cat-Farbpunkt links im Chip. Sterne-Rating in `accent`/Rost unten links; Kochzeit oder andere Meta in `meta`-Typografie unten rechts.

**week-grid / day-column:** Wochentag als Mono-Label in Versalien als Spaltenüberschrift. Heutiger Tag erhält einen Rost-„HEUTE"-Marker (Mono-Label, `accent`-Farbe) neben dem Wochentag. Zugewiesene Rezepte werden als `list-item`-Einträge innerhalb der Spalte gelistet; Portionsangabe als `meta`-Text rechts ausgerichtet.

**shopping category-group:** Jede Supermarkt-Kategorie beginnt mit einem Gruppenheader — kreisförmiger cat-Farbpunkt (`full`) links, Kategoriename als Mono-Label in Versalien. Item-Rows darunter: quadratische Checkbox links, Zutat und Menge als `body`, erledigte Items durchgestrichen und in `on-surface-muted` gedämpft. Gesamtfortschritt als Fortschrittsbalken oben auf der Seite: Rost-Füllung bis 99%; bei 100% wechselt die Füllung auf `success` (Forest).

**rating-input:** Fünf Sterne in Rost (`accent`). Aktive Sterne gefüllt, inaktive in `on-surface-muted`. Interaktiv (klickbar/tappbar) im Formular; read-only in der Detail-Ansicht.

**nav (Desktop):** Sticky Top-Nav auf `surface` mit Haarlinien-Unterkante. Links die Serif-Wortmarke. Mittig Navigationslinks als Mono-Label in Versalien; aktiver Link in `accent`-Farbe unterstrichen oder markiert. Rechts Avatar-Button (kreisförmig, `full`) öffnet ein Dropdown mit Profil, Theme-Toggle und Abmelden. **nav (Mobile):** Fixed Bottom-Tab-Bar, vier Tabs (Library, Woche, Liste, Einstellungen) mit Icon und `meta`-Label. Aktiver Tab in `accent`/Rost; Tap-Targets mindestens 44px.

## Do's and Don'ts

**Do:** Den Rost sparsam und gezielt einsetzen — Rating-Sterne, aktiver Nav-Tab, Fokus-Unterlinie, „HEUTE"-Marker im Wochenplaner, Fortschrittsbalken der Einkaufsliste — damit er Bedeutung trägt. Jede Headline mit einem Mono-Eyebrow rahmen. Tiefe über Haarlinien und `surface-raised` erzeugen, nicht über Schatten. Die Serif für Rezeptnamen und Seitentitel, die Sans für Lesbares, die Mono für Labels und Button-Aufschriften strikt trennen. Button-Aufschriften und Chip-Labels immer als Mono-Versalien (`SPEICHERN`, `NEUES REZEPT`, `ALLE`, `HEUTE`). Dark warm halten (Espresso, nicht Slate). Tap-Targets auf Mobile mindestens 44px.

**Don't:** Niemals den generischen Material-/Bootstrap-Look zulassen (keine bunten Buttons, keine Drop-Shadow-Karten, kein Floating-Action-Button-Standard). Niemals kühl/steril werden — kein reines Grau-auf-Weiß, kein kaltes Blau als Primärfarbe. Body nie in der Serif, Labels nie in der Sans setzen. Den Akzent nicht inflationär verwenden (keine vollflächig rosten Bereiche, keinen Rost auf jedem zweiten Element). Keine gemischten Eck-Radien innerhalb einer Komponentenklasse. Keine Gamification-Konfetti oder verspielten Animationen — das System soll sich wie ein ruhiges, verlässliches Werkzeug anfühlen, nicht wie eine App mit Belohnungsschleifen.
