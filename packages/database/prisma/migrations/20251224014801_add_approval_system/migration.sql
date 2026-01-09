/*
  Warnings:

  - You are about to drop the column `actionType` on the `approval_requests` table. All the data in the column will be lost.
  - You are about to drop the column `changes` on the `approval_requests` table. All the data in the column will be lost.
  - You are about to drop the column `comment` on the `approval_requests` table. All the data in the column will be lost.
  - You are about to drop the column `entityId` on the `approval_requests` table. All the data in the column will be lost.
  - You are about to drop the column `sourceApp` on the `approval_requests` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employee_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `action_type` to the `approval_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entity_id` to the `approval_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entity_type` to the `approval_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `request_type` to the `approval_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source_app` to the `approval_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ApprovalStatus" ADD VALUE 'RETURNED';
ALTER TYPE "ApprovalStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "ApprovalStatus" ADD VALUE 'VOID';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'APPROVE';

-- AlterTable
ALTER TABLE "NotificationGroup" ADD COLUMN     "color" TEXT,
ADD COLUMN     "icon" TEXT;

-- AlterTable
ALTER TABLE "approval_requests" DROP COLUMN "actionType",
DROP COLUMN "changes",
DROP COLUMN "comment",
DROP COLUMN "entityId",
DROP COLUMN "sourceApp",
ADD COLUMN     "action_type" TEXT NOT NULL,
ADD COLUMN     "current_data" JSONB,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT,
ADD COLUMN     "entity_id" TEXT NOT NULL,
ADD COLUMN     "entity_type" TEXT NOT NULL,
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "proposed_data" JSONB,
ADD COLUMN     "remark" TEXT,
ADD COLUMN     "request_type" TEXT NOT NULL,
ADD COLUMN     "source_app" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "approval_request_id" TEXT,
ADD COLUMN     "approval_status" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "employee_id" TEXT,
ADD COLUMN     "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "force_change_password" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_hod" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "manager_id" TEXT,
ADD COLUMN     "permissions" JSONB DEFAULT '[]',
ADD COLUMN     "preferences" JSONB,
ADD COLUMN     "site" TEXT;

-- CreateTable
CREATE TABLE "approval_logs" (
    "id" TEXT NOT NULL,
    "approval_request_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "actor_id" TEXT NOT NULL,
    "actor_name" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL,
    "remark" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "approval_logs_approval_request_id_idx" ON "approval_logs"("approval_request_id");

-- CreateIndex
CREATE INDEX "approval_logs_actor_id_idx" ON "approval_logs"("actor_id");

-- CreateIndex
CREATE INDEX "approval_requests_status_idx" ON "approval_requests"("status");

-- CreateIndex
CREATE INDEX "approval_requests_requester_id_idx" ON "approval_requests"("requester_id");

-- CreateIndex
CREATE INDEX "approval_requests_approver_id_idx" ON "approval_requests"("approver_id");

-- CreateIndex
CREATE INDEX "approval_requests_entity_type_entity_id_idx" ON "approval_requests"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "notifications_approval_request_id_idx" ON "notifications"("approval_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_employee_id_key" ON "users"("employee_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_logs" ADD CONSTRAINT "approval_logs_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "approval_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
