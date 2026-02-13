-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "openedAt" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Doc" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "bidder" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "scanned" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "uploadedAt" TEXT NOT NULL,
    "storagePath" TEXT,
    "createdAt" TEXT NOT NULL,
    CONSTRAINT "Doc_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "parseProgress" INTEGER NOT NULL,
    "llmProgress" INTEGER NOT NULL,
    "reportProgress" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "startedAt" TEXT,
    "finishedAt" TEXT,
    "error" TEXT,
    CONSTRAINT "Job_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pair" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "docA" TEXT NOT NULL,
    "docB" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "Pair_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Hit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "aDocId" TEXT NOT NULL,
    "bDocId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "rewriteRisk" TEXT NOT NULL,
    "ruleHits" JSONB NOT NULL,
    "sectionType" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "aBidder" TEXT NOT NULL,
    "aPage" INTEGER NOT NULL,
    "aSnippet" TEXT NOT NULL,
    "bBidder" TEXT NOT NULL,
    "bPage" INTEGER NOT NULL,
    "bSnippet" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    CONSTRAINT "Hit_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Hit_aDocId_fkey" FOREIGN KEY ("aDocId") REFERENCES "Doc" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Hit_bDocId_fkey" FOREIGN KEY ("bDocId") REFERENCES "Doc" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Anchor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hitId" TEXT NOT NULL,
    "aPage" INTEGER NOT NULL,
    "bPage" INTEGER NOT NULL,
    "aBboxList" JSONB NOT NULL,
    "bBboxList" JSONB NOT NULL,
    "aSnippet" TEXT NOT NULL,
    "bSnippet" TEXT NOT NULL,
    CONSTRAINT "Anchor_hitId_fkey" FOREIGN KEY ("hitId") REFERENCES "Hit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HitReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hitId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "remark" TEXT,
    "reviewedAt" TEXT NOT NULL,
    CONSTRAINT "HitReview_hitId_fkey" FOREIGN KEY ("hitId") REFERENCES "Hit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "qps" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "baseUrl" TEXT,
    "apiKeyEncrypted" TEXT,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "content" TEXT,
    "updatedAt" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "threshold" REAL NOT NULL,
    "level" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "latency" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "InvokeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT,
    "providerId" TEXT,
    "stage" TEXT NOT NULL,
    "requestMetaJson" JSONB,
    "responseMetaJson" JSONB,
    "tokens" INTEGER,
    "latencyMs" INTEGER,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "HitReview_hitId_key" ON "HitReview"("hitId");
