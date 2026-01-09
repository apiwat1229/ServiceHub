-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "user_app_permissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "actions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_app_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "user_id" TEXT NOT NULL,
    "sourceApp" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "entityId" TEXT,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "sourceApp" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "recipientRoles" JSONB NOT NULL DEFAULT '[]',
    "recipientUsers" JSONB NOT NULL DEFAULT '[]',
    "channels" JSONB NOT NULL DEFAULT '["IN_APP"]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" TEXT NOT NULL,
    "sourceApp" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" TEXT,
    "changes" JSONB,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requester_id" TEXT NOT NULL,
    "approver_id" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acted_at" TIMESTAMP(3),
    "comment" TEXT,

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_app_permissions_user_id_appName_key" ON "user_app_permissions"("user_id", "appName");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_sourceApp_actionType_key" ON "notification_settings"("sourceApp", "actionType");

-- AddForeignKey
ALTER TABLE "user_app_permissions" ADD CONSTRAINT "user_app_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
