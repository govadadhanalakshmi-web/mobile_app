<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/api-helpers.php';

handleCorsHeaders();

if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'DELETE'], true)) {
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

    // Verify existence with user isolation (Soft Delete)
    $startTime = microtime(true);
    $checkStmt = $pdo->prepare("SELECT id FROM TodoItems WHERE id = :id AND user_id = :user_id AND is_deleted = 0");
    $checkStmt->execute([
        ':id'      => $id,
        ':user_id' => $userId
    ]);
    if (!$checkStmt->fetch()) {
        sendError('Todo item not found or already deleted.', 404);
    }

    // Perform soft delete
    $deleteStmt = $pdo->prepare("UPDATE TodoItems SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND user_id = :user_id");
    $deleteStmt->execute([
        ':id'      => $id,
        ':user_id' => $userId
    ]);

    logQueryPerf('TodoItems.soft_delete', (microtime(true) - $startTime) * 1000);

    sendSuccess('Todo item deleted successfully (soft delete)', [
        'id' => $id,
        'is_deleted' => 1
    ]);
} catch (Throwable $e) {
    handleApiException($e, 'Failed to delete todo item.');
}
