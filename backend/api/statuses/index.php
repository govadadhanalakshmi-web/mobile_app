<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/api-helpers.php';

handleCorsHeaders();

try {
    $pdo = getDatabaseConnection();

    // Query lookup table with explicit columns (Rule 7: No SELECT *)
    $query = "SELECT id, status_code, status_label, color_code, sort_order 
              FROM TodoStatuses 
              ORDER BY sort_order ASC, id ASC";

    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $statuses = $stmt->fetchAll();

    sendSuccess('Statuses retrieved successfully', [
        'statuses' => $statuses
    ]);
} catch (Throwable $e) {
    handleApiException($e, 'Failed to fetch status list.');
}

