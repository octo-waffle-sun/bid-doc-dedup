-- CreateTable
CREATE TABLE "JobDoc" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    CONSTRAINT "JobDoc_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobDoc_docId_fkey" FOREIGN KEY ("docId") REFERENCES "Doc" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "JobDoc_jobId_docId_key" ON "JobDoc"("jobId", "docId");
