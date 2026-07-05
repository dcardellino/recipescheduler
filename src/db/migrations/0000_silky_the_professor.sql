CREATE TYPE "public"."household_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "public"."ingredient_category" AS ENUM('gemuese', 'obst', 'fleisch_fisch', 'milchprodukte', 'tiefkuehl', 'trocken_backen', 'konserven', 'gewuerze', 'getraenke', 'brot_backwaren', 'suessigkeiten', 'haushalt', 'andere');--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack');--> statement-breakpoint
CREATE TABLE "household" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "household_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "household_member_unique" UNIQUE("household_id","user_id")
);
--> statement-breakpoint
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
CREATE TABLE "recipe" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"source_url" text,
	"image_url" text,
	"servings" integer DEFAULT 2 NOT NULL,
	"prep_minutes" integer,
	"cook_minutes" integer,
	"rating" smallint,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_rating_check" CHECK ("recipe"."rating" IS NULL OR ("recipe"."rating" BETWEEN 1 AND 5)),
	CONSTRAINT "recipe_servings_check" CHECK ("recipe"."servings" >= 1)
);
--> statement-breakpoint
CREATE TABLE "recipe_component" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"component_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"quantity" double precision,
	"unit" text,
	"name" text NOT NULL,
	"note" text,
	"category" "ingredient_category" DEFAULT 'andere' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_step" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"component_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_tag" (
	"recipe_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "recipe_tag_recipe_id_tag_id_pk" PRIMARY KEY("recipe_id","tag_id")
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
CREATE TABLE "tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tag_household_name_unique" UNIQUE("household_id","name")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "household" ADD CONSTRAINT "household_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_member" ADD CONSTRAINT "household_member_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_member" ADD CONSTRAINT "household_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plan_entry" ADD CONSTRAINT "meal_plan_entry_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plan_entry" ADD CONSTRAINT "meal_plan_entry_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_component" ADD CONSTRAINT "recipe_component_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredient" ADD CONSTRAINT "recipe_ingredient_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredient" ADD CONSTRAINT "recipe_ingredient_component_id_recipe_component_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."recipe_component"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_step" ADD CONSTRAINT "recipe_step_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_step" ADD CONSTRAINT "recipe_step_component_id_recipe_component_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."recipe_component"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_tag" ADD CONSTRAINT "recipe_tag_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_tag" ADD CONSTRAINT "recipe_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list" ADD CONSTRAINT "shopping_list_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_item" ADD CONSTRAINT "shopping_list_item_shopping_list_id_shopping_list_id_fk" FOREIGN KEY ("shopping_list_id") REFERENCES "public"."shopping_list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_meal_plan_household_date" ON "meal_plan_entry" USING btree ("household_id","date");--> statement-breakpoint
CREATE INDEX "idx_recipe_household_created" ON "recipe" USING btree ("household_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_recipe_household_title" ON "recipe" USING btree ("household_id","title");--> statement-breakpoint
CREATE INDEX "recipe_component_recipe_id_idx" ON "recipe_component" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "idx_shopping_list_household_week" ON "shopping_list" USING btree ("household_id","week_start_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_shopping_list_item_list_position" ON "shopping_list_item" USING btree ("shopping_list_id","position");