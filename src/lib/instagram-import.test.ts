import { describe, it, expect } from "vitest";
import {
  cleanInstagramCaption,
  isCaptionUsable,
  parseInstagramHtml,
} from "./instagram-import";

describe("cleanInstagramCaption", () => {
  it("strips the 'on Instagram:' boilerplate prefix", () => {
    const raw =
      '105 Likes, 12 Comments - foodblog (@foodblog) on Instagram: "Creamy Garlic Pasta 🍝 Zutaten: 500g Spaghetti, 2 EL Olivenöl"';
    expect(cleanInstagramCaption(raw)).toBe(
      "Creamy Garlic Pasta 🍝 Zutaten: 500g Spaghetti, 2 EL Olivenöl",
    );
  });

  it("strips the date-based boilerplate prefix when 'Instagram' isn't mentioned", () => {
    const raw = '105 likes, 12 comments - foodblog on January 5, 2024: "Ofenkartoffeln mit Kräuterquark"';
    expect(cleanInstagramCaption(raw)).toBe("Ofenkartoffeln mit Kräuterquark");
  });

  it("returns the trimmed input unchanged when no known prefix matches", () => {
    const raw = "  Einfach nur ein Rezept ohne Boilerplate  ";
    expect(cleanInstagramCaption(raw)).toBe("Einfach nur ein Rezept ohne Boilerplate");
  });

  it("handles captions containing nested quotes", () => {
    const raw = 'foodblog on Instagram: "Mama\'s "beste" Lasagne - so geht\'s"';
    expect(cleanInstagramCaption(raw)).toBe('Mama\'s "beste" Lasagne - so geht\'s');
  });
});

describe("isCaptionUsable", () => {
  it("rejects very short captions", () => {
    expect(isCaptionUsable("Lecker!")).toBe(false);
  });

  it("rejects known Instagram login-wall boilerplate", () => {
    expect(isCaptionUsable("Instagram")).toBe(false);
    expect(isCaptionUsable("See this post on Instagram")).toBe(false);
    expect(isCaptionUsable("Log in to see this post")).toBe(false);
  });

  it("accepts a plausible recipe caption", () => {
    expect(
      isCaptionUsable(
        "Creamy Garlic Pasta – Zutaten: 500g Spaghetti, 2 EL Olivenöl, 2 Knoblauchzehen. Zubereitung: Pasta kochen...",
      ),
    ).toBe(true);
  });
});

describe("parseInstagramHtml", () => {
  function escapeAttr(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }

  function buildHtml(opts: {
    description?: string;
    image?: string;
    title?: string;
  }): string {
    const meta: string[] = [];
    if (opts.description) {
      meta.push(
        `<meta property="og:description" content="${escapeAttr(opts.description)}" />`,
      );
    }
    if (opts.image) {
      meta.push(`<meta property="og:image" content="${escapeAttr(opts.image)}" />`);
    }
    if (opts.title) {
      meta.push(`<meta property="og:title" content="${escapeAttr(opts.title)}" />`);
    }
    return `<!doctype html><html><head>${meta.join("\n")}</head><body></body></html>`;
  }

  it("extracts a usable caption, image and title from og:meta tags", () => {
    const html = buildHtml({
      description:
        '105 Likes, 12 Comments - foodblog on Instagram: "Creamy Garlic Pasta – Zutaten: 500g Spaghetti, 2 EL Olivenöl"',
      image: "https://scontent.cdninstagram.com/post.jpg",
      title: "foodblog on Instagram",
    });

    const result = parseInstagramHtml(html);
    expect(result.usableCaption).toBe(
      "Creamy Garlic Pasta – Zutaten: 500g Spaghetti, 2 EL Olivenöl",
    );
    expect(result.rawImageUrl).toBe("https://scontent.cdninstagram.com/post.jpg");
    expect(result.title).toBe("foodblog on Instagram");
  });

  it("treats a login-wall description as not usable, but keeps the image", () => {
    const html = buildHtml({
      description: "Instagram",
      image: "https://scontent.cdninstagram.com/post.jpg",
    });

    const result = parseInstagramHtml(html);
    expect(result.usableCaption).toBeNull();
    expect(result.rawImageUrl).toBe("https://scontent.cdninstagram.com/post.jpg");
  });

  it("returns nulls when no og:meta tags are present", () => {
    const html = buildHtml({});
    const result = parseInstagramHtml(html);
    expect(result.usableCaption).toBeNull();
    expect(result.rawImageUrl).toBeNull();
    expect(result.title).toBeNull();
  });
});
