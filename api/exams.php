<?php
// api/exams.php
// File Version: 1.0.0
// App Version: 0.0.10

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
        // Handle GET requests to fetch exams
        try {
            $query = "SELECT e.id, e.topic_id, t.name as topic_name, l.title as lesson_title, s.name as subject_name,
                             e.title, e.duration_minutes, e.total_marks, e.pass_marks, e.instructions, e.total_questions, e.created_at
                      FROM exams e
                      JOIN topics t ON e.topic_id = t.id
                      JOIN lessons l ON t.lesson_id = l.id
                      JOIN subjects s ON l.subject_id = s.id";

            $params = [];
            if (isset($_GET['topic_id']) && is_numeric($_GET['topic_id'])) {
                $query .= " WHERE e.topic_id = :topic_id";
                $params[':topic_id'] = $_GET['topic_id'];
            }
            $query .= " ORDER BY e.created_at DESC";

            $stmt = $db->prepare($query);
            $stmt->execute($params);

            $exams = $stmt->fetchAll(PDO::FETCH_ASSOC);

            sendJsonResponse($exams);
        } catch (PDOException $e) {
            error_log("Exams GET error: " . $e->getMessage());
            sendJsonResponse(['message' => 'Error fetching exams.', 'details' => $e->getMessage()], 500);
        }
        break;

    case 'POST':
        // Handle POST requests to add a new exam
        $data = json_decode(file_get_contents("php://input"));

        if (
            empty($data->topic_id) ||
            empty($data->title) ||
            !isset($data->duration_minutes) ||
            !isset($data->total_marks) ||
            !isset($data->pass_marks)
        ) {
            sendJsonResponse(['message' => 'Missing required fields (topic_id, title, duration_minutes, total_marks, pass_marks).'], 400);
        }

        try {
            // Check if topic_id exists
            $checkTopicQuery = "SELECT id FROM topics WHERE id = :topic_id LIMIT 1";
            $checkTopicStmt = $db->prepare($checkTopicQuery);
            $checkTopicStmt->bindParam(':topic_id', $data->topic_id);
            $checkTopicStmt->execute();
            if ($checkTopicStmt->rowCount() === 0) {
                sendJsonResponse(['message' => 'Invalid Topic ID provided.'], 400);
            }

            $query = "INSERT INTO exams (topic_id, title, duration_minutes, total_marks, pass_marks, instructions, total_questions)
                      VALUES (:topic_id, :title, :duration_minutes, :total_marks, :pass_marks, :instructions, :total_questions)";
            $stmt = $db->prepare($query);

            // Sanitize inputs
            $topic_id = (int)$data->topic_id;
            $title = htmlspecialchars(strip_tags($data->title));
            $duration_minutes = (int)$data->duration_minutes;
            $total_marks = (float)$data->total_marks; // Marks can be decimal
            $pass_marks = (float)$data->pass_marks;
            $instructions = isset($data->instructions) ? htmlspecialchars(strip_tags($data->instructions)) : null;
            $total_questions = isset($data->total_questions) ? (int)$data->total_questions : 0;

            $stmt->bindParam(':topic_id', $topic_id);
            $stmt->bindParam(':title', $title);
            $stmt->bindParam(':duration_minutes', $duration_minutes);
            $stmt->bindParam(':total_marks', $total_marks);
            $stmt->bindParam(':pass_marks', $pass_marks);
            $stmt->bindParam(':instructions', $instructions);
            $stmt->bindParam(':total_questions', $total_questions);

            if ($stmt->execute()) {
                // Update total_exams in the parent topic
                $updateTopicQuery = "UPDATE topics SET total_exams = total_exams + 1 WHERE id = :topic_id";
                $updateTopicStmt = $db->prepare($updateTopicQuery);
                $updateTopicStmt->bindParam(':topic_id', $topic_id);
                $updateTopicStmt->execute();

                sendJsonResponse(['message' => 'Exam added successfully.', 'id' => $db->lastInsertId()], 201);
            } else {
                sendJsonResponse(['message' => 'Failed to add exam.'], 500);
            }
        } catch (PDOException $e) {
            error_log("Exams POST error: " . $e->getMessage());
            sendJsonResponse(['message' => 'Error adding exam.', 'details' => $e->getMessage()], 500);
        }
        break;

    default:
        sendJsonResponse(['message' => 'Method Not Allowed.'], 405);
        break;
}
?>