ALTER TABLE "dothethang_task_groups" ADD COLUMN "hour" integer;--> statement-breakpoint
UPDATE "dothethang_task_groups" SET "hour" = 9;
ALTER TABLE "dothethang_task_groups" ALTER COLUMN "hour" SET NOT NULL;
ALTER TABLE "dothethang_task_groups" DROP COLUMN "time";