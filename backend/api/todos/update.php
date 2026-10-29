<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/api-helpers.php';

handleCorsHeaders();

if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'], true)) {
    sendError('Method not allowed.', 405);
}

try {
    $pdo = getDatabaseConnection();
    $user = authenticateUser($pdo);
    $userId = (int)$user['id'];

    $payload = getJsonPayload();

    $id = isset($payload['id']) ? (int)$payload['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);
    if ($id <= 0) {
        sendError('Validation failed: A valid todo id is required.', 422);
    }

    // Check if todo exists, belongs to user, and is not soft-deleted
    $checkStmt = $pdo->prepare("SELECT id, status_id FROM TodoItems WHERE id = :id AND user_id = :user_id AND is_deleted = 0");
    $checkStmt->execute([
        ':id'      => $id,
        ':user_id' => $userId
    ]);
    $existing = $checkStmt->fetch();
    if (!$existing) {
        sendError('Todo item not found or has been deleted.', 404);
    }

    $updates = [];
    $params = [
        ':id'      => $id,
        ':user_id' => $userId
    ];

    if (isset($payload['title'])) {
        $title = trim((string)$payload['title']);
        if ($title === '') {
            sendError('Validation failed: Title cannot be empty.', 422);
        }
        if (mb_strlen($title) > 255) {
            sendError('Validation failed: Title exceeds 255 characters limit.', 422);
        }
        $updates[] = 'title = :title';
        $params[':title'] = $title;
    }

    if (array_key_exists('description', $payload)) {
        $updates[] = 'description = :description';
        $params[':description'] = $payload['description'] !== null ? trim((string)$payload['description']) : null;
    }

    if (isset($payload['status_id'])) {
        $statusId = (int)$payload['status_id'];
        $statusCheck = $pdo->prepare("SELECT id FROM TodoStatuses WHERE id = :status_id");
        $statusCheck->execute([':status_id' => $statusId]);
        if (!$statusCheck->fetch()) {
            sendError('Validation failed: Invalid status_id provided.', 422);
        }
        $updates[] = 'status_id = :status_id';
        $params[':status_id'] = $statusId;
    }

    if (array_key_exists('due_date', $payload)) {
        $dueDate = !empty($payload['due_date']) ? trim((string)$payload['due_date']) : null;
        if ($dueDate !== null) {
            $d = DateTime::createFromFormat('Y-m-d', $dueDate);
            if (!$d || $d->format('Y-m-d') !== $dueDate) {
                sendError('Validation failed: due_date must be in YYYY-MM-DD format.', 422);
            }
        }
        $updates[] = 'due_date = :due_date';
        $params[':due_date'] = $dueDate;
    }

    if (empty($updates)) {
        sendError('No fields provided to update.', 400);
    }

    $startTime = microtime(true);
    $updates[] = 'updated_at = CURRENT_TIMESTAMP';
    $updateSql = "UPDATE TodoItems SET " . implode(', ', $updates) . " WHERE id = :id AND user_id = :user_id AND is_deleted = 0";
    $updateStmt = $pdo->prepare($updateSql);
    $updateStmt->execute($params);

    // Fetch updated record with JOIN
    $fetchSql = "SELECT 
                    t.id,
                    t.user_id,
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
                 WHERE t.id = :id AND t.user_id = :user_id";
    $fetchStmt = $pdo->prepare($fetchSql);
    $fetchStmt->execute([
        ':id'      => $id,
        ':user_id' => $userId
    ]);
    $updatedTodo = $fetchStmt->fetch();

    logQueryPerf('TodoItems.update', (microtime(true) - $startTime) * 1000);

    sendSuccess('Todo updated successfully', [
        'todo' => $updatedTodo
    ]);
} catch (Throwable $e) {
    handleApiException($e, 'Failed to update todo item.');
}
