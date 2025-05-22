<?php
// api/questions.php
// File Version: 1.0.0
// App Version: 0.0.11

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
        // Handle GET requests to fetch questions for a specific exam
        try {
            if (!isset($_GET['exam_id']) || !is_numeric($_GET['exam_id'])) {
                sendJsonResponse(['message' => 'Exam ID is required.'], 400);
            }

            $exam_id = (int)$_GET['exam_id'];

            $query = "SELECT id, exam_id, question_text, question_type, options_json, correct_answer, marks, created_at
                      FROM questions
                      WHERE exam_id = :exam_id
                      ORDER BY created_at ASC"; // Order by creation to maintain logical flow

            $stmt = $db->prepare($query);
            $stmt->bindParam(':exam_id', $exam_id, PDO::PARAM_INT);
            $stmt->execute();

            $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Decode options_json for each question
            foreach ($questions as &$question) {
                if (!empty($question['options_json'])) {
                    $question['options_json'] = json_decode($question['options_json'], true);
                } else {
                    $question['options_json'] = null;
                }
            }
            unset($question); // Break the reference

            sendJsonResponse($questions);
        } catch (PDOException $e) {
            error_log("Questions GET error: " . $e->getMessage());
            sendJsonResponse(['message' => 'Error fetching questions.', 'details' => $e->getMessage()], 500);
        }
        break;

    case 'POST':
        // Handle POST requests to add a new question
        $data = json_decode(file_get_contents("php://input"));

        if (
            empty($data->exam_id) ||
            empty($data->question_text) ||
            empty($data->question_type) ||
            !isset($data->marks) // Marks can be 0
        ) {
            sendJsonResponse(['message' => 'Missing required fields (exam_id, question_text, question_type, marks).'], 400);
        }

        // Validate question type and required fields for each type
        $allowedQuestionTypes = ['multiple_choice', 'true_false', 'short_answer'];
        if (!in_array($data->question_type, $allowedQuestionTypes)) {
            sendJsonResponse(['message' => 'Invalid question type provided.'], 400);
        }

        $options_json = null;
        $correct_answer = null;

        switch ($data->question_type) {
            case 'multiple_choice':
                if (empty($data->options) || !is_array($data->options) || count($data->options) < 2) {
                    sendJsonResponse(['message' => 'Multiple choice questions require at least two options.'], 400);
                }
                foreach ($data->options as $option) {
                    if (empty($option->key) || !isset($option->value)) { // value can be empty string
                        sendJsonResponse(['message' => 'Each option must have a key (e.g., A, B) and a value.'], 400);
                    }
                }
                if (empty($data->correct_option) || !in_array($data->correct_option, array_column($data->options, 'key'))) {
                    sendJsonResponse(['message' => 'Correct option must be one of the provided option keys.'], 400);
                }
                $options_json = json_encode($data->options);
                $correct_answer = htmlspecialchars(strip_tags($data->correct_option));
                break;

            case 'true_false':
                if (!isset($data->correct_answer) || !in_array($data->correct_answer, ['True', 'False'])) {
                    sendJsonResponse(['message' => 'True/False questions require correct_answer to be "True" or "False".'], 400);
                }
                // For true/false, options are fixed and not stored in options_json
                $options_json = json_encode([['key' => 'True', 'value' => 'True'], ['key' => 'False', 'value' => 'False']]); // Store fixed options for consistency
                $correct_answer = htmlspecialchars(strip_tags($data->correct_answer));
                break;

            case 'short_answer':
                // For short answer, correct_answer is required for auto-checking
                if (empty($data->correct_answer)) {
                    sendJsonResponse(['message' => 'Short answer questions require a correct_answer.'], 400);
                }
                $correct_answer = htmlspecialchars(strip_tags($data->correct_answer));
                // No options for short answer
                break;
        }

        try {
            // Check if exam_id exists
            $checkExamQuery = "SELECT id FROM exams WHERE id = :exam_id LIMIT 1";
            $checkExamStmt = $db->prepare($checkExamQuery);
            $checkExamStmt->bindParam(':exam_id', $data->exam_id);
            $checkExamStmt->execute();
            if ($checkExamStmt->rowCount() === 0) {
                sendJsonResponse(['message' => 'Invalid Exam ID provided.'], 400);
            }

            $query = "INSERT INTO questions (exam_id, question_text, question_type, options_json, correct_answer, marks)
                      VALUES (:exam_id, :question_text, :question_type, :options_json, :correct_answer, :marks)";
            $stmt = $db->prepare($query);

            // Sanitize inputs
            $exam_id = (int)$data->exam_id;
            $question_text = htmlspecialchars(strip_tags($data->question_text));
            $question_type = htmlspecialchars(strip_tags($data->question_type));
            $marks = (float)$data->marks;

            $stmt->bindParam(':exam_id', $exam_id, PDO::PARAM_INT);
            $stmt->bindParam(':question_text', $question_text);
            $stmt->bindParam(':question_type', $question_type);
            $stmt->bindParam(':options_json', $options_json);
            $stmt->bindParam(':correct_answer', $correct_answer);
            $stmt->bindParam(':marks', $marks, PDO::PARAM_STR); // Use PARAM_STR for float, PDO handles conversion

            if ($stmt->execute()) {
                // Update total_questions in the parent exam
                $updateExamQuery = "UPDATE exams SET total_questions = total_questions + 1 WHERE id = :exam_id";
                $updateExamStmt = $db->prepare($updateExamQuery);
                $updateExamStmt->bindParam(':exam_id', $exam_id, PDO::PARAM_INT);
                $updateExamStmt->execute();

                sendJsonResponse(['message' => 'Question added successfully.', 'id' => $db->lastInsertId()], 201);
            } else {
                sendJsonResponse(['message' => 'Failed to add question.'], 500);
            }
        } catch (PDOException $e) {
            error_log("Questions POST error: " . $e->getMessage());
            sendJsonResponse(['message' => 'Error adding question.', 'details' => $e->getMessage()], 500);
        }
        break;

    default:
        sendJsonResponse(['message' => 'Method Not Allowed.'], 405);
        break;
}
?>