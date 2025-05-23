<?php
// api/topics_with_question_counts.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Consider restricting this in production
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Correct paths to include necessary files
require_once '../utils.php';     // For sendJsonResponse
require_once '../database.php';   // For Database class
require_once '../config.php';     // If your DB credentials are here, ensure it's loaded

// Initialize the database connection
$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    sendJsonResponse(['message' => 'Database connection failed.'], 500);
}

$subject_id = isset($_GET['subject_id']) ? intval($_GET['subject_id']) : null;
$lesson_id = isset($_GET['lesson_id']) ? intval($_GET['lesson_id']) : null;

$sql = "SELECT
            t.id AS topic_id,
            t.name AS topic_name,
            COUNT(q.id) AS total_questions
        FROM
            topics t
        LEFT JOIN
            questions q ON t.id = q.topic_id
        JOIN
            lessons l ON t.lesson_id = l.id -- JOIN with lessons table
        WHERE 1=1";

$params = [];

if ($subject_id) {
    $sql .= " AND l.subject_id = :subject_id"; // Filter by subject_id from lessons table
    $params[':subject_id'] = $subject_id;
}
if ($lesson_id) {
    $sql .= " AND t.lesson_id = :lesson_id"; // Filter by lesson_id directly from topics table
    $params[':lesson_id'] = $lesson_id;
}

$sql .= " GROUP BY t.id, t.name HAVING COUNT(q.id) > 0 ORDER BY t.name";

try {
    $stmt = $db->prepare($sql);

    // Bind parameters if they exist
    if (!empty($params)) {
        foreach ($params as $key => &$val) {
            if (is_int($val)) {
                $stmt->bindParam($key, $val, PDO::PARAM_INT);
            } else {
                $stmt->bindParam($key, $val);
            }
        }
    }

    $stmt->execute();
    $topics = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendJsonResponse($topics);

} catch (PDOException $e) {
    error_log("Topics with Questions API Error: " . $e->getMessage());
    sendJsonResponse(['message' => 'Error fetching topics with question counts.', 'details' => $e->getMessage()], 500);
}

$db = null;
?>