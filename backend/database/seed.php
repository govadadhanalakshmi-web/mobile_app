<?php
declare(strict_types=1);

/**
 * Database Seeder for Todo Items
 * Usage: php backend/database/seed.php
 */

require_once __DIR__ . '/../config/database.php';

echo "========================================\n";
echo "Seeding Sample Data for Todo App\n";
echo "========================================\n";

try {
    $pdo = getDatabaseConnection();

    // Check existing count
    $stmt = $pdo->query("SELECT COUNT(id) FROM TodoItems WHERE is_deleted = 0");
    $existingCount = (int)$stmt->fetchColumn();

    if ($existingCount > 0) {
        echo "Found {$existingCount} existing todo items. Skipping seed to prevent duplication.\n";
        exit(0);
    }

    $sampleTodos = [
        [
            'title' => 'Design MySQL Database Schema',
            'description' => 'Create PascalCase tables TodoStatuses and TodoItems with utf8mb4_0900_ai_ci collation and strict indexes.',
            'status_id' => 3, // completed
            'due_date' => date('Y-m-d', strtotime('-1 day'))
        ],
        [
            'title' => 'Build PHP 8 PDO REST API',
            'description' => 'Implement endpoints with prepared statements, input sanitization, and {"status": "success|error"} response contract.',
            'status_id' => 3, // completed
            'due_date' => date('Y-m-d')
        ],
        [
            'title' => 'Develop React Native Glassmorphic UI',
            'description' => 'Build responsive Header, StatusFilterBar, TodoCard (React.memo), and TodoModal for task management.',
            'status_id' => 2, // in_progress
            'due_date' => date('Y-m-d', strtotime('+2 days'))
        ],
        [
            'title' => 'Setup CI/CD Pipeline & Firebase App Distribution',
            'description' => 'Automate Jest and PHPUnit testing, EAS APK build, and deployment to Firebase testers.',
            'status_id' => 1, // pending
            'due_date' => date('Y-m-d', strtotime('+5 days'))
        ],
        [
            'title' => 'Perform Maestro E2E Cloud Testing on BrowserStack',
            'description' => 'Run automated user flow tests across 10+ real Android devices on BrowserStack cloud farm.',
            'status_id' => 1, // pending
            'due_date' => date('Y-m-d', strtotime('+7 days'))
        ]
    ];

    $insertSql = "INSERT INTO TodoItems (title, description, status_id, due_date, is_deleted, created_at, updated_at) 
                  VALUES (:title, :description, :status_id, :due_date, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
    $insertStmt = $pdo->prepare($insertSql);

    foreach ($sampleTodos as $todo) {
        $insertStmt->execute($todo);
        echo "  + Inserted task: {$todo['title']}\n";
    }

    echo "\n>>> Database seeding completed successfully! <<<\n";
} catch (Throwable $e) {
    echo "\n[ERROR] Seeding failed: " . $e->getMessage() . "\n";
    exit(1);
}

