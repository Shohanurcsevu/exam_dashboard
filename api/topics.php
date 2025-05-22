<?php
// api/topics.php
// File Version: 1.0.0
// App Version: 0.0.8

require_once '../utils.php';
require_once '../database.php';

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    sendJsonResponse(['message' => 'Database connection failed.'], 500);
}

$request_method = $_SERVER["REQUEST_METHOD"];

switch ($request_method) {
    case 'GET':
        // Handle GET requests to fetch topics
        try {
            $query = "SELECT t.id, t.lesson_id, l.title as lesson_title, t.name, t.total_exams, t.chapter_no, t.description, t.created_at
                      FROM topics t
                      JOIN lessons l ON t.lesson_id = l.id";

            $params = [];
            if (isset($_GET['lesson_id']) && is_numeric($_GET['lesson_id'])) {
                $query .= " WHERE t.lesson_id = :lesson_id";
                $params[':lesson_id'] = $_GET['lesson_id'];
            }
            $query .= " ORDER BY t.created_at DESC";

            $stmt = $db->prepare($query);
            $stmt->execute($params);

            $topics = $stmt->fetchAll(PDO::FETCH_ASSOC);

            sendJsonResponse($topics);
        } catch (PDOException $e) {
            error_log("Topics GET error: " . $e->getMessage());
            sendJsonResponse(['message' => 'Error fetching topics.', 'details' => $e->getMessage()], 500);
        }
        break;

    case 'POST':
        // Handle POST requests to add a new topic
        $data = json_decode(file_get_contents("php://input"));

        if (
            empty($data->lesson_id) ||
            empty($data->name) ||
            !isset($data->total_exams) // total_exams can be 0, so check if set
        ) {
            sendJsonResponse(['message' => 'Missing required fields (lesson_id, name, total_exams).'], 400);
        }

        try {
            // Check if lesson_id exists
            $checkLessonQuery = "SELECT id FROM lessons WHERE id = :lesson_id LIMIT 1";
            $checkLessonStmt = $db->prepare($checkLessonQuery);
            $checkLessonStmt->bindParam(':lesson_id', $data->lesson_id);
            $checkLessonStmt->execute();
            if ($checkLessonStmt->rowCount() === 0) {
                sendJsonResponse(['message' => 'Invalid Lesson ID provided.'], 400);
            }

            $query = "INSERT INTO topics (lesson_id, name, total_exams, chapter_no, description) VALUES (:lesson_id, :name, :total_exams, :chapter_no, :description)";
            $stmt = $db->prepare($query);

            // Sanitize inputs
            $lesson_id = (int)$data->lesson_id;
            $name = htmlspecialchars(strip_tags($data->name));
            $total_exams = (int)$data->total_exams;
            $chapter_no = isset($data->chapter_no) ? htmlspecialchars(strip_tags($data->chapter_no)) : null;
            $description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : null;

            $stmt->bindParam(':lesson_id', $lesson_id);
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':total_exams', $total_exams);
            $stmt->bindParam(':chapter_no', $chapter_no);
            $stmt->bindParam(':description', $description);

            if ($stmt->execute()) {
                // Update total_topics in the parent lesson
                $updateLessonQuery = "UPDATE lessons SET total_topics = total_topics + 1 WHERE id = :lesson_id";
                $updateLessonStmt = $db->prepare($updateLessonQuery);
                $updateLessonStmt->bindParam(':lesson_id', $lesson_id);
                $updateLessonStmt->execute();

                sendJsonResponse(['message' => 'Topic added successfully.', 'id' => $db->lastInsertId()], 201);
            } else {
                sendJsonResponse(['message' => 'Failed to add topic.'], 500);
            }
        } catch (PDOException $e) {
            error_log("Topics POST error: " . $e->getMessage());
            sendJsonResponse(['message' => 'Error adding topic.', 'details' => $e->getMessage()], 500);
        }
        break;

    default:
        sendJsonResponse(['message' => 'Method Not Allowed.'], 405);
        break;
}
?>