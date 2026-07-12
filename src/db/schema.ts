import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  uuid,
  unique,
  integer,
  smallint,
  doublePrecision,
  primaryKey,
  index,
  check,
  date,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// --- User profile ---
// Mirrors Supabase Auth users (auth.users). `id` equals auth.users.id (uuid).
// Sessions/identities are managed by Supabase in the `auth` schema, so no
// session/account/verification tables live here anymore. Rows are provisioned
// on first sign-in via ensureProfile() (see src/actions/profile.ts).

export const user = pgTable("user", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Application domain: households ---

export const householdRole = pgEnum("household_role", ["owner", "member"]);

export const household = pgTable("household", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdBy: uuid("created_by").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const householdMember = pgTable(
  "household_member",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: householdRole("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (t) => [unique("household_member_unique").on(t.householdId, t.userId)],
);

// --- Relations ---

export const userRelations = relations(user, ({ many }) => ({
  memberships: many(householdMember),
}));

export const householdRelations = relations(household, ({ many, one }) => ({
  members: many(householdMember),
  creator: one(user, {
    fields: [household.createdBy],
    references: [user.id],
  }),
  recipes: many(recipe),
  tags: many(tag),
}));

export const householdMemberRelations = relations(
  householdMember,
  ({ one }) => ({
    household: one(household, {
      fields: [householdMember.householdId],
      references: [household.id],
    }),
    user: one(user, {
      fields: [householdMember.userId],
      references: [user.id],
    }),
  }),
);

// --- Application domain: recipes ---

export const ingredientCategory = pgEnum("ingredient_category", [
  "gemuese",
  "obst",
  "fleisch_fisch",
  "milchprodukte",
  "tiefkuehl",
  "trocken_backen",
  "konserven",
  "gewuerze",
  "getraenke",
  "brot_backwaren",
  "suessigkeiten",
  "haushalt",
  "andere",
]);

export const recipe = pgTable(
  "recipe",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    sourceUrl: text("source_url"),
    imageUrl: text("image_url"),
    servings: integer("servings").notNull().default(2),
    prepMinutes: integer("prep_minutes"),
    cookMinutes: integer("cook_minutes"),
    rating: smallint("rating"),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_recipe_household_created").on(t.householdId, t.createdAt.desc()),
    index("idx_recipe_household_title").on(t.householdId, t.title),
    check(
      "recipe_rating_check",
      sql`${t.rating} IS NULL OR (${t.rating} BETWEEN 1 AND 5)`,
    ),
    check("recipe_servings_check", sql`${t.servings} >= 1`),
  ],
);

export const recipeComponent = pgTable("recipe_component", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeId: uuid("recipe_id").notNull().references(() => recipe.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
}, (t) => [
  index("recipe_component_recipe_id_idx").on(t.recipeId),
]);

export const recipeIngredient = pgTable("recipe_ingredient", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipe.id, { onDelete: "cascade" }),
  componentId: uuid("component_id").references(() => recipeComponent.id, { onDelete: "set null" }),
  position: integer("position").notNull().default(0),
  quantity: doublePrecision("quantity"),
  unit: text("unit"),
  name: text("name").notNull(),
  note: text("note"),
  category: ingredientCategory("category").notNull().default("andere"),
});

export const recipeStep = pgTable("recipe_step", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipe.id, { onDelete: "cascade" }),
  componentId: uuid("component_id").references(() => recipeComponent.id, { onDelete: "set null" }),
  position: integer("position").notNull().default(0),
  text: text("text").notNull(),
});

export const tag = pgTable(
  "tag",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique("tag_household_name_unique").on(t.householdId, t.name)],
);

export const recipeTag = pgTable(
  "recipe_tag",
  {
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipe.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.recipeId, t.tagId] })],
);

export const recipeRelations = relations(recipe, ({ one, many }) => ({
  household: one(household, {
    fields: [recipe.householdId],
    references: [household.id],
  }),
  creator: one(user, {
    fields: [recipe.createdBy],
    references: [user.id],
  }),
  components: many(recipeComponent),
  ingredients: many(recipeIngredient),
  steps: many(recipeStep),
  tags: many(recipeTag),
}));

export const recipeComponentRelations = relations(recipeComponent, ({ one, many }) => ({
  recipe: one(recipe, { fields: [recipeComponent.recipeId], references: [recipe.id] }),
  ingredients: many(recipeIngredient),
  steps: many(recipeStep),
}));

export const recipeIngredientRelations = relations(
  recipeIngredient,
  ({ one }) => ({
    recipe: one(recipe, {
      fields: [recipeIngredient.recipeId],
      references: [recipe.id],
    }),
    component: one(recipeComponent, {
      fields: [recipeIngredient.componentId],
      references: [recipeComponent.id],
    }),
  }),
);

export const recipeStepRelations = relations(recipeStep, ({ one }) => ({
  recipe: one(recipe, {
    fields: [recipeStep.recipeId],
    references: [recipe.id],
  }),
  component: one(recipeComponent, {
    fields: [recipeStep.componentId],
    references: [recipeComponent.id],
  }),
}));

