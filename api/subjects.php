<?php
// api/subjects.php
// File Version: 1.0.0
// App Version: 0.0.5

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
        // Handle GET requests to fetch all subjects
        try {
            $query = "SELECT id, name, subject_code, total_lessons, book_name, description, created_at FROM subjects ORDER BY created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();

            $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);

            sendJsonResponse($subjects);
        } catch (PDOException $e) {
            error_log("Subjects GET error: " . $e->getMessage());
            sendJsonResponse(['message' => 'Error fetching subjects.', 'details' => $e->getMessage()], 500);
        }
        break;

    case 'POST':
        // Handle POST requests to add a new subject
        $data = json_decode(file_get_contents("php://input"));

        if (
            empty($data->name) ||
            empty($data->subject_code) ||
            !isset($data->total_lessons) // total_lessons can be 0, so check if set
        ) {
            sendJsonResponse(['message' => 'Missing required fields (name, subject_code, total_lessons).'], 400);
        }

        try {
            // Check if subject_code already exists
            $checkQuery = "SELECT id FROM subjects WHERE subject_code = :subject_code LIMIT 1";
            $checkStmt = $db->prepare($checkQuery);
            $checkStmt->bindParam(':subject_code', $data->subject_code);
            $checkStmt->execute();

            if ($checkStmt->rowCount() > 0) {
                sendJsonResponse(['message' => 'Subject with this code already exists.'], 409); // Conflict
            }

            $query = "INSERT INTO subjects (name, subject_code, total_lessons, book_name, description) VALUES (:name, :subject_code, :total_lessons, :book_name, :description)";
            $stmt = $db->prepare($query);

            // Sanitize inputs (basic, for real app use more robust filtering)
            $name = htmlspecialchars(strip_tags($data->name));
            $subject_code = htmlspecialchars(strip_tags($data->subject_code));
            $total_lessons = (int)$data->total_lessons; // Ensure it's an integer
            $book_name = isset($data->book_name) ? htmlspecialchars(strip_tags($data->book_name)) : null;
            $description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : null;

            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':subject_code', $subject_code);
            $stmt->bindParam(':total_lessons', $total_lessons);
            $stmt->bindParam(':book_name', $book_name);
            $stmt->bindParam(':description', $description);

            if ($stmt->execute()) {
                sendJsonResponse(['message' => 'Subject added successfully.', 'id' => $db->lastInsertId()], 201); // 201 Created
            } else {
                sendJsonResponse(['message' => 'Failed to add subject.'], 500);
            }
        } catch (PDOException $e) {
            error_log("Subjects POST error: " . $e->getMessage());
            sendJsonResponse(['message' => 'Error adding subject.', 'details' => $e->getMessage()], 500);
        }
        break;

    default:
        sendJsonResponse(['message' => 'Method Not Allowed.'], 405);
        break;
}
?>