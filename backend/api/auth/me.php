<?php
declare(strict_types=1);

/**
 * Get Authenticated User Profile API Endpoint
 * GET /api/auth/me.php
 * Headers: Authorization: Bearer <jwt>
 */

require_once __DIR__ . '/../../helpers/api-helpers.php';
require_once __DIR__ . '/../../config/database.php';

handleCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method Not Allowed. Use GET.', 405);
}

try {
    $pdo = getDatabaseConnection();
    $user = authenticateUser($pdo);

    sendSuccess('User profile retrieved successfully', [
        'user' => [
            'id'    => (int)$user['id'],
            'name'  => $user['name'],
            'email' => $user['email'],
        ],
    ]);
} catch (Throwable $e) {
    handleApiException($e, 'Unable to retrieve user profile.');
}

