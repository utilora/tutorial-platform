CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "TutorialStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "TutorialType" AS ENUM ('EXTERNAL', 'ARTICLE');

CREATE TABLE "User" ("id" TEXT PRIMARY KEY, "email" TEXT NOT NULL UNIQUE, "name" TEXT, "passwordHash" TEXT NOT NULL, "role" "Role" NOT NULL DEFAULT 'USER', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "Category" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL UNIQUE, "slug" TEXT NOT NULL UNIQUE, "description" TEXT, "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "Tag" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL UNIQUE, "slug" TEXT NOT NULL UNIQUE, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "Tutorial" ("id" TEXT PRIMARY KEY, "slug" TEXT NOT NULL UNIQUE, "title" TEXT NOT NULL, "summary" VARCHAR(500) NOT NULL, "coverUrl" TEXT, "type" "TutorialType" NOT NULL DEFAULT 'EXTERNAL', "externalUrl" TEXT, "articleContent" TEXT, "isPromoted" BOOLEAN NOT NULL DEFAULT false, "promotionDisclosure" VARCHAR(300), "notice" VARCHAR(500), "status" "TutorialStatus" NOT NULL DEFAULT 'DRAFT', "featured" BOOLEAN NOT NULL DEFAULT false, "sortOrder" INTEGER NOT NULL DEFAULT 0, "publishedAt" TIMESTAMP(3), "categoryId" TEXT NOT NULL REFERENCES "Category"("id") ON DELETE RESTRICT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "TutorialTag" ("tutorialId" TEXT NOT NULL REFERENCES "Tutorial"("id") ON DELETE CASCADE, "tagId" TEXT NOT NULL REFERENCES "Tag"("id") ON DELETE CASCADE, PRIMARY KEY ("tutorialId", "tagId"));
CREATE TABLE "Favorite" ("userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "tutorialId" TEXT NOT NULL REFERENCES "Tutorial"("id") ON DELETE CASCADE, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY ("userId", "tutorialId"));
CREATE TABLE "TutorialClick" ("id" TEXT PRIMARY KEY, "tutorialId" TEXT NOT NULL REFERENCES "Tutorial"("id") ON DELETE CASCADE, "userId" TEXT, "ipHash" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "PasswordResetToken" ("id" TEXT PRIMARY KEY, "tokenHash" TEXT NOT NULL UNIQUE, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "expiresAt" TIMESTAMP(3) NOT NULL, "usedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "Tutorial_status_featured_sortOrder_idx" ON "Tutorial"("status", "featured", "sortOrder");
CREATE INDEX "Tutorial_categoryId_status_idx" ON "Tutorial"("categoryId", "status");
CREATE INDEX "Tutorial_publishedAt_idx" ON "Tutorial"("publishedAt");
CREATE INDEX "TutorialClick_tutorialId_createdAt_idx" ON "TutorialClick"("tutorialId", "createdAt");
CREATE INDEX "Favorite_tutorialId_idx" ON "Favorite"("tutorialId");
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");
