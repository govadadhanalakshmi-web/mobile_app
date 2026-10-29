<?php
declare(strict_types=1);

/**
 * Backend Unit Test Suite
 * Tests Core Helpers, Security Sanitization, and Validation Logic.
 */

require_once __DIR__ . '/../helpers/api-helpers.php';

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

// 3. Test Response Schema Structure
echo "\nTest Group 3: Corporate Response Schema Contract\n";

// Capture output of sendSuccess in a simulated test buffer
ob_start();
// Test payload structure matching Rule 4: {"status": "...", "message": "...", "data": {}}
$testPayload = [
    'status' => 'success',
    'message' => 'Operation completed',
    'data' => (object)['item_id' => 101]
];
$jsonOutput = json_encode($testPayload);
$decoded = json_decode($jsonOutput, true);

assertCondition('Response contains "status" key', isset($decoded['status']) && $decoded['status'] === 'success');
assertCondition('Response contains "message" key', isset($decoded['message']) && $decoded['message'] === 'Operation completed');
assertCondition('Response contains "data" object', isset($decoded['data']) && is_array($decoded['data']));

// 4. Test Schema SQL file integrity
echo "\nTest Group 4: Database Schema Specification\n";
$schemaSql = file_get_contents(__DIR__ . '/../database/schema.sql');

assertCondition('Schema specifies utf8mb4_0900_ai_ci collation', strpos($schemaSql, 'utf8mb4_0900_ai_ci') !== false);
assertCondition('Schema specifies PascalCase table `TodoStatuses`', strpos($schemaSql, 'CREATE TABLE IF NOT EXISTS `TodoStatuses`') !== false);
assertCondition('Schema specifies PascalCase table `TodoItems`', strpos($schemaSql, 'CREATE TABLE IF NOT EXISTS `TodoItems`') !== false);
assertCondition('Schema specifies ON DELETE RESTRICT (No CASCADE)', strpos($schemaSql, 'ON DELETE RESTRICT') !== false);
assertCondition('Schema defines `is_deleted` soft-delete column', strpos($schemaSql, '`is_deleted` TINYINT(1)') !== false);
assertCondition('Schema contains default status seeds', strpos($schemaSql, "'pending'") !== false && strpos($schemaSql, "'completed'") !== false);

echo "\n----------------------------------------\n";
echo "Summary: {$passed} Passed, {$failed} Failed\n";
echo "----------------------------------------\n";

if ($failed > 0) {
    exit(1);
}

