-- CreateTable
CREATE TABLE "booking_lab_samples" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "sample_no" INTEGER NOT NULL,
    "is_trailer" BOOLEAN NOT NULL DEFAULT false,
    "before_press" DOUBLE PRECISION,
    "basket_weight" DOUBLE PRECISION,
    "cuplump_weight" DOUBLE PRECISION,
    "after_press" DOUBLE PRECISION,
    "percent_cp" DOUBLE PRECISION,
    "before_baking_1" DOUBLE PRECISION,
    "before_baking_2" DOUBLE PRECISION,
    "before_baking_3" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_lab_samples_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "booking_lab_samples" ADD CONSTRAINT "booking_lab_samples_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
