CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack');--> statement-breakpoint
CREATE TABLE "meal_plan_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"recipe_id" uuid,
	"date" date NOT NULL,
	"meal_type" "meal_type" DEFAULT 'dinner' NOT NULL,
	"servings" integer DEFAULT 2 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meal_plan_servings_check" CHECK ("meal_plan_entry"."servings" >= 1)
);
--> statement-breakpoint
CREATE TABLE "shopping_list" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"week_start_date" date NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shopping_list_household_week_unique" UNIQUE("household_id","week_start_date")
);
--> statement-breakpoint
CREATE TABLE "shopping_list_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shopping_list_id" uuid NOT NULL,
	"name" text NOT NULL,
	"quantity" double precision,
	"unit" text,
	"category" "ingredient_category" DEFAULT 'andere' NOT NULL,
	"checked" boolean DEFAULT false NOT NULL,
	"custom_added" boolean DEFAULT false NOT NULL,
	"source_recipe_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meal_plan_entry" ADD CONSTRAINT "meal_plan_entry_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plan_entry" ADD CONSTRAINT "meal_plan_entry_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list" ADD CONSTRAINT "shopping_list_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_item" ADD CONSTRAINT "shopping_list_item_shopping_list_id_shopping_list_id_fk" FOREIGN KEY ("shopping_list_id") REFERENCES "public"."shopping_list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_meal_plan_household_date" ON "meal_plan_entry" USING btree ("household_id","date");--> statement-breakpoint
CREATE INDEX "idx_shopping_list_household_week" ON "shopping_list" USING btree ("household_id","week_start_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_shopping_list_item_list_position" ON "shopping_list_item" USING btree ("shopping_list_id","position");