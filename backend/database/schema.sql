-- ==============================================================
-- Database Schema for Todo Application
-- Conforming to Enterprise Standards:
-- 1. Collation: utf8mb4_0900_ai_ci
-- 2. PascalCase Tables: Users, TodoStatuses, TodoItems
-- 3. snake_case Columns
-- 4. User isolation with JWT authentication
-- 5. Strict Foreign Keys & Indexes
-- 6. Soft Deletes: is_deleted TINYINT
-- ==============================================================

CREATE DATABASE IF NOT EXISTS `todo_app_db`
CHARACTER SET utf8mb4
COLLATE utf8mb4_0900_ai_ci;

USE `todo_app_db`;

-- 1. Users Table (Authentication & Multi-Tenant Isolation)
CREATE TABLE IF NOT EXISTS `Users` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Status Lookup Table
CREATE TABLE IF NOT EXISTS `TodoStatuses` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `status_code` VARCHAR(50) NOT NULL,
    `status_label` VARCHAR(100) NOT NULL,
    `color_code` VARCHAR(20) NOT NULL DEFAULT '#64748b',
    `sort_order` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_todo_statuses_code` (`status_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Main Todo Items Table
CREATE TABLE IF NOT EXISTS `TodoItems` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL DEFAULT 1,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status_id` INT NOT NULL DEFAULT 1,
    `due_date` DATE NULL,
    `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_todo_items_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `Users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_todo_items_status` 
        FOREIGN KEY (`status_id`) 
        REFERENCES `TodoStatuses` (`id`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    INDEX `idx_todo_items_user_id` (`user_id`),
    INDEX `idx_todo_items_status_id` (`status_id`),
    INDEX `idx_todo_items_is_deleted` (`is_deleted`),
    INDEX `idx_todo_items_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Seed Default Users (demo@todomaster.com / Password123!)
INSERT INTO `Users` (`id`, `name`, `email`, `password_hash`)
VALUES 
    (1, 'Demo User', 'demo@todomaster.com', '$2y$12$lPWhNOvrgepADKuMiP0RD.AbwxkMbNulgZ.xe8w8LrvC.nd6LRJDy')
ON DUPLICATE KEY UPDATE 
    `name` = VALUES(`name`);

-- 5. Seed Default Statuses
INSERT INTO `TodoStatuses` (`id`, `status_code`, `status_label`, `color_code`, `sort_order`)
VALUES 
    (1, 'pending', 'Pending', '#f59e0b', 1),
    (2, 'in_progress', 'In Progress', '#3b82f6', 2),
    (3, 'completed', 'Completed', '#10b981', 3)
ON DUPLICATE KEY UPDATE 
    `status_label` = VALUES(`status_label`),
    `color_code` = VALUES(`color_code`),
    `sort_order` = VALUES(`sort_order`);
