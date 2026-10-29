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

    echo "[1/3] Ensuring database `{$db}` exists with collation utf8mb4_0900_ai_ci...\n";
    $serverPdo->exec("CREATE DATABASE IF NOT EXISTS `{$db}` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;");

    // 2. Connect to the specific database
    $dbPdo = getDatabaseConnection();

    // 3. Read and execute schema.sql
    echo "[2/3] Reading schema.sql and creating tables...\n";
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

    echo "[3/3] Verifying created tables and lookup seeds...\n";
    $statusCount = $dbPdo->query("SELECT COUNT(id) FROM TodoStatuses")->fetchColumn();
    echo "  - Table `TodoStatuses`: OK ({$statusCount} default statuses present)\n";

    $todoCount = $dbPdo->query("SELECT COUNT(id) FROM TodoItems")->fetchColumn();
    echo "  - Table `TodoItems`: OK ({$todoCount} active items present)\n";

    echo "\n>>> Database migration completed successfully! <<<\n";
} catch (Throwable $e) {
    echo "\n[ERROR] Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}

