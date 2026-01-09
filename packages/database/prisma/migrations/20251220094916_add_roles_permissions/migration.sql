/*
  Warnings:

  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "name",
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "display_name" TEXT,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "hod_id" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "pin_code" TEXT,
ADD COLUMN     "position" TEXT,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "username" TEXT,
DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'staff_1';

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "provinces" (
    "id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name_th" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name_th" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "province_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subdistricts" (
    "id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name_th" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "zip_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "district_id" INTEGER NOT NULL,

    CONSTRAINT "subdistricts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubber_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rubber_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "tax_id" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "province_id" INTEGER,
    "district_id" INTEGER,
    "subdistrict_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "rubber_type_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "title" TEXT,
    "avatar" TEXT,
    "zip_code" TEXT,
    "certificate_number" TEXT,
    "certificate_expire" TIMESTAMP(3),
    "score" DOUBLE PRECISION DEFAULT 0,
    "eudr_quota_used" DOUBLE PRECISION,
    "eudr_quota_current" DOUBLE PRECISION,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "queue_no" INTEGER NOT NULL,
    "booking_code" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "slot" TEXT,
    "supplier_id" TEXT NOT NULL,
    "supplier_code" TEXT NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "truck_type" TEXT,
    "truck_register" TEXT,
    "rubber_type" TEXT NOT NULL,
    "recorder" TEXT NOT NULL,
    "checkin_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB,
    "color" TEXT,
    "icon" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "provinces_code_key" ON "provinces"("code");

-- CreateIndex
CREATE UNIQUE INDEX "districts_code_key" ON "districts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subdistricts_code_key" ON "subdistricts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "rubber_types_code_key" ON "rubber_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_code_key" ON "bookings"("booking_code");

-- CreateIndex
CREATE INDEX "bookings_date_slot_idx" ON "bookings"("date", "slot");

-- CreateIndex
CREATE INDEX "bookings_booking_code_idx" ON "bookings"("booking_code");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_hod_id_fkey" FOREIGN KEY ("hod_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subdistricts" ADD CONSTRAINT "subdistricts_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_subdistrict_id_fkey" FOREIGN KEY ("subdistrict_id") REFERENCES "subdistricts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
