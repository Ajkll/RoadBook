/*
  Warnings:

  - You are about to drop the column `lastExportDate` on the `RoadBook` table. All the data in the column will be lost.
  - You are about to drop the column `lastSignatureDate` on the `RoadBook` table. All the data in the column will be lost.
  - You are about to drop the column `officialDocumentUrl` on the `RoadBook` table. All the data in the column will be lost.
  - You are about to drop the `Badge` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Competency` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CompetencyProgress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CompetencyValidation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Like` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MarketplaceListing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Purchase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserBadge` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_postId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "CompetencyProgress" DROP CONSTRAINT "CompetencyProgress_apprenticeId_fkey";

-- DropForeignKey
ALTER TABLE "CompetencyProgress" DROP CONSTRAINT "CompetencyProgress_competencyId_fkey";

-- DropForeignKey
ALTER TABLE "CompetencyProgress" DROP CONSTRAINT "CompetencyProgress_roadbookId_fkey";

-- DropForeignKey
ALTER TABLE "CompetencyValidation" DROP CONSTRAINT "CompetencyValidation_competencyId_fkey";

-- DropForeignKey
ALTER TABLE "CompetencyValidation" DROP CONSTRAINT "CompetencyValidation_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "CompetencyValidation" DROP CONSTRAINT "CompetencyValidation_validatorId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_postId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_userId_fkey";

-- DropForeignKey
ALTER TABLE "MarketplaceListing" DROP CONSTRAINT "MarketplaceListing_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_buyerId_fkey";

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_listingId_fkey";

-- DropForeignKey
ALTER TABLE "UserBadge" DROP CONSTRAINT "UserBadge_badgeId_fkey";

-- DropForeignKey
ALTER TABLE "UserBadge" DROP CONSTRAINT "UserBadge_userId_fkey";

-- AlterTable
ALTER TABLE "RoadBook" DROP COLUMN "lastExportDate",
DROP COLUMN "lastSignatureDate",
DROP COLUMN "officialDocumentUrl";

-- DropTable
DROP TABLE "Badge";

-- DropTable
DROP TABLE "Comment";

-- DropTable
DROP TABLE "Competency";

-- DropTable
DROP TABLE "CompetencyProgress";

-- DropTable
DROP TABLE "CompetencyValidation";

-- DropTable
DROP TABLE "Like";

-- DropTable
DROP TABLE "MarketplaceListing";

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "Purchase";

-- DropTable
DROP TABLE "UserBadge";

-- DropEnum
DROP TYPE "CompetencyCategory";

-- DropEnum
DROP TYPE "CompetencyStatus";

-- DropEnum
DROP TYPE "LearningPhase";

-- DropEnum
DROP TYPE "ListingStatus";

-- DropEnum
DROP TYPE "ListingType";

-- DropEnum
DROP TYPE "NotificationType";
