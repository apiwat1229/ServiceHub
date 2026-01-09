-- AlterTable
ALTER TABLE "notification_settings" ADD COLUMN     "recipientGroups" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "NotificationGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_NotificationGroupMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationGroup_name_key" ON "NotificationGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_NotificationGroupMembers_AB_unique" ON "_NotificationGroupMembers"("A", "B");

-- CreateIndex
CREATE INDEX "_NotificationGroupMembers_B_index" ON "_NotificationGroupMembers"("B");

-- AddForeignKey
ALTER TABLE "_NotificationGroupMembers" ADD CONSTRAINT "_NotificationGroupMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "NotificationGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NotificationGroupMembers" ADD CONSTRAINT "_NotificationGroupMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
