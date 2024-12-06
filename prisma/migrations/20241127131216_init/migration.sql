-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "author" TEXT NOT NULL,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "timestamp" DATETIME NOT NULL,
    "category" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Story_category_idx" ON "Story"("category");
