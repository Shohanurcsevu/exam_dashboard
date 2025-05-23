<?php
// api/lessons_by_subject.php
// File Version: 1.0.0
// App Version: 0.0.17

require_once '../utils.php';
require_once '../database.php';

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    sendJsonResponse(['message' => 'Database connection failed.'], 500);
}

$subject_id = filter_input(INPUT_GET, 'subject_id', FILTER_VALIDATE_INT);

if (!$subject_id) {
    sendJsonResponse(['message' => 'Missing or invalid Subject ID.'], 400);
}

try {
    $query = "SELECT
                l.id AS lesson_id,
                l.title AS lesson_name,
                COUNT(q.id) AS total_questions_in_lesson
              FROM
                lessons l
              LEFT JOIN
                questions q ON l.id = q.lesson_id
              WHERE
                l.subject_id = :subject_id
              GROUP BY
                l.id, l.title
              ORDER BY
                l.title ASC";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':subject_id', $subject_id, PDO::PARAM_INT);
    $stmt->execute();
    $lessons = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendJsonResponse($lessons);

} catch (PDOException $e) {
    error_log("Lessons by Subject API error: " . $e->getMessage());
    sendJsonResponse(['message' => 'Error fetching lessons for subject.', 'details' => $e->getMessage()], 500);
}
?>