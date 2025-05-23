<?php
// api/exams_list.php
// File Version: 1.0.0
// App Version: 0.0.16

// Ensure CORS headers are sent and handle preflight
require_once '../utils.php';
require_once '../database.php';

// Instantiate DB & connect
$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    sendJsonResponse(['message' => 'Database connection failed.'], 500);
}

try {
    // Fetch exams with associated topic and lesson names
    $query = "SELECT
                e.id AS exam_id,
                e.title AS exam_title,
                e.instructions AS exam_description,  -- *** CHANGE THIS LINE ***
                e.total_questions AS exam_total_questions,
                e.pass_marks AS exam_pass_percentage,
                e.created_at AS exam_created_at,
                t.name AS topic_name,
                s.name AS subject_name,
                le.title AS lesson_title
              FROM
                exams e
              LEFT JOIN
                topics t ON e.topic_id = t.id
              LEFT JOIN
                lessons le ON t.lesson_id = le.id
              LEFT JOIN
                subjects s ON le.subject_id = s.id
              ORDER BY
                e.created_at DESC";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $exams = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendJsonResponse($exams);

} catch (PDOException $e) {
    error_log("Exams List API error: " . $e->getMessage());
    sendJsonResponse(['message' => 'Error fetching exams data.', 'details' => $e->getMessage()], 500);
}
?>