<?php
// api/exams.php
// File Version: 1.0.1 (Corrected GET filtering logic and added type to select)
// App Version: 0.0.17

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
            $subject_id = filter_input(INPUT_GET, 'subject_id', FILTER_VALIDATE_INT);
            $lesson_id = filter_input(INPUT_GET, 'lesson_id', FILTER_VALIDATE_INT);
            $topic_id = filter_input(INPUT_GET, 'topic_id', FILTER_VALIDATE_INT);

            $query = "SELECT
                        e.id,
                        e.topic_id,
                        e.lesson_id,
                        e.subject_id,
                        t.name as topic_name,
                        l.title as lesson_title,
                        s.name as subject_name,
                        e.title,
                        e.duration_minutes,
                        e.total_marks,
                        e.pass_marks,
                        e.instructions,
                        e.total_questions,
                        e.created_at,
                        e.type, -- Include the 'type' column
                        e.negative_mark_value
                      FROM
                        exams e
                      LEFT JOIN topics t ON e.topic_id = t.id
                      LEFT JOIN lessons l ON e.lesson_id = l.id
                      LEFT JOIN subjects s ON e.subject_id = s.id
                      WHERE 1=1 "; // Start with a true condition to easily append AND clauses

            $params = [];

            // Add conditions based on provided filters
            if ($subject_id !== false && $subject_id !== null) {
                $query .= " AND e.subject_id = :subject_id";
                $params[':subject_id'] = $subject_id;
            }
            if ($lesson_id !== false && $lesson_id !== null) {
                $query .= " AND e.lesson_id = :lesson_id";
                $params[':lesson_id'] = $lesson_id;
            }
            if ($topic_id !== false && $topic_id !== null) {
                $query .= " AND e.topic_id = :topic_id";
                $params[':topic_id'] = $topic_id;
            }

            // Exclude exams of type 'Custom' from this list, as these are typically
            // the exams created by the user and shouldn't be selectable for creating new custom exams from existing ones.
            $query .= " AND e.type != 'Custom' ";

            $query .= " ORDER BY e.created_at DESC";

            $stmt = $db->prepare($query);

            // Bind parameters
            foreach ($params as $param_name => $param_value) {
                // Determine parameter type for binding (PDO::PARAM_INT for integers)
                $param_type = is_int($param_value) ? PDO::PARAM_INT : PDO::PARAM_STR;
                $stmt->bindValue($param_name, $param_value, $param_type);
            }

            $stmt->execute();
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

        // Basic validation for new exam creation
        if (
            empty($data->title) ||
            !isset($data->duration_minutes) ||
            !isset($data->total_marks) ||
            !isset($data->pass_marks)
        ) {
            sendJsonResponse(['message' => 'Missing required fields (title, duration_minutes, total_marks, pass_marks).'], 400);
        }

        // Determine if it's a topic-based or lesson-based exam for creating.
        // For custom exams from existing ones, the JS part will hit create_custom_exam_from_exams.php
        // This POST handles creating standard exams (e.g., from an admin panel)
        $topic_id = isset($data->topic_id) && !empty($data->topic_id) ? (int)$data->topic_id : null;
        $lesson_id = isset($data->lesson_id) && !empty($data->lesson_id) ? (int)$data->lesson_id : null;
        $subject_id = null; // Will derive this from topic or lesson

        // Validate that at least one of topic_id, lesson_id, or subject_id is provided
        if ($topic_id === null && $lesson_id === null && (!isset($data->subject_id) || empty($data->subject_id))) {
            sendJsonResponse(['message' => 'At least one of topic_id, lesson_id, or subject_id must be provided for exam creation.'], 400);
        }

        try {
            // Derive lesson_id and subject_id if topic_id is provided
            if ($topic_id !== null) {
                $checkTopicQuery = "SELECT id, lesson_id FROM topics WHERE id = :topic_id LIMIT 1";
                $checkTopicStmt = $db->prepare($checkTopicQuery);
                $checkTopicStmt->bindParam(':topic_id', $topic_id, PDO::PARAM_INT);
                $checkTopicStmt->execute();
                $topicInfo = $checkTopicStmt->fetch(PDO::FETCH_ASSOC);

                if ($topicInfo === false) {
                    sendJsonResponse(['message' => 'Invalid Topic ID provided.'], 400);
                }
                $lesson_id = (int)$topicInfo['lesson_id'];
            }

            // Derive subject_id if lesson_id is provided (either directly or derived from topic)
            if ($lesson_id !== null) {
                $checkLessonQuery = "SELECT id, subject_id FROM lessons WHERE id = :lesson_id LIMIT 1";
                $checkLessonStmt = $db->prepare($checkLessonQuery);
                $checkLessonStmt->bindParam(':lesson_id', $lesson_id, PDO::PARAM_INT);
                $checkLessonStmt->execute();
                $lessonInfo = $checkLessonStmt->fetch(PDO::FETCH_ASSOC);

                if ($lessonInfo === false) {
                    sendJsonResponse(['message' => 'Invalid Lesson ID provided or derived.'], 400);
                }
                $subject_id = (int)$lessonInfo['subject_id'];
            } elseif (isset($data->subject_id) && !empty($data->subject_id)) {
                // If only subject_id is provided (for a subject-level exam creation)
                $subject_id = (int)$data->subject_id;
            } else {
                // Should not happen if previous checks passed, but for robustness
                sendJsonResponse(['message' => 'Could not determine subject for exam.'], 400);
            }

            $query = "INSERT INTO exams (topic_id, lesson_id, subject_id, title, duration_minutes, total_marks, pass_marks, instructions, total_questions, negative_mark_value, type)
                      VALUES (:topic_id, :lesson_id, :subject_id, :title, :duration_minutes, :total_marks, :pass_marks, :instructions, :total_questions, :negative_mark_value, :type)";
            $stmt = $db->prepare($query);

            // Sanitize and prepare inputs
            $title = htmlspecialchars(strip_tags($data->title));
            $duration_minutes = (int)$data->duration_minutes;
            $total_marks = (float)$data->total_marks;
            $pass_marks = (float)$data->pass_marks;
            $instructions = isset($data->instructions) ? htmlspecialchars(strip_tags($data->instructions)) : null;
            $total_questions = isset($data->total_questions) ? (int)$data->total_questions : 0;
            $negative_mark_value = isset($data->negative_mark_value) ? (float)$data->negative_mark_value : 0.00;
            $type = isset($data->type) ? htmlspecialchars(strip_tags($data->type)) : 'Standard'; // Default type

            $stmt->bindParam(':topic_id', $topic_id, PDO::PARAM_INT);
            $stmt->bindParam(':lesson_id', $lesson_id, PDO::PARAM_INT);
            $stmt->bindParam(':subject_id', $subject_id, PDO::PARAM_INT);
            $stmt->bindParam(':title', $title);
            $stmt->bindParam(':duration_minutes', $duration_minutes);
            $stmt->bindParam(':total_marks', $total_marks);
            $stmt->bindParam(':pass_marks', $pass_marks);
            $stmt->bindParam(':instructions', $instructions);
            $stmt->bindParam(':total_questions', $total_questions);
            $stmt->bindParam(':negative_mark_value', $negative_mark_value);
            $stmt->bindParam(':type', $type);


            if ($stmt->execute()) {
                // Update total_exams in the parent topic/lesson/subject if applicable
                if ($topic_id !== null) {
                    $updateCountQuery = "UPDATE topics SET total_exams = total_exams + 1 WHERE id = :id";
                    $updateCountStmt = $db->prepare($updateCountQuery);
                    $updateCountStmt->bindParam(':id', $topic_id, PDO::PARAM_INT);
                    $updateCountStmt->execute();
                } else if ($lesson_id !== null) {
                    $updateCountQuery = "UPDATE lessons SET total_exams = total_exams + 1 WHERE id = :id";
                    $updateCountStmt = $db->prepare($updateCountQuery);
                    $updateCountStmt->bindParam(':id', $lesson_id, PDO::PARAM_INT);
                    $updateCountStmt->execute();
                } else if ($subject_id !== null) { // For subject-level exams (less common, but handled)
                    $updateCountQuery = "UPDATE subjects SET total_exams = total_exams + 1 WHERE id = :id";
                    $updateCountStmt = $db->prepare($updateCountQuery);
                    $updateCountStmt->bindParam(':id', $subject_id, PDO::PARAM_INT);
                    $updateCountStmt->execute();
                }

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