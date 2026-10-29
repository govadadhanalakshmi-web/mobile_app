<?php
declare(strict_types=1);

/**
 * Login User API Endpoint
 * POST /api/auth/login.php
 * Payload: {"email": "...", "password": "..."}
 */

require_once __DIR__ . '/../../helpers/api-helpers.php';
require_once __DIR__ . '/../../config/database.php';

handleCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method Not Allowed. Use POST.', 405);
}

try {
    $payload = getJsonPayload();

    $email = strtolower(trim((string)($payload['email'] ?? '')));
    $password = (string)($payload['password'] ?? '');

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendError('Please provide a valid email address.', 422);
    }

    if ($password === '') {
        sendError('Please enter your password.', 422);
    }

    $pdo = getDatabaseConnection();

    // Query user by email
    $startTime = microtime(true);
    $stmt = $pdo->prepare('SELECT id, name, email, password_hash FROM Users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();
    logQueryPerf('Users.find_by_email', (microtime(true) - $startTime) * 1000);

    if (!$user || !password_verify($password, (string)$user['password_hash'])) {
        sendError('Invalid email or password.', 401);
    }

    $userId = (int)$user['id'];

    // Generate JWT Token
    $token = JwtHelper::generate([
        'sub'   => $userId,
        'email' => $user['email'],
        'name'  => $user['name'],
    ], getJwtSecret(), 604800); // 7 days

    sendSuccess('Login successful', [
        'token' => $token,
        'user'  => [
            'id'    => $userId,
            'name'  => $user['name'],
            'email' => $user['email'],
        ],
    ]);
} catch (Throwable $e) {
    handleApiException($e, 'Unable to authenticate at this time.');
}

