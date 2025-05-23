<?php
// api/subjects.php
// File Version: 1.1.1 (Debugging added)
// App Version: 0.0.7

require_once '../utils.php';
require_once '../database.php';

// Temporarily enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    sendJsonResponse(['message' => 'Database connection failed.'], 500);
}

$request_method = $_SERVER["REQUEST_METHOD"];
$id = null; // Initialize $id for single record operations

// --- DEBUGGING START ---
error_log("Request Method: " . $request_method);
error_log("REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'N/A'));
error_log("SCRIPT_NAME: " . ($_SERVER['SCRIPT_NAME'] ?? 'N/A'));
error_log("PATH_INFO: " . ($_SERVER['PATH_INFO'] ?? 'N/A'));
// --- DEBUGGING END ---


// Parse ID from URL if present (e.g., /api/subjects/123)
if (isset($_SERVER['PATH_INFO']) && !empty($_SERVER['PATH_INFO'])) {
    $path_parts = explode('/', $_SERVER['PATH_INFO']);
    if (isset($path_parts[1]) && is_numeric($path_parts[1])) {
        $id = (int)$path_parts[1];
    }
} else {
    // Fallback if PATH_INFO is not set (e.g., for direct access or other rewrite rules)
    // This is less common with RESTful routing but good for robustness.
    // We can try parsing from REQUEST_URI if PATH_INFO fails.
    $requestUri = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
    $apiIndex = array_search('api', $requestUri);
    $subjectsIndex = array_search('subjects', $requestUri);

    if ($subjectsIndex !== false && isset($requestUri[$subjectsIndex + 1])) {
        // Ensure that the segment after 'subjects' is numeric and that 'subjects' is after 'api' if 'api' exists
        if ($apiIndex === false || ($subjectsIndex > $apiIndex)) {
             $potentialId = explode('?', $requestUri[$subjectsIndex + 1])[0]; // Remove query params
             if (is_numeric($potentialId)) {
                $id = (int)$potentialId;
             }
        }
    }
}


// --- DEBUGGING START ---
error_log("Parsed ID: " . ($id ?? 'null'));
// --- DEBUGGING END ---

switch ($request_method) {
    case 'GET':
        // Handle GET requests to fetch all subjects or a single subject by ID
        try {
            if ($id) {
                // Fetch a single subject
                $query = "SELECT id, name, subject_code, total_lessons, book_name, description, created_at FROM subjects WHERE id = :id LIMIT 1";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $id, PDO::PARAM_INT);
                $stmt->execute();
                $subject = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($subject) {
                    sendJsonResponse($subject);
                } else {
                    sendJsonResponse(['message' => 'Subject not found.'], 404);
                }
            } else {
                // Fetch all subjects
                $query = "SELECT id, name, subject_code, total_lessons, book_name, description, created_at FROM subjects ORDER BY created_at DESC";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
                sendJsonResponse($subjects);
            }
        } catch (PDOException $e) {
            error_log("Subjects GET error: " . $e->getMessage());
            sendJsonResponse(['message' => 'Error fetching subject(s).', 'details' => $e->getMessage()], 500);
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

    case 'PUT':
        // Handle PUT requests to update an existing subject
        if (!$id) {
            sendJsonResponse(['message' => 'Subject ID is required for update.'], 400);
        }

        $data = json_decode(file_get_contents("php://input"));

        if (
            empty($data->name) ||
            empty($data->subject_code) ||
            !isset($data->total_lessons)
        ) {
            sendJsonResponse(['message' => 'Missing required fields (name, subject_code, total_lessons).'], 400);
        }

        try {
            // Check if subject exists
            $checkExistenceQuery = "SELECT id FROM subjects WHERE id = :id LIMIT 1";
            $checkExistenceStmt = $db->prepare($checkExistenceQuery);
            $checkExistenceStmt->bindParam(':id', $id, PDO::PARAM_INT);
            $checkExistenceStmt->execute();
            if ($checkExistenceStmt->rowCount() === 0) {
                sendJsonResponse(['message' => 'Subject not found for update.'], 404);
            }

            // Check for duplicate subject_code, excluding the current subject being updated
            $checkDuplicateCodeQuery = "SELECT id FROM subjects WHERE subject_code = :subject_code AND id != :id LIMIT 1";
            $checkDuplicateCodeStmt = $db->prepare($checkDuplicateCodeQuery);
            $checkDuplicateCodeStmt->bindParam(':subject_code', $data->subject_code);
            $checkDuplicateCodeStmt->bindParam(':id', $id, PDO::PARAM_INT);
            $checkDuplicateCodeStmt->execute();

            if ($checkDuplicateCodeStmt->rowCount() > 0) {
                sendJsonResponse(['message' => 'Subject with this code already exists for another subject.'], 409); // Conflict
            }

            $query = "UPDATE subjects SET name = :name, subject_code = :subject_code, total_lessons = :total_lessons, book_name = :book_name, description = :description WHERE id = :id";
            $stmt = $db->prepare($query);

            // Sanitize inputs
            $name = htmlspecialchars(strip_tags($data->name));
            $subject_code = htmlspecialchars(strip_tags($data->subject_code));
            $total_lessons = (int)$data->total_lessons;
            $book_name = isset($data->book_name) ? htmlspecialchars(strip_tags($data->book_name)) : null;
            $description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : null;

            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':subject_code', $subject_code);
            $stmt->bindParam(':total_lessons', $total_lessons);
            $stmt->bindParam(':book_name', $book_name);
            $stmt->bindParam(':description', $description);

            if ($stmt->execute()) {
                if ($stmt->rowCount() > 0) {
                    sendJsonResponse(['message' => 'Subject updated successfully.'], 200);
                } else {
                    sendJsonResponse(['message' => 'No changes made or subject not found.'], 200); // Or 404 if you strictly want to indicate no change
                }
            } else {
                sendJsonResponse(['message' => 'Failed to update subject.'], 500);
            }
        } catch (PDOException $e) {
            error_log("Subjects PUT error: " . $e->getMessage());
            sendJsonResponse(['message' => 'Error updating subject.', 'details' => $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        // Handle DELETE requests to remove a subject
        if (!$id) {
            // --- This is the line that's being hit ---
            sendJsonResponse(['message' => 'Subject ID is required for deletion.'], 400);
        }

        try {
            // Check if subject exists before attempting to delete
            $checkExistenceQuery = "SELECT id FROM subjects WHERE id = :id LIMIT 1";
            $checkExistenceStmt = $db->prepare($checkExistenceQuery);
            $checkExistenceStmt->bindParam(':id', $id, PDO::PARAM_INT);
            $checkExistenceStmt->execute();
            if ($checkExistenceStmt->rowCount() === 0) {
                sendJsonResponse(['message' => 'Subject not found for deletion.'], 404);
            }

            // The following deletion order is crucial if you DO NOT have ON DELETE CASCADE
            // If you HAVE ON DELETE CASCADE in your DB schema, these manual deletes are not strictly necessary
            // but can act as a safeguard or if you want custom logic per level.

            // 1. Delete associated exams (that directly reference this subject_id or indirectly via lessons/topics)
            //    This assumes exams have a subject_id directly. If not, you'd delete via lesson/topic.
            $deleteExamsQuery = "DELETE FROM exams WHERE subject_id = :id OR lesson_id IN (SELECT id FROM lessons WHERE subject_id = :id) OR topic_id IN (SELECT id FROM topics WHERE lesson_id IN (SELECT id FROM lessons WHERE subject_id = :id))";
            $deleteExamsStmt = $db->prepare($deleteExamsQuery);
            $deleteExamsStmt->bindParam(':id', $id, PDO::PARAM_INT);
            $deleteExamsStmt->execute();
            error_log("Deleted " . $deleteExamsStmt->rowCount() . " exams for subject ID " . $id); // For debugging

            // 2. Delete associated topics
            $deleteTopicsQuery = "DELETE FROM topics WHERE lesson_id IN (SELECT id FROM lessons WHERE subject_id = :id)";
            $deleteTopicsStmt = $db->prepare($deleteTopicsQuery);
            $deleteTopicsStmt->bindParam(':id', $id, PDO::PARAM_INT);
            $deleteTopicsStmt->execute();
            error_log("Deleted " . $deleteTopicsStmt->rowCount() . " topics for subject ID " . $id); // For debugging

            // 3. Delete associated lessons
            $deleteLessonsQuery = "DELETE FROM lessons WHERE subject_id = :id";
            $deleteLessonsStmt = $db->prepare($deleteLessonsQuery);
            $deleteLessonsStmt->bindParam(':id', $id, PDO::PARAM_INT);
            $deleteLessonsStmt->execute();
            error_log("Deleted " . $deleteLessonsStmt->rowCount() . " lessons for subject ID " . $id); // For debugging

            // 4. Finally, delete the subject itself
            $query = "DELETE FROM subjects WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);

            if ($stmt->execute()) {
                if ($stmt->rowCount() > 0) {
                    sendJsonResponse(['message' => 'Subject and all associated data deleted successfully.'], 200);
                } else {
                    sendJsonResponse(['message' => 'Subject not found or already deleted.'], 404);
                }
            } else {
                sendJsonResponse(['message' => 'Failed to delete subject.'], 500);
            }
        } catch (PDOException $e) {
            error_log("Subjects DELETE error: " . $e->getMessage());
            sendJsonResponse(['message' => 'Error deleting subject.', 'details' => $e->getMessage()], 500);
        }
        break;

    default:
        sendJsonResponse(['message' => 'Method Not Allowed.'], 405);
        break;
}
?>