# Recipe Parser Fixtures

Fixtures used by `src/lib/recipe-parser.test.ts` to validate JSON-LD parsing
against each target cooking site's structural style.

- `bbc-good-food.html` — fetched live from `https://www.bbcgoodfood.com/recipes/classic-lasagne`. Full real HTML.
- `chefkoch.html`, `einfachbacken.html`, `kitchen-stories.html`, `nyt-cooking.html` — minimal HTML files containing a real JSON-LD `Recipe` blob modeled on each site's public schema. We can't live-scrape these without a real browser session (Chefkoch serves a consent page, NYT/Kitchen Stories require login, einfachbacken CDN rejects our UA). In production the same URLs will often also fall back to `no_recipe` unless the user has a cached cookie, which is exactly the code path we test for.

Each fixture targets one structural variant the parser must handle:
- `@type: "Recipe"` at the document root (`bbc-good-food`, `chefkoch`)
- Recipe nested inside `@graph` (`einfachbacken`)
- `@type: ["Recipe", …]` array (`nyt-cooking`)
- `recipeInstructions` as array of `HowToStep` objects (`kitchen-stories`)
