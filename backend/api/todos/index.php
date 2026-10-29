<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/api-helpers.php';

handleCorsHeaders();

try {
    $pdo = getDatabaseConnection();

    // Bounded pagination parameters (Performance rule: bounded queries)
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? min(100, max(1, (int)$_GET['limit'])) : 20;
    $offset = ($page - 1) * $limit;

    $statusId = isset($_GET['status_id']) && $_GET['status_id'] !== '' ? (int)$_GET['status_id'] : null;
    $search = isset($_GET['search']) ? trim((string)$_GET['search']) : '';

    // Base WHERE conditions (Always enforce soft delete filter)
    $whereClauses = ['t.is_deleted = 0'];
    $params = [];

    if ($statusId !== null && $statusId > 0) {
        $whereClauses[] = 't.status_id = :status_id';
        $params[':status_id'] = $statusId;
    }

    if ($search !== '') {
        $whereClauses[] = '(t.title LIKE :search OR t.description LIKE :search_desc)';
        $params[':search'] = '%' . $search . '%';
        $params[':search_desc'] = '%' . $search . '%';
    }

    $whereSql = implode(' AND ', $whereClauses);

    // 1. Get Total Count for Bounded Pagination
    $countSql = "SELECT COUNT(t.id) AS total_count FROM TodoItems t WHERE {$whereSql}";
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $val) {
        $countStmt->bindValue($key, $val);
    }
    $countStmt->execute();
    $totalCount = (int)$countStmt->fetchColumn();

    // 2. Fetch Paginated Records with Explicit Columns and JOINs (No SELECT *)
    $dataSql = "SELECT 
                    t.id,
                    t.title,
                    t.description,
                    t.status_id,
                    s.status_code,
                    s.status_label,
                    s.color_code,
                    t.due_date,
                    t.created_at,
                    t.updated_at
                FROM TodoItems t
                INNER JOIN TodoStatuses s ON t.status_id = s.id
                WHERE {$whereSql}
                ORDER BY t.created_at DESC, t.id DESC
                LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($dataSql);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $todos = $stmt->fetchAll();

    $totalPages = $totalCount > 0 ? (int)ceil($totalCount / $limit) : 0;

    sendSuccess('Todos retrieved successfully', [
        'todos' => $todos,
        'pagination' => [
            'total'       => $totalCount,
            'page'        => $page,
            'limit'       => $limit,
            'total_pages' => $totalPages
        ]
    ]);
} catch (Throwable $e) {
    handleApiException($e, 'Failed to fetch todos.');
}

