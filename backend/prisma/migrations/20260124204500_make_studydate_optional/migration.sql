-- AlterTable
-- Permitir que studyDate sea NULL
ALTER TABLE "Study"
ALTER COLUMN "studyDate" DROP NOT NULL;