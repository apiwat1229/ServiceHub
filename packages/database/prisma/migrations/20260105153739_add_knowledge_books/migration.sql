-- CreateTable
CREATE TABLE "knowledge_books" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "cover_image" TEXT,
    "author" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_views" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_books_category_idx" ON "knowledge_books"("category");

-- CreateIndex
CREATE INDEX "knowledge_books_uploaded_by_idx" ON "knowledge_books"("uploaded_by");

-- CreateIndex
CREATE INDEX "knowledge_books_is_published_idx" ON "knowledge_books"("is_published");

-- CreateIndex
CREATE INDEX "book_views_book_id_idx" ON "book_views"("book_id");

-- CreateIndex
CREATE INDEX "book_views_user_id_idx" ON "book_views"("user_id");

-- AddForeignKey
ALTER TABLE "knowledge_books" ADD CONSTRAINT "knowledge_books_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_views" ADD CONSTRAINT "book_views_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "knowledge_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_views" ADD CONSTRAINT "book_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
