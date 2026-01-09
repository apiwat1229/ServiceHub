-- AlterTable
ALTER TABLE "knowledge_books" ADD COLUMN     "attendees" INTEGER DEFAULT 0,
ADD COLUMN     "training_date" TIMESTAMP(3);
