-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'REQUEST', 'APPROVE');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'RETURNED', 'EXPIRED', 'VOID');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff_1',
    "first_name" TEXT,
    "last_name" TEXT,
    "display_name" TEXT,
    "avatar" TEXT,
    "permissions" JSONB DEFAULT '[]',
    "department" TEXT,
    "position" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "pin_code" TEXT,
    "employee_id" TEXT,
    "site" TEXT,
    "is_hod" BOOLEAN NOT NULL DEFAULT false,
    "hod_id" TEXT,
    "manager_id" TEXT,
    "role_id" TEXT,
    "force_change_password" BOOLEAN NOT NULL DEFAULT false,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_login_at" TIMESTAMP(3),
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

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
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
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
    "is_active" BOOLEAN NOT NULL DEFAULT true,
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
    "contact_person" TEXT,
    "certificate_number" TEXT,
    "certificate_expire" TIMESTAMP(3),
    "score" DOUBLE PRECISION DEFAULT 0,
    "eudr_quota_used" DOUBLE PRECISION,
    "eudr_quota_current" DOUBLE PRECISION,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

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
    "lot_no" TEXT,
    "estimated_weight" DOUBLE PRECISION,
    "moisture" DOUBLE PRECISION,
    "drc_est" DOUBLE PRECISION,
    "drc_requested" DOUBLE PRECISION,
    "drc_actual" DOUBLE PRECISION,
    "recorder" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "checkin_at" TIMESTAMP(3),
    "checked_in_by" TEXT,
    "start_drain_at" TIMESTAMP(3),
    "start_drain_by" TEXT,
    "stop_drain_at" TIMESTAMP(3),
    "stop_drain_by" TEXT,
    "drain_note" TEXT,
    "weight_in" DOUBLE PRECISION,
    "weight_in_by" TEXT,
    "weight_out" DOUBLE PRECISION,
    "weight_out_by" TEXT,
    "rubber_source" TEXT,
    "trailer_weight_in" DOUBLE PRECISION,
    "trailer_weight_out" DOUBLE PRECISION,
    "trailer_rubber_type" TEXT,
    "trailer_rubber_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

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
    "approval_request_id" TEXT,
    "approval_status" TEXT,
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
    "recipientGroups" JSONB NOT NULL DEFAULT '[]',
    "recipientUsers" JSONB NOT NULL DEFAULT '[]',
    "channels" JSONB NOT NULL DEFAULT '["IN_APP"]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" TEXT NOT NULL,
    "request_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "source_app" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "current_data" JSONB,
    "proposed_data" JSONB,
    "reason" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requester_id" TEXT NOT NULL,
    "approver_id" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "remark" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "NotificationGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationGroup_pkey" PRIMARY KEY ("id")
);

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
    "serial_no" TEXT NOT NULL DEFAULT 'unknown',
    "print_bw" INTEGER NOT NULL DEFAULT 0,
    "print_color" INTEGER NOT NULL DEFAULT 0,
    "copy_bw" INTEGER NOT NULL DEFAULT 0,
    "copy_color" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "printer_usage_records_pkey" PRIMARY KEY ("id")
);

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
    "training_date" TIMESTAMP(3),
    "attendees" INTEGER DEFAULT 0,
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

-- CreateTable
CREATE TABLE "it_assets" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 2,
    "location" TEXT,
    "description" TEXT,
    "image" TEXT,
    "price" DOUBLE PRECISION DEFAULT 0,
    "received_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiver" TEXT,
    "serial_number" TEXT,
    "barcode" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "it_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "it_tickets" (
    "id" TEXT NOT NULL,
    "ticket_no" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "requester_id" TEXT NOT NULL,
    "assignee_id" TEXT,
    "is_asset_request" BOOLEAN NOT NULL DEFAULT false,
    "asset_id" TEXT,
    "quantity" INTEGER DEFAULT 0,
    "expected_date" TIMESTAMP(3),
    "approver_id" TEXT,
    "issued_at" TIMESTAMP(3),
    "issued_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "it_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_NotificationGroupMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_employee_id_key" ON "users"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_app_permissions_user_id_appName_key" ON "user_app_permissions"("user_id", "appName");

