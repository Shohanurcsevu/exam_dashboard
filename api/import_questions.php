<?php
// api/import_questions.php
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

if ($request_method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true); // Decode as associative array

    if (!isset($data['exam_id']) || !is_numeric($data['exam_id'])) {
        sendJsonResponse(['message' => 'Missing or invalid Exam ID.'], 400);
    }

    $exam_id = (int)$data['exam_id'];

    if (!isset($data['questions']) || !is_array($data['questions'])) {
        sendJsonResponse(['message' => 'Missing or invalid "questions" array in JSON payload.'], 400);
    }

    $questionsToImport = $data['questions'];
    $importedCount = 0;
    $errors = [];

    // Check if exam_id exists once
    try {
        $checkExamQuery = "SELECT id FROM exams WHERE id = :exam_id LIMIT 1";
        $checkExamStmt = $db->prepare($checkExamQuery);
        $checkExamStmt->bindParam(':exam_id', $exam_id, PDO::PARAM_INT);
        $checkExamStmt->execute();
        if ($checkExamStmt->rowCount() === 0) {
            sendJsonResponse(['message' => 'Invalid Exam ID provided. Cannot import questions for a non-existent exam.'], 400);
        }
    } catch (PDOException $e) {
        error_log("Exam ID check error during import: " . $e->getMessage());
        sendJsonResponse(['message' => 'Database error during exam ID check.', 'details' => $e->getMessage()], 500);
    }


    $db->beginTransaction(); // Start transaction for bulk insert
    try {
        $insertQuery = "INSERT INTO questions (exam_id, question_text, question_type, options_json, correct_answer, marks)
                        VALUES (:exam_id, :question_text, :question_type, :options_json, :correct_answer, :marks)";
        $stmt = $db->prepare($insertQuery);

        foreach ($questionsToImport as $questionData) {
            // Validate basic fields for each question
            if (empty($questionData['question'])) {
                $errors[] = "Skipped question due to missing 'question' text.";
                continue;
            }
            if (!isset($questionData['answer'])) { // Answer can be empty for SA if marks are 0, but usually needed
                $errors[] = "Skipped question '{$questionData['question']}' due to missing 'answer'.";
                continue;
            }

            // Determine question type based on format (simple heuristic for now)
            $question_type = 'short_answer'; // Default
            $options_json = null;
            $correct_answer_value = htmlspecialchars(strip_tags($questionData['answer']));
            $marks = isset($questionData['marks']) ? (float)$questionData['marks'] : 1.0; // Default marks to 1 if not provided

            if (isset($questionData['options']) && is_array($questionData['options']) && !empty($questionData['options'])) {
                $question_type = 'multiple_choice';
                $formattedOptions = [];
                foreach ($questionData['options'] as $key => $value) {
                    $formattedOptions[] = ['key' => $key, 'value' => htmlspecialchars(strip_tags($value))];
                }
                $options_json = json_encode($formattedOptions);
                $correct_answer_value = htmlspecialchars(strip_tags($questionData['answer'])); // For MC, answer is the key (A, B, C, D)
            } else if (strtolower($questionData['answer']) === 'true' || strtolower($questionData['answer']) === 'false') {
                 $question_type = 'true_false';
                 $correct_answer_value = ucfirst(strtolower($questionData['answer'])); // Normalize to 'True' or 'False'
                 $options_json = json_encode([['key' => 'True', 'value' => 'True'], ['key' => 'False', 'value' => 'False']]);
            }
            // If it has 'options' and 'answer' is 'True'/'False', prioritize multiple choice if options exist.
            // If it has 'options' and 'answer' is 'A'/'B'/'C'/'D', it's MC.
            // Otherwise, it's short answer.

            $stmt->bindParam(':exam_id', $exam_id, PDO::PARAM_INT);
            $question_text = htmlspecialchars(strip_tags($questionData['question']));
            $stmt->bindParam(':question_text', $question_text);
            $stmt->bindParam(':question_type', $question_type);
            $stmt->bindParam(':options_json', $options_json);
            $stmt->bindParam(':correct_answer', $correct_answer_value);
            $stmt->bindParam(':marks', $marks, PDO::PARAM_STR);

            if ($stmt->execute()) {
                $importedCount++;
            } else {
                $errors[] = "Failed to import question: '{$questionData['question']}'. DB Error.";
            }
        }

        $db->commit(); // Commit transaction

        // Update total_questions in the parent exam
        if ($importedCount > 0) {
            $updateExamQuery = "UPDATE exams SET total_questions = total_questions + :count WHERE id = :exam_id";
            $updateExamStmt = $db->prepare($updateExamQuery);
            $updateExamStmt->bindParam(':count', $importedCount, PDO::PARAM_INT);
            $updateExamStmt->bindParam(':exam_id', $exam_id, PDO::PARAM_INT);
            $updateExamStmt->execute();
        }

        sendJsonResponse([
            'message' => 'Questions imported successfully.',
            'imported_count' => $importedCount,
            'errors' => $errors
        ], 201);

    } catch (PDOException $e) {
        $db->rollBack(); // Rollback on error
        error_log("Questions import error: " . $e->getMessage());
        sendJsonResponse(['message' => 'Error importing questions.', 'details' => $e->getMessage(), 'errors' => $errors], 500);
    }

} else {
    sendJsonResponse(['message' => 'Method Not Allowed.'], 405);
}
?>