import { describe, it, expect } from "vitest";
import { classifyIngredient } from "./ingredient-categorizer";

describe("classifyIngredient", () => {
  it("classifies vegetables", () => {
    expect(classifyIngredient("Zwiebel")).toBe("gemuese");
    expect(classifyIngredient("rote Zwiebel")).toBe("gemuese");
    expect(classifyIngredient("Knoblauchzehe")).toBe("gemuese");
    expect(classifyIngredient("Karotte")).toBe("gemuese");
    expect(classifyIngredient("Möhre")).toBe("gemuese");
    expect(classifyIngredient("Kartoffeln")).toBe("gemuese");
    expect(classifyIngredient("Tomaten")).toBe("gemuese");
    expect(classifyIngredient("Brokkoli")).toBe("gemuese");
    expect(classifyIngredient("Champignons")).toBe("gemuese");
  });

  it("classifies fruits", () => {
    expect(classifyIngredient("Apfel")).toBe("obst");
    expect(classifyIngredient("Zitrone")).toBe("obst");
    expect(classifyIngredient("Bio-Limette")).toBe("obst");
    expect(classifyIngredient("Erdbeeren")).toBe("obst");
  });

  it("classifies meat & fish", () => {
    expect(classifyIngredient("Hähnchenbrust")).toBe("fleisch_fisch");
    expect(classifyIngredient("Rinderhackfleisch")).toBe("fleisch_fisch");
    expect(classifyIngredient("Lachsfilet")).toBe("fleisch_fisch");
    expect(classifyIngredient("Schinken")).toBe("fleisch_fisch");
    expect(classifyIngredient("Garnelen")).toBe("fleisch_fisch");
  });

  it("classifies dairy & eggs", () => {
    expect(classifyIngredient("Milch")).toBe("milchprodukte");
    expect(classifyIngredient("Butter")).toBe("milchprodukte");
    expect(classifyIngredient("Parmesan")).toBe("milchprodukte");
    expect(classifyIngredient("griechischer Joghurt")).toBe("milchprodukte");
    expect(classifyIngredient("Eier")).toBe("milchprodukte");
  });

  it("classifies dry goods & baking", () => {
    expect(classifyIngredient("Weizenmehl")).toBe("trocken_backen");
    expect(classifyIngredient("Zucker")).toBe("trocken_backen");
    expect(classifyIngredient("Backpulver")).toBe("trocken_backen");
    expect(classifyIngredient("Spaghetti")).toBe("trocken_backen");
    expect(classifyIngredient("Basmatireis")).toBe("trocken_backen");
    expect(classifyIngredient("Haselnüsse")).toBe("trocken_backen");
  });

  it("classifies canned goods, oils, sauces", () => {
    expect(classifyIngredient("Olivenöl")).toBe("konserven");
    expect(classifyIngredient("Tomatenmark")).toBe("konserven");
    expect(classifyIngredient("Gemüsebrühe")).toBe("konserven");
    expect(classifyIngredient("Sojasauce")).toBe("konserven");
    expect(classifyIngredient("Balsamico-Essig")).toBe("konserven");
    expect(classifyIngredient("Honig")).toBe("konserven");
  });

  it("classifies spices & herbs", () => {
    expect(classifyIngredient("Salz")).toBe("gewuerze");
    expect(classifyIngredient("schwarzer Pfeffer")).toBe("gewuerze");
    expect(classifyIngredient("Paprikapulver edelsüß")).toBe("gewuerze");
    expect(classifyIngredient("Basilikum")).toBe("gewuerze");
    expect(classifyIngredient("Rosmarin")).toBe("gewuerze");
  });

  it("classifies beverages", () => {
    expect(classifyIngredient("Weißwein")).toBe("getraenke");
    expect(classifyIngredient("trockener Rotwein")).toBe("getraenke");
    expect(classifyIngredient("Mineralwasser")).toBe("getraenke");
  });

  it("classifies bread & bakery", () => {
    expect(classifyIngredient("Baguette")).toBe("brot_backwaren");
    expect(classifyIngredient("Toastbrot")).toBe("brot_backwaren");
    expect(classifyIngredient("Paniermehl")).toBe("brot_backwaren");
  });

  it("classifies frozen goods", () => {
    expect(classifyIngredient("TK-Erbsen")).toBe("tiefkuehl");
    expect(classifyIngredient("Blätterteig")).toBe("tiefkuehl");
  });

  it("falls back to andere for unknown ingredients", () => {
    expect(classifyIngredient("Spezialpulver XYZ")).toBe("andere");
    expect(classifyIngredient("")).toBe("andere");
    expect(classifyIngredient("   ")).toBe("andere");
  });
});
