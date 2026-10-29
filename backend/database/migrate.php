<?php
declare(strict_types=1);

/**
 * CLI Database Migration Runner
 * Usage: php backend/database/migrate.php
 */

require_once __DIR__ . '/../config/database.php';

echo "========================================\n";
echo "Starting Database Migration (Todo App)\n";
echo "========================================\n";

$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$db   = getenv('DB_NAME') ?: 'todo_app_db';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';

try {
    // 1. Connect to MySQL server instance
    $serverDsn = "mysql:host={$host};port={$port};charset=utf8mb4";
    $serverPdo = new PDO($serverDsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    echo "[1/4] Ensuring database `{$db}` exists with collation utf8mb4_0900_ai_ci...\n";
    $serverPdo->exec("CREATE DATABASE IF NOT EXISTS `{$db}` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;");

    // 2. Connect to the specific database
    $dbPdo = getDatabaseConnection();

    // 3. Read and execute schema.sql
    echo "[2/4] Reading schema.sql and ensuring tables...\n";
    $schemaFile = __DIR__ . '/schema.sql';
    if (!file_exists($schemaFile)) {
        throw new RuntimeException("Schema file not found at: {$schemaFile}");
    }

    $sql = file_get_contents($schemaFile);
    // Split statements safely
    $statements = array_filter(array_map('trim', explode(';', $sql)));

    foreach ($statements as $stmt) {
        if (!empty($stmt)) {
            $dbPdo->exec($stmt);
        }
    }

    // 4. Ensure user_id column exists on TodoItems if upgraded from older schema
    echo "[3/4] Checking and applying incremental schema migrations...\n";
    $checkCol = $dbPdo->query("SHOW COLUMNS FROM `TodoItems` LIKE 'user_id'")->fetch();
    if (!$checkCol) {
        echo "  - Adding `user_id` column and foreign key to `TodoItems`...\n";
        $dbPdo->exec("ALTER TABLE `TodoItems` ADD COLUMN `user_id` INT NOT NULL DEFAULT 1 AFTER `id`");
        $dbPdo->exec("ALTER TABLE `TodoItems` ADD CONSTRAINT `fk_todo_items_user` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE");
        $dbPdo->exec("ALTER TABLE `TodoItems` ADD INDEX `idx_todo_items_user_id` (`user_id`)");
    } else {
        echo "  - Column `TodoItems.user_id`: OK\n";
    }

    echo "[4/4] Verifying created tables and lookup seeds...\n";
    $userCount = $dbPdo->query("SELECT COUNT(id) FROM Users")->fetchColumn();
    echo "  - Table `Users`: OK ({$userCount} registered users)\n";

    $statusCount = $dbPdo->query("SELECT COUNT(id) FROM TodoStatuses")->fetchColumn();
    echo "  - Table `TodoStatuses`: OK ({$statusCount} default statuses present)\n";

    $todoCount = $dbPdo->query("SELECT COUNT(id) FROM TodoItems")->fetchColumn();
    echo "  - Table `TodoItems`: OK ({$todoCount} active items present)\n";

    echo "\n>>> Database migration completed successfully! <<<\n";
} catch (Throwable $e) {
    echo "\n[ERROR] Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
