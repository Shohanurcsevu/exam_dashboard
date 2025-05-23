<?php
// api/model_exams.php - Fetches custom model exams

require_once '../utils.php'; // For sendJsonResponse
require_once '../database.php'; // For Database class

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    sendJsonResponse(['success' => false, 'message' => 'Database connection failed.'], 500);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Select exams where subject_id, lesson_id, and topic_id are NULL
        // Order by created_at DESC to show the latest first
        $query = "SELECT
                    id,
                    title,
                    duration_minutes,
                    total_marks,
                    total_questions,
                    created_at,
                    negative_mark_value,
                    pass_marks,
                    instructions
                  FROM
                    exams
                  WHERE
                    subject_id IS NULL AND lesson_id IS NULL AND topic_id IS NULL AND type = 'Custom'
                  ORDER BY
                    created_at DESC";

        $stmt = $db->prepare($query);
        $stmt->execute();

        $modelExams = $stmt->fetchAll(PDO::FETCH_ASSOC);

        sendJsonResponse(['success' => true, 'data' => $modelExams], 200);

    } catch (PDOException $e) {
        error_log("Error fetching model exams: " . $e->getMessage());
        sendJsonResponse(['success' => false, 'message' => 'Error fetching model exams.', 'details' => $e->getMessage()], 500);
    }
} else {
    sendJsonResponse(['success' => false, 'message' => 'Method Not Allowed.'], 405);
}
?>