-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "checked_in_by" TEXT,
ADD COLUMN     "drc_actual" DOUBLE PRECISION,
ADD COLUMN     "drc_est" DOUBLE PRECISION,
ADD COLUMN     "drc_requested" DOUBLE PRECISION,
ADD COLUMN     "lot_no" TEXT,
ADD COLUMN     "moisture" DOUBLE PRECISION,
ADD COLUMN     "start_drain_by" TEXT,
ADD COLUMN     "stop_drain_by" TEXT,
ADD COLUMN     "weight_in_by" TEXT,
ADD COLUMN     "weight_out_by" TEXT;

-- CreateTable
CREATE TABLE "printer_departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "printer_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "printer_user_mappings" (
    "id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "printer_user_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "printer_usage_records" (
    "id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "user_name" TEXT NOT NULL,
    "department_id" TEXT,
    "print_bw" INTEGER NOT NULL DEFAULT 0,
    "print_color" INTEGER NOT NULL DEFAULT 0,
    "copy_bw" INTEGER NOT NULL DEFAULT 0,
    "copy_color" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "printer_usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "printer_departments_name_key" ON "printer_departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "printer_user_mappings_user_name_key" ON "printer_user_mappings"("user_name");

-- CreateIndex
CREATE UNIQUE INDEX "printer_usage_records_period_user_name_key" ON "printer_usage_records"("period", "user_name");

-- AddForeignKey
ALTER TABLE "printer_user_mappings" ADD CONSTRAINT "printer_user_mappings_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "printer_departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "printer_usage_records" ADD CONSTRAINT "printer_usage_records_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "printer_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
