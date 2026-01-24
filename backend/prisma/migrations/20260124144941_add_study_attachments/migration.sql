-- CreateTable
CREATE TABLE "StudyAttachment" (
    "id" SERIAL NOT NULL,
    "studyId" INTEGER NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "filename" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyAttachment_studyId_idx" ON "StudyAttachment"("studyId");

-- AddForeignKey
ALTER TABLE "StudyAttachment" ADD CONSTRAINT "StudyAttachment_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE CASCADE ON UPDATE CASCADE;
