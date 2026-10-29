<?php
declare(strict_types=1);

/**
 * Register User API Endpoint
 * POST /api/auth/register.php
 * Payload: {"name": "...", "email": "...", "password": "..."}
 */

require_once __DIR__ . '/../../helpers/api-helpers.php';
require_once __DIR__ . '/../../config/database.php';

handleCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method Not Allowed. Use POST.', 405);
}

try {
    $payload = getJsonPayload();

    $name = trim((string)($payload['name'] ?? ''));
    $email = strtolower(trim((string)($payload['email'] ?? '')));
    $password = (string)($payload['password'] ?? '');

    // 1. Validation
    if ($name === '' || strlen($name) > 100) {
        sendError('Please provide a valid name (maximum 100 characters).', 422);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 191) {
        sendError('Please provide a valid email address.', 422);
    }

    if (strlen($password) < 6) {
        sendError('Password must be at least 6 characters.', 422);
    }

    $pdo = getDatabaseConnection();

    // 2. Duplicate Email Check
    $stmtCheck = $pdo->prepare('SELECT id FROM Users WHERE email = :email LIMIT 1');
    $stmtCheck->execute(['email' => $email]);
    if ($stmtCheck->fetch()) {
        sendError('This email is already registered. Please log in.', 409);
    }

    // 3. Bcrypt Password Hashing (Cost 12)
    $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

    // 4. Insert User
    $stmtInsert = $pdo->prepare('
        INSERT INTO Users (name, email, password_hash)
        VALUES (:name, :email, :password_hash)
    ');
    $stmtInsert->execute([
        'name'          => $name,
        'email'         => $email,
        'password_hash' => $passwordHash,
    ]);

    $userId = (int)$pdo->lastInsertId();

    // 5. Generate JWT Token
    $token = JwtHelper::generate([
        'sub'   => $userId,
        'email' => $email,
        'name'  => $name,
    ], getJwtSecret(), 604800); // 7 days

    sendSuccess('Registration successful', [
        'token' => $token,
        'user'  => [
            'id'    => $userId,
            'name'  => $name,
            'email' => $email,
        ],
    ], 201);
} catch (Throwable $e) {
    handleApiException($e, 'Unable to register user at this time.');
}