export const tagRelations = relations(tag, ({ one, many }) => ({
  household: one(household, {
    fields: [tag.householdId],
    references: [household.id],
  }),
  recipes: many(recipeTag),
}));

export const recipeTagRelations = relations(recipeTag, ({ one }) => ({
  recipe: one(recipe, {
    fields: [recipeTag.recipeId],
    references: [recipe.id],
  }),
  tag: one(tag, {
    fields: [recipeTag.tagId],
    references: [tag.id],
  }),
}));

// --- Application domain: meal planning & shopping lists ---

export const mealType = pgEnum("meal_type", [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);

export const mealPlanEntry = pgTable(
  "meal_plan_entry",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    recipeId: uuid("recipe_id").references(() => recipe.id, {
      onDelete: "set null",
    }),
    date: date("date").notNull(),
    mealType: mealType("meal_type").notNull().default("dinner"),
    servings: integer("servings").notNull().default(2),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_meal_plan_household_date").on(t.householdId, t.date),
    check("meal_plan_servings_check", sql`${t.servings} >= 1`),
  ],
);

export const shoppingList = pgTable(
  "shopping_list",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    weekStartDate: date("week_start_date").notNull(),
    name: text("name"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("shopping_list_household_week_unique").on(
      t.householdId,
      t.weekStartDate,
    ),
    index("idx_shopping_list_household_week").on(
      t.householdId,
      t.weekStartDate.desc(),
    ),
  ],
);

export const shoppingListItem = pgTable(
  "shopping_list_item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shoppingListId: uuid("shopping_list_id")
      .notNull()
      .references(() => shoppingList.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    quantity: doublePrecision("quantity"),
    unit: text("unit"),
    category: ingredientCategory("category").notNull().default("andere"),
    checked: boolean("checked").notNull().default(false),
    customAdded: boolean("custom_added").notNull().default(false),
    sourceRecipeIds: uuid("source_recipe_ids").array().notNull().default(sql`'{}'::uuid[]`),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    index("idx_shopping_list_item_list_position").on(
      t.shoppingListId,
      t.position,
    ),
  ],
);

export const mealPlanEntryRelations = relations(mealPlanEntry, ({ one }) => ({
  household: one(household, {
    fields: [mealPlanEntry.householdId],
    references: [household.id],
  }),
  recipe: one(recipe, {
    fields: [mealPlanEntry.recipeId],
    references: [recipe.id],
  }),
}));

export const shoppingListRelations = relations(
  shoppingList,
  ({ one, many }) => ({
    household: one(household, {
      fields: [shoppingList.householdId],
      references: [household.id],
    }),
    items: many(shoppingListItem),
  }),
);

export const shoppingListItemRelations = relations(
  shoppingListItem,
  ({ one }) => ({
    shoppingList: one(shoppingList, {
      fields: [shoppingListItem.shoppingListId],
      references: [shoppingList.id],
    }),
  }),
);

// --- Application domain: AI import usage tracking ---
// One row per Instagram AI-import attempt, used to enforce a per-household
// monthly cap on paid Claude API calls (see src/lib/ai-usage.ts).

export const aiImportUsage = pgTable(
  "ai_import_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    success: boolean("success").notNull(),
    tokensUsed: integer("tokens_used"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_ai_import_usage_household_created").on(
      t.householdId,
      t.createdAt.desc(),
    ),
  ],
);

export const aiImportUsageRelations = relations(aiImportUsage, ({ one }) => ({
  household: one(household, {
    fields: [aiImportUsage.householdId],
    references: [household.id],
  }),
  user: one(user, {
    fields: [aiImportUsage.userId],
    references: [user.id],
  }),
}));

// --- Inferred types ---

export type User = typeof user.$inferSelect;
export type Household = typeof household.$inferSelect;
export type HouseholdMember = typeof householdMember.$inferSelect;
export type HouseholdRole = (typeof householdRole.enumValues)[number];
export type Recipe = typeof recipe.$inferSelect;
export type NewRecipe = typeof recipe.$inferInsert;
export type RecipeComponent = typeof recipeComponent.$inferSelect;
export type NewRecipeComponent = typeof recipeComponent.$inferInsert;
export type RecipeIngredient = typeof recipeIngredient.$inferSelect;
export type RecipeStep = typeof recipeStep.$inferSelect;
export type Tag = typeof tag.$inferSelect;
export type RecipeTag = typeof recipeTag.$inferSelect;
export type IngredientCategory = (typeof ingredientCategory.enumValues)[number];
export type MealType = (typeof mealType.enumValues)[number];
export type MealPlanEntry = typeof mealPlanEntry.$inferSelect;
export type NewMealPlanEntry = typeof mealPlanEntry.$inferInsert;
export type ShoppingList = typeof shoppingList.$inferSelect;
export type ShoppingListItem = typeof shoppingListItem.$inferSelect;
export type NewShoppingListItem = typeof shoppingListItem.$inferInsert;
export type AiImportUsage = typeof aiImportUsage.$inferSelect;
export type NewAiImportUsage = typeof aiImportUsage.$inferInsert;
