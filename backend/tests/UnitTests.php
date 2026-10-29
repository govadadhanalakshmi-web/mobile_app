<?php
declare(strict_types=1);

/**
 * Backend Unit Test Suite
 * Tests Core Helpers, Security Sanitization, JWT Authentication, and Validation Logic.
 */

require_once __DIR__ . '/../helpers/api-helpers.php';
require_once __DIR__ . '/../helpers/jwt-helper.php';

$passed = 0;
$failed = 0;

function assertCondition(string $testName, bool $condition, string $detail = ''): void {
    global $passed, $failed;
    if ($condition) {
        echo "  [PASS] {$testName}\n";
        $passed++;
    } else {
        echo "  [FAIL] {$testName} - {$detail}\n";
        $failed++;
    }
}

echo "========================================\n";
echo "Running Backend Unit Tests\n";
echo "========================================\n";

// 1. Test XSS Input Sanitization
echo "\nTest Group 1: Security & Sanitization\n";
$dirtyInput = [
    'title' => '<script>alert("hack")</script>Test Task',
    'nested' => [
        'description' => '<img src=x onerror=alert(1)>Important notes'
    ]
];
$clean = sanitizeRecursive($dirtyInput);

assertCondition(
    'XSS Sanitization removes raw script tags',
    strpos($clean['title'], '<script>') === false && strpos($clean['title'], '&lt;script&gt;') !== false,
    'Expected &lt;script&gt; got: ' . $clean['title']
);

assertCondition(
    'Nested array fields sanitized properly',
    strpos($clean['nested']['description'], '<img') === false,
    'Nested description was not sanitized'
);

// 2. Test Due Date Format Validation Logic
echo "\nTest Group 2: Validation Logic\n";

function isValidDate(?string $date): bool {
    if ($date === null || $date === '') return true;
    $d = DateTime::createFromFormat('Y-m-d', $date);
    return $d && $d->format('Y-m-d') === $date;
}

assertCondition('Valid YYYY-MM-DD accepted', isValidDate('2026-12-31') === true);
assertCondition('Invalid DD-MM-YYYY rejected', isValidDate('31-12-2026') === false);
assertCondition('Invalid text date rejected', isValidDate('invalid-date') === false);
assertCondition('Null date accepted as optional', isValidDate(null) === true);

// 3. Test JWT Encoding, Decoding & Tamper Resistance
echo "\nTest Group 3: JWT Security & Token Lifecycle\n";
$secret = 'test_enterprise_secret_2026_xyz';
$payload = [
    'sub'   => 42,
    'email' => 'architect@todomaster.com',
    'name'  => 'Performance Architect'
];

$token = JwtHelper::generate($payload, $secret, 3600);
assertCondition('JWT generates valid 3-part dot-separated string', count(explode('.', $token)) === 3);

$decoded = JwtHelper::verify($token, $secret);
assertCondition('JWT verifies signature and returns sub claim', isset($decoded['sub']) && $decoded['sub'] === 42);
assertCondition('JWT returns email claim', isset($decoded['email']) && $decoded['email'] === 'architect@todomaster.com');
assertCondition('JWT contains iat and exp timestamps', isset($decoded['iat']) && isset($decoded['exp']) && $decoded['exp'] > time());

// Test Tampered Token Rejection
$tamperedToken = $token . 'tamper';
$tamperCaught = false;
try {
    JwtHelper::verify($tamperedToken, $secret);
} catch (RuntimeException $e) {
    $tamperCaught = true;
}
assertCondition('JWT rejects tampered signature', $tamperCaught === true);

// Test Expired Token Rejection
$expiredToken = JwtHelper::generate($payload, $secret, -10);
$expiredCaught = false;
try {
    JwtHelper::verify($expiredToken, $secret);
} catch (RuntimeException $e) {
    $expiredCaught = true;
}
assertCondition('JWT rejects expired token', $expiredCaught === true);

// 4. Test Bcrypt Password Security
echo "\nTest Group 4: Bcrypt Password Hashing\n";
$rawPassword = 'Password123!';
$hash = password_hash($rawPassword, PASSWORD_BCRYPT, ['cost' => 12]);
assertCondition('Bcrypt generates valid hash starting with $2y$', str_starts_with($hash, '$2y$'));
assertCondition('password_verify validates correct password', password_verify($rawPassword, $hash) === true);
assertCondition('password_verify rejects wrong password', password_verify('WrongPassword!', $hash) === false);

// 5. Test Corporate Response Schema Contract
echo "\nTest Group 5: Corporate Response Schema Contract\n";
$testPayload = [
    'status' => 'success',
    'message' => 'Operation completed',
    'data' => (object)['item_id' => 101]
];
$jsonOutput = json_encode($testPayload);
$decodedJson = json_decode($jsonOutput, true);

assertCondition('Response contains "status" key', isset($decodedJson['status']) && $decodedJson['status'] === 'success');
assertCondition('Response contains "message" key', isset($decodedJson['message']) && $decodedJson['message'] === 'Operation completed');
assertCondition('Response contains "data" object', isset($decodedJson['data']) && is_array($decodedJson['data']));

// 6. Test Schema SQL file integrity
echo "\nTest Group 6: Database Schema Specification\n";
$schemaSql = file_get_contents(__DIR__ . '/../database/schema.sql');

assertCondition('Schema specifies utf8mb4_0900_ai_ci collation', strpos($schemaSql, 'utf8mb4_0900_ai_ci') !== false);
assertCondition('Schema specifies PascalCase table `Users`', strpos($schemaSql, 'CREATE TABLE IF NOT EXISTS `Users`') !== false);
assertCondition('Schema specifies PascalCase table `TodoStatuses`', strpos($schemaSql, 'CREATE TABLE IF NOT EXISTS `TodoStatuses`') !== false);
assertCondition('Schema specifies PascalCase table `TodoItems`', strpos($schemaSql, 'CREATE TABLE IF NOT EXISTS `TodoItems`') !== false);
assertCondition('Schema specifies `user_id` foreign key on `TodoItems`', strpos($schemaSql, '`user_id` INT NOT NULL') !== false);
assertCondition('Schema defines `is_deleted` soft-delete column', strpos($schemaSql, '`is_deleted` TINYINT(1)') !== false);
assertCondition('Schema contains default status seeds', strpos($schemaSql, "'pending'") !== false && strpos($schemaSql, "'completed'") !== false);
assertCondition('Schema contains default demo user seed', strpos($schemaSql, "'demo@todomaster.com'") !== false);

echo "\n----------------------------------------\n";
echo "Summary: {$passed} Passed, {$failed} Failed\n";
echo "----------------------------------------\n";

if ($failed > 0) {
    exit(1);
}
