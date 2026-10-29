<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/api-helpers.php';

handleCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed. Only POST is accepted.', 405);
}

try {
    $pdo = getDatabaseConnection();
    $payload = getJsonPayload();

    $title = isset($payload['title']) ? trim((string)$payload['title']) : '';
    $description = isset($payload['description']) ? trim((string)$payload['description']) : null;
    $statusId = isset($payload['status_id']) ? (int)$payload['status_id'] : 1;
    $dueDate = !empty($payload['due_date']) ? trim((string)$payload['due_date']) : null;

    // Validation
    if ($title === '') {
        sendError('Validation failed: Title is required and cannot be empty.', 422);
    }

    if (mb_strlen($title) > 255) {
        sendError('Validation failed: Title exceeds 255 characters limit.', 422);
    }

    // Verify status_id exists in lookup table (Rule 7: Lookup table integrity)
    $statusCheckStmt = $pdo->prepare("SELECT id FROM TodoStatuses WHERE id = :status_id");
    $statusCheckStmt->execute([':status_id' => $statusId]);
    if (!$statusCheckStmt->fetch()) {
        sendError('Validation failed: Invalid status_id provided.', 422);
    }

    // Validate due_date format (YYYY-MM-DD) if provided
    if ($dueDate !== null) {
        $d = DateTime::createFromFormat('Y-m-d', $dueDate);
        if (!$d || $d->format('Y-m-d') !== $dueDate) {
            sendError('Validation failed: due_date must be in YYYY-MM-DD format.', 422);
        }
    }

    // Prepared statement insert (Rule 8: Enterprise Security)
    $insertSql = "INSERT INTO TodoItems (title, description, status_id, due_date, is_deleted, created_at, updated_at) 
                  VALUES (:title, :description, :status_id, :due_date, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
    
    $insertStmt = $pdo->prepare($insertSql);
    $insertStmt->execute([
        ':title'       => $title,
        ':description' => $description,
        ':status_id'   => $statusId,
        ':due_date'    => $dueDate
    ]);

    $newId = (int)$pdo->lastInsertId();

    // Fetch newly created record with explicit columns and JOIN
    $fetchSql = "SELECT 
                    t.id,
                    t.title,
                    t.description,
                    t.status_id,
                    s.status_code,
                    s.status_label,
                    s.color_code,
                    t.due_date,
                    t.created_at,
                    t.updated_at
                 FROM TodoItems t
                 INNER JOIN TodoStatuses s ON t.status_id = s.id
                 WHERE t.id = :id";
    $fetchStmt = $pdo->prepare($fetchSql);
    $fetchStmt->execute([':id' => $newId]);
    $newTodo = $fetchStmt->fetch();

    sendSuccess('Todo created successfully', [
        'todo' => $newTodo
    ], 201);
} catch (Throwable $e) {
    handleApiException($e, 'Failed to create todo item.');
}

