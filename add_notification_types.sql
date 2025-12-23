-- Migration: Add REQUEST and APPROVE to NotificationType enum
-- Run this SQL in your PostgreSQL database

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REQUEST';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'APPROVE';
