CREATE TABLE "ai_shopping_optimize_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"user_id" uuid,
	"success" boolean NOT NULL,
	"tokens_used" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_shopping_optimize_usage" ADD CONSTRAINT "ai_shopping_optimize_usage_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_shopping_optimize_usage" ADD CONSTRAINT "ai_shopping_optimize_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_shopping_optimize_usage_household_created" ON "ai_shopping_optimize_usage" USING btree ("household_id","created_at" DESC NULLS LAST);