<?php
declare(strict_types=1);

/**
 * Centralized API Helpers & Response Service
 * Strictly enforces:
 * 1. JSON Schema: {"status": "success|error", "message": "...", "data": {}}
 * 2. Centralized error handling and logging (no die() or raw stack traces)
 * 3. Mobile CORS compatibility
 * 4. Input sanitization against XSS
 */

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
 * @param array|string $input
 * @return array|string
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

