-- CreateEnum
CREATE TYPE "StudyRequestStatus" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED', 'CONVERTED');
-- CreateTable
CREATE TABLE "StudyRequest" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER,
    "dni" VARCHAR(18) NOT NULL,
    "requestedDate" TIMESTAMP(3) NOT NULL,
    "doctorName" VARCHAR(255) NOT NULL,
    "insuranceName" VARCHAR(255) NOT NULL,
    "medicalOrderPhotoUrl" VARCHAR(500),
    "observations" TEXT,
    "status" "StudyRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),
    "validatedByUserId" INTEGER,
    "convertedStudyId" INTEGER,
    CONSTRAINT "StudyRequest_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "StudyRequest_dni_idx" ON "StudyRequest"("dni");
-- CreateIndex
CREATE INDEX "StudyRequest_status_idx" ON "StudyRequest"("status");
-- CreateIndex
CREATE INDEX "StudyRequest_patientId_idx" ON "StudyRequest"("patientId");
-- CreateIndex
CREATE INDEX "StudyRequest_validatedByUserId_idx" ON "StudyRequest"("validatedByUserId");
-- CreateIndex
CREATE INDEX "StudyRequest_convertedStudyId_idx" ON "StudyRequest"("convertedStudyId");
-- AddForeignKey
ALTER TABLE "StudyRequest"
ADD CONSTRAINT "StudyRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "StudyRequest"
ADD CONSTRAINT "StudyRequest_validatedByUserId_fkey" FOREIGN KEY ("validatedByUserId") REFERENCES "User"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "StudyRequest"
ADD CONSTRAINT "StudyRequest_convertedStudyId_fkey" FOREIGN KEY ("convertedStudyId") REFERENCES "Study"("id") ON DELETE
SET NULL ON UPDATE CASCADE;