import { describe, it, expect } from "vitest";
import {
  cleanInstagramCaption,
  cleanTikTokCaption,
  detectSocialPlatform,
  extractYouTubeDescription,
  isCaptionUsable,
  parseSocialHtml,
} from "./social-import";

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

describe("parseSocialHtml — Instagram", () => {
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

    const result = parseSocialHtml(html, "instagram");
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

    const result = parseSocialHtml(html, "instagram");
    expect(result.usableCaption).toBeNull();
    expect(result.rawImageUrl).toBe("https://scontent.cdninstagram.com/post.jpg");
  });

  it("returns nulls when no og:meta tags are present", () => {
    const html = buildHtml({});
    const result = parseSocialHtml(html, "instagram");
    expect(result.usableCaption).toBeNull();
    expect(result.rawImageUrl).toBeNull();
    expect(result.title).toBeNull();
  });
});

describe("detectSocialPlatform", () => {
  it("recognises the five supported platforms", () => {
    expect(detectSocialPlatform("https://www.instagram.com/p/abc123/")).toBe(
      "instagram",
    );
    expect(
      detectSocialPlatform("https://www.facebook.com/share/p/abc123/"),
    ).toBe("facebook");
    expect(detectSocialPlatform("https://www.tiktok.com/@user/video/123")).toBe(
      "tiktok",
    );
    expect(detectSocialPlatform("https://www.youtube.com/watch?v=abc")).toBe(
      "youtube",
    );
    expect(detectSocialPlatform("https://www.pinterest.com/pin/123/")).toBe(
      "pinterest",
    );
  });

  it("recognises short-link and regional domains", () => {
    expect(detectSocialPlatform("https://youtu.be/abc")).toBe("youtube");
    expect(detectSocialPlatform("https://fb.watch/abc/")).toBe("facebook");
    expect(detectSocialPlatform("https://vm.tiktok.com/ZAbc/")).toBe("tiktok");
    expect(detectSocialPlatform("https://pin.it/abc")).toBe("pinterest");
    expect(detectSocialPlatform("https://www.pinterest.de/pin/123/")).toBe(
      "pinterest",
    );
    expect(detectSocialPlatform("https://www.pinterest.co.uk/pin/123/")).toBe(
      "pinterest",
    );
    expect(detectSocialPlatform("https://m.youtube.com/watch?v=abc")).toBe(
      "youtube",
    );
  });

  it("returns null for ordinary recipe sites and invalid input", () => {
    expect(detectSocialPlatform("https://www.chefkoch.de/rezepte/123")).toBeNull();
    expect(detectSocialPlatform("not a url")).toBeNull();
  });

  it("does not match look-alike domains", () => {
    expect(detectSocialPlatform("https://instagram.com.evil.test/p/1")).toBeNull();
    expect(detectSocialPlatform("https://notpinterest.com/pin/1")).toBeNull();
  });
});

describe("cleanTikTokCaption", () => {
  it("strips the TikTok engagement boilerplate", () => {
    const raw =
      '12.3K Likes, 45 Comments. TikTok video from foodie (@foodie): "One-Pot-Pasta mit Tomaten und Feta".';
    expect(cleanTikTokCaption(raw)).toBe(
      "One-Pot-Pasta mit Tomaten und Feta",
    );
  });

  it("returns the trimmed input when no boilerplate matches", () => {
    expect(cleanTikTokCaption("  Nur ein Rezepttext  ")).toBe(
      "Nur ein Rezepttext",
    );
  });
});

describe("extractYouTubeDescription", () => {
  it("reads the full description out of the player payload", () => {
    const html =
      '<script>var x = {"shortDescription":"Zutaten:\\n- 500g Mehl\\n- 2 Eier\\n\\nZubereitung: alles verrühren.","other":1};</script>';
    expect(extractYouTubeDescription(html)).toBe(
      "Zutaten:\n- 500g Mehl\n- 2 Eier\n\nZubereitung: alles verrühren.",
    );
  });

  it("returns null when the payload is missing", () => {
    expect(extractYouTubeDescription("<html></html>")).toBeNull();
  });
});

describe("parseSocialHtml — other platforms", () => {
  it("prefers the YouTube player description over the truncated og:description", () => {
    const html = `<!doctype html><html><head>
      <meta property="og:title" content="Bester Pfannkuchen" />
      <meta property="og:description" content="Zutaten: 200g Mehl, 2 Eier ..." />
      <meta property="og:image" content="https://i.ytimg.com/vi/abc/hqdefault.jpg" />
      </head><body><script>{"shortDescription":"Zutaten: 200g Mehl, 2 Eier, 300ml Milch. Zubereitung: verrühren und backen."}</script></body></html>`;

    const result = parseSocialHtml(html, "youtube");
    expect(result.usableCaption).toBe(
      "Zutaten: 200g Mehl, 2 Eier, 300ml Milch. Zubereitung: verrühren und backen.",
    );
    expect(result.rawImageUrl).toBe("https://i.ytimg.com/vi/abc/hqdefault.jpg");
    expect(result.title).toBe("Bester Pfannkuchen");
  });

  it("cleans TikTok captions", () => {
    const html = `<!doctype html><html><head>
      <meta property="og:description" content="12.3K Likes, 45 Comments. TikTok video from foodie (@foodie): &quot;One-Pot-Pasta: 300g Nudeln, 400g Tomaten, 200g Feta&quot;." />
      </head><body></body></html>`;

    expect(parseSocialHtml(html, "tiktok").usableCaption).toBe(
      "One-Pot-Pasta: 300g Nudeln, 400g Tomaten, 200g Feta",
    );
  });

  it("takes the Pinterest pin description as-is", () => {
    const html = `<!doctype html><html><head>
      <meta property="og:description" content="Schneller Zitronenkuchen mit 200g Mehl und 3 Eiern" />
      </head><body></body></html>`;

    expect(parseSocialHtml(html, "pinterest").usableCaption).toBe(
      "Schneller Zitronenkuchen mit 200g Mehl und 3 Eiern",
    );
  });

  it("falls back to twitter:* meta tags", () => {
    const html = `<!doctype html><html><head>
      <meta name="twitter:description" content="Ofengemüse mit Feta: 500g Kartoffeln, 200g Feta, Olivenöl" />
      <meta name="twitter:image" content="https://cdn.test/img.jpg" />
      <meta name="twitter:title" content="Ofengemüse" />
      </head><body></body></html>`;

    const result = parseSocialHtml(html, "facebook");
    expect(result.usableCaption).toBe(
      "Ofengemüse mit Feta: 500g Kartoffeln, 200g Feta, Olivenöl",
    );
    expect(result.rawImageUrl).toBe("https://cdn.test/img.jpg");
    expect(result.title).toBe("Ofengemüse");
  });

  it("rejects login-wall boilerplate across platforms", () => {
    expect(isCaptionUsable("Log in to watch this video on TikTok")).toBe(false);
    expect(isCaptionUsable("Melde dich an, um den Beitrag zu sehen")).toBe(
      false,
    );
    expect(
      isCaptionUsable(
        "Enjoy the videos and music you love, upload original content",
      ),
    ).toBe(false);
  });
});
