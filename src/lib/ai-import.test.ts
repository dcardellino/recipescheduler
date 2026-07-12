import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockAnthropic = vi.fn();
const mockGemini = vi.fn();

vi.mock("@/lib/ai-providers/anthropic", () => ({
  extractRecipeAnthropic: mockAnthropic,
}));
vi.mock("@/lib/ai-providers/gemini", () => ({
  extractRecipeGemini: mockGemini,
}));

describe("extractRecipeFromInstagram (provider dispatcher)", () => {
  const originalProvider = process.env.AI_PROVIDER;

  beforeEach(() => {
    mockAnthropic.mockReset().mockResolvedValue({ ok: false, tokensUsed: 0 });
    mockGemini.mockReset().mockResolvedValue({ ok: false, tokensUsed: 0 });
  });

  afterEach(() => {
    process.env.AI_PROVIDER = originalProvider;
  });

  const input = {
    captionText: "...",
    sourceUrl: "https://www.instagram.com/p/abc123/",
    fallbackTitle: null,
  };

  it("defaults to Anthropic when AI_PROVIDER is unset", async () => {
    delete process.env.AI_PROVIDER;
    const { extractRecipeFromInstagram } = await import("./ai-import");

    await extractRecipeFromInstagram(input);

    expect(mockAnthropic).toHaveBeenCalledWith(input);
    expect(mockGemini).not.toHaveBeenCalled();
  });

  it("uses Anthropic when AI_PROVIDER is an unrecognized value", async () => {
    process.env.AI_PROVIDER = "openai";
    const { extractRecipeFromInstagram } = await import("./ai-import");

    await extractRecipeFromInstagram(input);

    expect(mockAnthropic).toHaveBeenCalledWith(input);
    expect(mockGemini).not.toHaveBeenCalled();
  });

  it("uses Gemini when AI_PROVIDER=gemini", async () => {
    process.env.AI_PROVIDER = "gemini";
    const { extractRecipeFromInstagram } = await import("./ai-import");

    await extractRecipeFromInstagram(input);

    expect(mockGemini).toHaveBeenCalledWith(input);
    expect(mockAnthropic).not.toHaveBeenCalled();
  });
});
