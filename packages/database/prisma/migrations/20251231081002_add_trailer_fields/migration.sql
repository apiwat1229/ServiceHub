-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "rubber_source" TEXT,
ADD COLUMN     "start_drain_at" TIMESTAMP(3),
ADD COLUMN     "stop_drain_at" TIMESTAMP(3),
ADD COLUMN     "trailer_rubber_source" TEXT,
ADD COLUMN     "trailer_rubber_type" TEXT,
ADD COLUMN     "trailer_weight_in" DOUBLE PRECISION,
ADD COLUMN     "trailer_weight_out" DOUBLE PRECISION,
ADD COLUMN     "weight_in" DOUBLE PRECISION,
ADD COLUMN     "weight_out" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "rubber_types" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role_id" TEXT;

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "bookings_deleted_at_idx" ON "bookings"("deleted_at");

-- CreateIndex
CREATE INDEX "rubber_types_deleted_at_idx" ON "rubber_types"("deleted_at");

-- CreateIndex
CREATE INDEX "suppliers_deleted_at_idx" ON "suppliers"("deleted_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
