/*
  Warnings:

  - You are about to drop the `_BlogToTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `tags` on the `Blog` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Template` table. All the data in the column will be lost.
  - Added the required column `tag` to the `Blog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tag` to the `Template` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_BlogToTemplate_B_index";

-- DropIndex
DROP INDEX "_BlogToTemplate_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_BlogToTemplate";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Report" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contentId" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_BlogTemplates" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_BlogTemplates_A_fkey" FOREIGN KEY ("A") REFERENCES "Blog" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_BlogTemplates_B_fkey" FOREIGN KEY ("B") REFERENCES "Template" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Blog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "authorId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "upvotes" INTEGER NOT NULL,
    "downvotes" INTEGER NOT NULL,
    CONSTRAINT "Blog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Blog" ("authorId", "createdAt", "description", "downvotes", "flagged", "id", "title", "upvotes") SELECT "authorId", "createdAt", "description", "downvotes", "flagged", "id", "title", "upvotes" FROM "Blog";
DROP TABLE "Blog";
ALTER TABLE "new_Blog" RENAME TO "Blog";
CREATE TABLE "new_Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "blogId" INTEGER NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentId" INTEGER,
    "upvotes" INTEGER NOT NULL,
    "downvotes" INTEGER NOT NULL,
    CONSTRAINT "Comment_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("authorId", "blogId", "createdAt", "description", "downvotes", "flagged", "id", "parentId", "upvotes") SELECT "authorId", "blogId", "createdAt", "description", "downvotes", "flagged", "id", "parentId", "upvotes" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE TABLE "new_Template" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ownerId" INTEGER NOT NULL,
    "forkedFromId" INTEGER,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Template_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Template_forkedFromId_fkey" FOREIGN KEY ("forkedFromId") REFERENCES "Template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Template" ("code", "createdAt", "explanation", "forkedFromId", "id", "language", "ownerId", "title", "updatedAt") SELECT "code", "createdAt", "explanation", "forkedFromId", "id", "language", "ownerId", "title", "updatedAt" FROM "Template";
DROP TABLE "Template";
ALTER TABLE "new_Template" RENAME TO "Template";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_BlogTemplates_AB_unique" ON "_BlogTemplates"("A", "B");

-- CreateIndex
CREATE INDEX "_BlogTemplates_B_index" ON "_BlogTemplates"("B");
