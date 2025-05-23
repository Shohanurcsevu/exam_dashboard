<?php
// api/subjects_with_lessons_and_question_counts.php
// This endpoint fetches subjects, their lessons, and the count of questions within each lesson.

require_once '../utils.php';
require_once '../database.php';

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    sendJsonResponse(['message' => 'Database connection failed.'], 500);
}

try {
    // Fetch all subjects
    $subjectsQuery = "SELECT id, name FROM subjects ORDER BY name ASC";
    $subjectsStmt = $db->prepare($subjectsQuery);
    $subjectsStmt->execute();
    $subjects = $subjectsStmt->fetchAll(PDO::FETCH_ASSOC);

    $response_data = [];

    foreach ($subjects as $subject) {
        // Fetch lessons for each subject
        $lessonsQuery = "SELECT
                            l.id,
                            l.title,
                            l.subject_id,
                            COUNT(q.id) AS total_questions_in_lesson
                         FROM
                            lessons l
                         LEFT JOIN
                            questions q ON l.id = q.lesson_id
                         WHERE
                            l.subject_id = :subject_id
                         GROUP BY
                            l.id, l.title, l.subject_id
                         ORDER BY l.title ASC"; // Order lessons for consistent display
        $lessonsStmt = $db->prepare($lessonsQuery);
        $lessonsStmt->bindParam(':subject_id', $subject['id'], PDO::PARAM_INT);
        $lessonsStmt->execute();
        $lessons = $lessonsStmt->fetchAll(PDO::FETCH_ASSOC);

        // Add lessons to the subject data
        $subject['lessons'] = $lessons;
        $response_data[] = $subject;
    }

    sendJsonResponse($response_data);

} catch (PDOException $e) {
    error_log("Error fetching subjects, lessons, and question counts: " . $e->getMessage());
    sendJsonResponse(['message' => 'Error fetching data.', 'details' => $e->getMessage()], 500);
}
?>