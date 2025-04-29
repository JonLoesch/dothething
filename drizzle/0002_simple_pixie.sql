ALTER TABLE "dothethang_task_groups" ADD COLUMN "time" varchar;
ALTER TABLE "dothethang_task_groups" ADD COLUMN "zone" varchar;

UPDATE "dothethang_task_groups" SET "time" = '09:00:00', "zone"='America/New_York';

ALTER TABLE "dothethang_task_groups" ALTER COLUMN "time" SET NOT NULL;
ALTER TABLE "dothethang_task_groups" ALTER COLUMN "zone" SET NOT NULL;