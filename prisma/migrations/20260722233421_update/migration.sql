/*
  Warnings:

  - You are about to drop the column `contentHash` on the `Version` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[chapterId,versionNumber]` on the table `Version` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Chapter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Outline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chainHash` to the `Version` table without a default value. This is not possible if the table is not empty.
  - Added the required column `versionNumber` to the `Version` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Outline" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Version" DROP COLUMN "contentHash",
ADD COLUMN     "chainHash" TEXT NOT NULL,
ADD COLUMN     "versionNumber" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Version_chapterId_versionNumber_key" ON "Version"("chapterId", "versionNumber");
