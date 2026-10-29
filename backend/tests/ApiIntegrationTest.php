<?php
declare(strict_types=1);

/**
 * Backend API Integration Test Suite
 * Simulates real HTTP calls against the running PHP backend API endpoints.
 * Usage: php backend/tests/ApiIntegrationTest.php
 */

$baseUrl = 'http://127.0.0.1:8000';
$passed = 0;
$failed = 0;

function runIntegrationTest(string $title, callable $testFn): void {
    global $passed, $failed;
    try {
        $testFn();
        echo "  [PASS] {$title}\n";
        $passed++;
    } catch (Throwable $e) {
        echo "  [FAIL] {$title} -> " . $e->getMessage() . "\n";
        $failed++;
    }
}

function makeHttpRequest(string $url, string $method = 'GET', ?array $body = null): array {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);

    $headers = ['Accept: application/json', 'Content-Type: application/json'];
    if ($body !== null) {
        $json = json_encode($body);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $raw = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($err) {
        throw new RuntimeException("CURL connection error: {$err} (Is server running at {$url}?)");
    }

    $decoded = json_decode((string)$raw, true);
    return ['code' => $httpCode, 'body' => $decoded];
}

echo "========================================\n";
echo "Backend API Integration Tests\n";
echo "Target Base URL: {$baseUrl}\n";
echo "========================================\n\n";

// 1. Integration: Test Status Lookup Endpoint
runIntegrationTest('GET /api/statuses/index.php returns 200 with lookup statuses', function() use ($baseUrl) {
    $res = makeHttpRequest("{$baseUrl}/api/statuses/index.php");
    if ($res['code'] !== 200) {
        throw new RuntimeException("Expected 200, got {$res['code']}");
    }
    if ($res['body']['status'] !== 'success') {
        throw new RuntimeException("Status is not 'success'");
    }
    if (empty($res['body']['data']['statuses'])) {
        throw new RuntimeException("Statuses array is empty");
    }
});

// 2. Integration: Test Todos List Endpoint
runIntegrationTest('GET /api/todos/index.php returns paginated response', function() use ($baseUrl) {
    $res = makeHttpRequest("{$baseUrl}/api/todos/index.php?page=1&limit=5");
    if ($res['code'] !== 200) {
        throw new RuntimeException("Expected 200, got {$res['code']}");
    }
    if (!isset($res['body']['data']['pagination'])) {
        throw new RuntimeException("Pagination object missing from response");
    }
});

// 3. Integration: Test Validation Error Handling
runIntegrationTest('POST /api/todos/create.php rejects empty title with 422', function() use ($baseUrl) {
    $res = makeHttpRequest("{$baseUrl}/api/todos/create.php", 'POST', ['title' => '']);
    if ($res['code'] !== 422) {
        throw new RuntimeException("Expected 422 Validation error, got {$res['code']}");
    }
    if ($res['body']['status'] !== 'error') {
        throw new RuntimeException("Expected error status in envelope");
    }
});

echo "\n----------------------------------------\n";
echo "Summary: {$passed} Passed, {$failed} Failed\n";
echo "----------------------------------------\n";

