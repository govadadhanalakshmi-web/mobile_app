<?php
declare(strict_types=1);

/**
 * Backend API Integration Test Suite
 * Simulates real HTTP calls against the running PHP backend API endpoints.
 * Validates Auth (Register/Login/Me), JWT enforcement, and User Data Isolation.
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

function makeHttpRequest(string $url, string $method = 'GET', ?array $body = null, ?string $token = null): array {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);

    $headers = ['Accept: application/json', 'Content-Type: application/json'];
    if ($token !== null) {
        $headers[] = "Authorization: Bearer {$token}";
    }
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

// 1. Status Lookup Endpoint
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

// 2. Demo User Login
$demoToken = '';
runIntegrationTest('POST /api/auth/login.php logs in demo user and returns JWT', function() use ($baseUrl, &$demoToken) {
    $res = makeHttpRequest("{$baseUrl}/api/auth/login.php", 'POST', [
        'email'    => 'demo@todomaster.com',
        'password' => 'Password123!'
    ]);
    if ($res['code'] !== 200) {
        throw new RuntimeException("Expected 200, got {$res['code']}: " . json_encode($res['body']));
    }
    if (empty($res['body']['data']['token'])) {
        throw new RuntimeException("Token missing from login response");
    }
    $demoToken = $res['body']['data']['token'];
});

// 3. Authenticated Profile
runIntegrationTest('GET /api/auth/me.php returns profile with valid Bearer token', function() use ($baseUrl, &$demoToken) {
    $res = makeHttpRequest("{$baseUrl}/api/auth/me.php", 'GET', null, $demoToken);
    if ($res['code'] !== 200) {
        throw new RuntimeException("Expected 200, got {$res['code']}");
    }
    if ($res['body']['data']['user']['email'] !== 'demo@todomaster.com') {
        throw new RuntimeException("Unexpected email in profile");
    }
});

// 4. Register New User
$uniqueEmail = 'tester_' . time() . '@todomaster.com';
$newUserToken = '';
runIntegrationTest('POST /api/auth/register.php registers new user with bcrypt & JWT', function() use ($baseUrl, $uniqueEmail, &$newUserToken) {
    $res = makeHttpRequest("{$baseUrl}/api/auth/register.php", 'POST', [
        'name'     => 'Integration Tester',
        'email'    => $uniqueEmail,
        'password' => 'SecurePass456!'
    ]);
    if ($res['code'] !== 201) {
        throw new RuntimeException("Expected 201, got {$res['code']}: " . json_encode($res['body']));
    }
    if (empty($res['body']['data']['token'])) {
        throw new RuntimeException("Token missing from register response");
    }
    $newUserToken = $res['body']['data']['token'];
});

// 5. Unauthorized Rejection on Todo Endpoints without Token
runIntegrationTest('GET /api/todos/index.php without token returns 401 Unauthorized', function() use ($baseUrl) {
    $res = makeHttpRequest("{$baseUrl}/api/todos/index.php");
    if ($res['code'] !== 401) {
        throw new RuntimeException("Expected 401 Unauthorized, got {$res['code']}");
    }
});

// 6. Create Todo with Authenticated Token
$createdTodoId = 0;
runIntegrationTest('POST /api/todos/create.php creates task bound to authenticated user', function() use ($baseUrl, $newUserToken, &$createdTodoId) {
    $res = makeHttpRequest("{$baseUrl}/api/todos/create.php", 'POST', [
        'title'       => 'User Isolated Task',
        'description' => 'Visible only to Integration Tester',
        'status_id'   => 1
    ], $newUserToken);
    if ($res['code'] !== 201) {
        throw new RuntimeException("Expected 201 Created, got {$res['code']}: " . json_encode($res['body']));
    }
    $createdTodoId = (int)$res['body']['data']['todo']['id'];
    if ($createdTodoId <= 0) {
        throw new RuntimeException("Invalid created todo ID");
    }
});

// 7. Multi-Tenant User Isolation: Demo User cannot see New User's task
runIntegrationTest('Multi-tenant isolation: User A cannot see User B tasks', function() use ($baseUrl, $demoToken, $createdTodoId) {
    $res = makeHttpRequest("{$baseUrl}/api/todos/index.php", 'GET', null, $demoToken);
    if ($res['code'] !== 200) {
        throw new RuntimeException("Expected 200, got {$res['code']}");
    }
    $todos = $res['body']['data']['todos'];
    foreach ($todos as $t) {
        if ((int)$t['id'] === $createdTodoId) {
            throw new RuntimeException("Cross-tenant leak detected: Demo user saw task {$createdTodoId} owned by other user!");
        }
    }
});

echo "\n----------------------------------------\n";
echo "Summary: {$passed} Passed, {$failed} Failed\n";
echo "----------------------------------------\n";

if ($failed > 0) {
    exit(1);
}
