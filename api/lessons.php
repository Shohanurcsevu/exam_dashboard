<?php
// api/lessons.php
// File Version: 1.0.0
// App Version: 0.0.7

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
        // Handle GET requests to fetch lessons
        try {
            $query = "SELECT l.id, l.subject_id, s.name as subject_name, l.title, l.total_topics, l.page_no, l.description, l.created_at
                      FROM lessons l
                      JOIN subjects s ON l.subject_id = s.id";

            $params = [];
            if (isset($_GET['subject_id']) && is_numeric($_GET['subject_id'])) {
                $query .= " WHERE l.subject_id = :subject_id";
                $params[':subject_id'] = $_GET['subject_id'];
            }
            $query .= " ORDER BY l.created_at DESC";

            $stmt = $db->prepare($query);
            $stmt->execute($params);

            $lessons = $stmt->fetchAll(PDO::FETCH_ASSOC);

            sendJsonResponse($lessons);
        } catch (PDOException $e) {
            error_log("Lessons GET error: " . $e->getMessage());
            sendJsonResponse(['message' => 'Error fetching lessons.', 'details' => $e->getMessage()], 500);
        }
        break;

    case 'POST':
        // Handle POST requests to add a new lesson
        $data = json_decode(file_get_contents("php://input"));

        if (
            empty($data->subject_id) ||
            empty($data->title) ||
            !isset($data->total_topics) // total_topics can be 0, so check if set
        ) {
            sendJsonResponse(['message' => 'Missing required fields (subject_id, title, total_topics).'], 400);
        }

        try {
            // Check if subject_id exists
            $checkSubjectQuery = "SELECT id FROM subjects WHERE id = :subject_id LIMIT 1";
            $checkSubjectStmt = $db->prepare($checkSubjectQuery);
            $checkSubjectStmt->bindParam(':subject_id', $data->subject_id);
            $checkSubjectStmt->execute();
            if ($checkSubjectStmt->rowCount() === 0) {
                sendJsonResponse(['message' => 'Invalid Subject ID provided.'], 400);
            }

            $query = "INSERT INTO lessons (subject_id, title, total_topics, page_no, description) VALUES (:subject_id, :title, :total_topics, :page_no, :description)";
            $stmt = $db->prepare($query);

            // Sanitize inputs
            $subject_id = (int)$data->subject_id;
            $title = htmlspecialchars(strip_tags($data->title));
            $total_topics = (int)$data->total_topics;
            $page_no = isset($data->page_no) ? htmlspecialchars(strip_tags($data->page_no)) : null;
            $description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : null;

            $stmt->bindParam(':subject_id', $subject_id);
            $stmt->bindParam(':title', $title);
            $stmt->bindParam(':total_topics', $total_topics);
            $stmt->bindParam(':page_no', $page_no);
            $stmt->bindParam(':description', $description);

            if ($stmt->execute()) {
                // Update total_lessons in the parent subject
                $updateSubjectQuery = "UPDATE subjects SET total_lessons = total_lessons + 1 WHERE id = :subject_id";
                $updateSubjectStmt = $db->prepare($updateSubjectQuery);
                $updateSubjectStmt->bindParam(':subject_id', $subject_id);
                $updateSubjectStmt->execute();

                sendJsonResponse(['message' => 'Lesson added successfully.', 'id' => $db->lastInsertId()], 201);
            } else {
                sendJsonResponse(['message' => 'Failed to add lesson.'], 500);
            }
        } catch (PDOException $e) {
            error_log("Lessons POST error: " . $e->getMessage());
            sendJsonResponse(['message' => 'Error adding lesson.', 'details' => $e->getMessage()], 500);
        }
        break;

    default:
        sendJsonResponse(['message' => 'Method Not Allowed.'], 405);
        break;
}
?>