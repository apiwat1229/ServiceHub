-- Truncate tables before restore to avoid conflicts
TRUNCATE TABLE 
    "NotificationGroup",
    "_NotificationGroupMembers",
    "approval_logs",
    "approval_requests",
    "booking_lab_samples",
    "bookings",
    "districts",
    "notification_settings",
    "notifications",
    "posts",
    "printer_departments",
    "printer_usage_records",
    "printer_user_mappings",
    "provinces",
    "roles",
    "rubber_types",
    "subdistricts",
    "suppliers",
    "user_app_permissions",
    "users"
CASCADE;
