CREATE TABLE "recipe_component" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipe_ingredient" ADD COLUMN "component_id" uuid;--> statement-breakpoint
ALTER TABLE "recipe_step" ADD COLUMN "component_id" uuid;--> statement-breakpoint
ALTER TABLE "recipe_component" ADD CONSTRAINT "recipe_component_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recipe_component_recipe_id_idx" ON "recipe_component" USING btree ("recipe_id");--> statement-breakpoint
ALTER TABLE "recipe_ingredient" ADD CONSTRAINT "recipe_ingredient_component_id_recipe_component_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."recipe_component"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_step" ADD CONSTRAINT "recipe_step_component_id_recipe_component_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."recipe_component"("id") ON DELETE set null ON UPDATE no action;