-- CreateIndex
CREATE INDEX "posts_authorId_idx" ON "posts"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_code_key" ON "provinces"("code");

-- CreateIndex
CREATE UNIQUE INDEX "districts_code_key" ON "districts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subdistricts_code_key" ON "subdistricts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "rubber_types_code_key" ON "rubber_types"("code");

-- CreateIndex
CREATE INDEX "rubber_types_deleted_at_idx" ON "rubber_types"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE INDEX "suppliers_deleted_at_idx" ON "suppliers"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_code_key" ON "bookings"("booking_code");

-- CreateIndex
CREATE INDEX "bookings_date_slot_idx" ON "bookings"("date", "slot");

-- CreateIndex
CREATE INDEX "bookings_booking_code_idx" ON "bookings"("booking_code");

-- CreateIndex
CREATE INDEX "bookings_deleted_at_idx" ON "bookings"("deleted_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_approval_request_id_idx" ON "notifications"("approval_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_sourceApp_actionType_key" ON "notification_settings"("sourceApp", "actionType");

-- CreateIndex
CREATE INDEX "approval_requests_status_idx" ON "approval_requests"("status");

-- CreateIndex
CREATE INDEX "approval_requests_requester_id_idx" ON "approval_requests"("requester_id");

-- CreateIndex
CREATE INDEX "approval_requests_approver_id_idx" ON "approval_requests"("approver_id");

-- CreateIndex
CREATE INDEX "approval_requests_entity_type_entity_id_idx" ON "approval_requests"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "approval_logs_approval_request_id_idx" ON "approval_logs"("approval_request_id");

-- CreateIndex
CREATE INDEX "approval_logs_actor_id_idx" ON "approval_logs"("actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationGroup_name_key" ON "NotificationGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "printer_departments_name_key" ON "printer_departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "printer_user_mappings_user_name_key" ON "printer_user_mappings"("user_name");

-- CreateIndex
CREATE UNIQUE INDEX "printer_usage_records_period_user_name_serial_no_key" ON "printer_usage_records"("period", "user_name", "serial_no");

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

-- CreateIndex
CREATE UNIQUE INDEX "it_assets_code_key" ON "it_assets"("code");

-- CreateIndex
CREATE UNIQUE INDEX "it_tickets_ticket_no_key" ON "it_tickets"("ticket_no");

-- CreateIndex
CREATE INDEX "it_tickets_requester_id_idx" ON "it_tickets"("requester_id");

-- CreateIndex
CREATE INDEX "it_tickets_assignee_id_idx" ON "it_tickets"("assignee_id");

-- CreateIndex
CREATE INDEX "it_tickets_status_idx" ON "it_tickets"("status");

-- CreateIndex
CREATE INDEX "it_tickets_asset_id_idx" ON "it_tickets"("asset_id");

-- CreateIndex
CREATE INDEX "ticket_comments_ticket_id_idx" ON "ticket_comments"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_comments_user_id_idx" ON "ticket_comments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "_NotificationGroupMembers_AB_unique" ON "_NotificationGroupMembers"("A", "B");

-- CreateIndex
CREATE INDEX "_NotificationGroupMembers_B_index" ON "_NotificationGroupMembers"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_hod_id_fkey" FOREIGN KEY ("hod_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_app_permissions" ADD CONSTRAINT "user_app_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "booking_lab_samples" ADD CONSTRAINT "booking_lab_samples_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_logs" ADD CONSTRAINT "approval_logs_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "approval_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "printer_user_mappings" ADD CONSTRAINT "printer_user_mappings_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "printer_departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "printer_usage_records" ADD CONSTRAINT "printer_usage_records_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "printer_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_books" ADD CONSTRAINT "knowledge_books_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_views" ADD CONSTRAINT "book_views_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "knowledge_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_views" ADD CONSTRAINT "book_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "it_tickets" ADD CONSTRAINT "it_tickets_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "it_tickets" ADD CONSTRAINT "it_tickets_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "it_tickets" ADD CONSTRAINT "it_tickets_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "it_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "it_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NotificationGroupMembers" ADD CONSTRAINT "_NotificationGroupMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "NotificationGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NotificationGroupMembers" ADD CONSTRAINT "_NotificationGroupMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
