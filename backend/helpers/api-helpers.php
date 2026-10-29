<?php
declare(strict_types=1);

/**
 * Centralized API Helpers & Response Service
 * Strictly enforces:
 * 1. JSON Schema: {"status": "success|error", "message": "...", "data": {}}
 * 2. Centralized error handling and logging (no die() or raw stack traces)
 * 3. Mobile CORS compatibility
 * 4. Input sanitization against XSS
 * 5. JWT Authentication & multi-tenant user scoping
 * 6. Query performance telemetry logging
 */

require_once __DIR__ . '/jwt-helper.php';
require_once __DIR__ . '/../config/database.php';

if (!function_exists('getallheaders')) {
    function getallheaders(): array
    {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (str_starts_with($name, 'HTTP_')) {
                $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$headerName] = $value;
            }
        }
        return $headers;
    }
}

// Enable CORS and JSON headers
function handleCorsHeaders(): void
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Idempotency-Key');
    header('Content-Type: application/json; charset=UTF-8');

    // Handle preflight request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit(0);
    }
}

/**
 * Standard JSON Success Response
 *
 * @param string $message
 * @param array|object $data
 * @param int $httpCode
 * @return void
 */
function sendSuccess(string $message, array|object $data = [], int $httpCode = 200): void
{
    http_response_code($httpCode);
    echo json_encode([
        'status'  => 'success',
        'message' => $message,
        'data'    => (object)$data
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit(0);
}

/**
 * Standard JSON Error Response
 *
 * @param string $message
 * @param int $httpCode
 * @param array|object $data
 * @return void
 */
function sendError(string $message, int $httpCode = 400, array|object $data = []): void
{
    http_response_code($httpCode);
    echo json_encode([
        'status'  => 'error',
        'message' => $message,
        'data'    => (object)$data
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit(0);
}

/**
 * Centralized Exception & Error Logger
 *
 * @param Throwable $e
 * @param string $userFriendlyMessage
 * @return void
 */
function handleApiException(Throwable $e, string $userFriendlyMessage = 'An unexpected server error occurred.'): void
{
    $logDir = dirname(__DIR__) . '/logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0777, true);
    }

    $logEntry = sprintf(
        "[%s] %s in %s:%d\nStack Trace:\n%s\n-----------------------------------\n",
        date('Y-m-d H:i:s'),
        $e->getMessage(),
        $e->getFile(),
        $e->getLine(),
        $e->getTraceAsString()
    );

    @file_put_contents($logDir . '/error.log', $logEntry, FILE_APPEND);

    $isDebug = (getenv('APP_DEBUG') === 'true' || getenv('APP_DEBUG') === '1');
    $errorData = $isDebug ? [
        'debug_error' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ] : [];

    sendError($userFriendlyMessage, 500, $errorData);
}

/**
 * Get and Sanitize JSON Request Payload
 *
 * @return array
 */
function getJsonPayload(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return [];
    }

    return sanitizeRecursive($data);
}

/**
 * Sanitize string inputs recursively
 *
 * @param mixed $input
 * @return mixed
 */
function sanitizeRecursive(mixed $input): mixed
{
    if (is_array($input)) {
        $sanitized = [];
        foreach ($input as $key => $val) {
            $sanitizedKey = htmlspecialchars(trim((string)$key), ENT_QUOTES, 'UTF-8');
            $sanitized[$sanitizedKey] = sanitizeRecursive($val);
        }
        return $sanitized;
    }

    if (is_string($input)) {
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }

    return $input;
}

/**
 * Get JWT Secret from Environment
 */
function getJwtSecret(): string
{
    return getenv('JWT_SECRET') ?: 'super_secure_enterprise_jwt_secret_todomaster_2026_xyz';
}

/**
 * Authenticate incoming request via Authorization: Bearer <token>
 * Returns authenticated user record: ['id' => int, 'name' => string, 'email' => string]
 *
 * @param PDO $pdo
 * @return array
 */
function authenticateUser(PDO $pdo): array
{
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (empty($authHeader) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (empty($authHeader) && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }

    if (!preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        sendError('Unauthorized: Missing or invalid Authorization Bearer header', 401);
    }

    $token = $matches[1];
    try {
        $payload = JwtHelper::verify($token, getJwtSecret());
        $userId = (int)($payload['sub'] ?? 0);
        if ($userId <= 0) {
            sendError('Unauthorized: Invalid token claims', 401);
        }

        $stmt = $pdo->prepare('SELECT id, name, email FROM Users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch();

        if (!$user) {
            sendError('Unauthorized: User account does not exist', 401);
        }

        return $user;
    } catch (Throwable $e) {
        sendError('Unauthorized: ' . $e->getMessage(), 401);
    }
}

/**
 * Log Query Latency Telemetry (Tenet 4)
 *
 * @param string $queryName
 * @param float $elapsedMs
 */
function logQueryPerf(string $queryName, float $elapsedMs): void
{
    $logDir = dirname(__DIR__) . '/logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0777, true);
    }
    $logEntry = sprintf(
        "[%s] Query: %s | Execution: %.3f ms\n",
        date('Y-m-d H:i:s'),
        $queryName,
        $elapsedMs
    );
    @file_put_contents($logDir . '/query_perf.log', $logEntry, FILE_APPEND);
}
