CREATE TABLE "cookbook" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cookbook_household_name_unique" UNIQUE("household_id","name")
);
--> statement-breakpoint
CREATE TABLE "cookbook_recipe" (
	"cookbook_id" uuid NOT NULL,
	"recipe_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cookbook_recipe_cookbook_id_recipe_id_pk" PRIMARY KEY("cookbook_id","recipe_id")
);
--> statement-breakpoint
ALTER TABLE "cookbook" ADD CONSTRAINT "cookbook_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbook" ADD CONSTRAINT "cookbook_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbook_recipe" ADD CONSTRAINT "cookbook_recipe_cookbook_id_cookbook_id_fk" FOREIGN KEY ("cookbook_id") REFERENCES "public"."cookbook"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cookbook_recipe" ADD CONSTRAINT "cookbook_recipe_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cookbook_household_name" ON "cookbook" USING btree ("household_id","name");--> statement-breakpoint
CREATE INDEX "idx_cookbook_recipe_recipe" ON "cookbook_recipe" USING btree ("recipe_id");