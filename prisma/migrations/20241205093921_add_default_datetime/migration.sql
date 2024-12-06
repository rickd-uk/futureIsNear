/*
  Warnings:

  - You are about to drop the column `comments` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `Story` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Story" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Story" ("author", "category", "id", "timestamp", "title", "url") SELECT "author", "category", "id", "timestamp", "title", "url" FROM "Story";
DROP TABLE "Story";
ALTER TABLE "new_Story" RENAME TO "Story";
CREATE INDEX "Story_category_idx" ON "Story"("category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
