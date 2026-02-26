-- Migrate any LOST books to ARCHIVED
UPDATE "books" SET status = 'ARCHIVED', "archivedAt" = COALESCE("archivedAt", NOW()) WHERE status = 'LOST';

-- Remove LOST from BookStatus enum (Postgres: create new type, switch column, drop old)
CREATE TYPE "BookStatus_new" AS ENUM ('AVAILABLE', 'CHECKED_OUT', 'ARCHIVED');
ALTER TABLE "books" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "books" ALTER COLUMN "status" TYPE "BookStatus_new" USING (status::text::"BookStatus_new");
ALTER TABLE "books" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE'::"BookStatus_new";
DROP TYPE "BookStatus";
ALTER TYPE "BookStatus_new" RENAME TO "BookStatus";
