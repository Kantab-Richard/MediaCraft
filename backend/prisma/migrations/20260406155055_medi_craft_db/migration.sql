/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `apiKeyId` on the `Download` table. All the data in the column will be lost.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Download" DROP CONSTRAINT "Download_apiKeyId_fkey";

-- DropIndex
DROP INDEX "ApiKey_key_idx";

-- DropIndex
DROP INDEX "ApiKey_userId_idx";

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "updatedAt",
ALTER COLUMN "name" SET DEFAULT 'Default Key';

-- AlterTable
ALTER TABLE "Download" DROP COLUMN "apiKeyId",
ALTER COLUMN "downloader" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL;
