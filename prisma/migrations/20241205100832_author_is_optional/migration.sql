-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Story" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "author" TEXT DEFAULT 'Unknown Author',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Story" ("author", "category", "description", "id", "timestamp", "title", "url") SELECT "author", "category", "description", "id", "timestamp", "title", "url" FROM "Story";
DROP TABLE "Story";
ALTER TABLE "new_Story" RENAME TO "Story";
CREATE INDEX "Story_category_idx" ON "Story"("category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
