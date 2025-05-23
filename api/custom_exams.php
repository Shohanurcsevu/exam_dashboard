<?php
// api/custom_exams.php
// File Version: 1.0.1 (Updated with Total Marks and Pass Marks)
// App Version: 0.0.14

require_once '../utils.php';
require_once '../database.php';

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    sendJsonResponse(['message' => 'Database connection failed.'], 500);
}

$request_method = $_SERVER["REQUEST_METHOD"];

switch ($request_method) {
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);

        // 1. Validate incoming data
        if (
            !isset($data['title']) || empty($data['title']) ||
            !isset($data['duration_minutes']) || !is_numeric($data['duration_minutes']) || $data['duration_minutes'] <= 0 ||
            !isset($data['topic_id']) || !is_numeric($data['topic_id']) || $data['topic_id'] <= 0 ||
            !isset($data['selected_exams']) || !is_array($data['selected_exams']) || empty($data['selected_exams']) ||
            // --- NEW: Validate Total Marks and Pass Marks ---
            !isset($data['total_marks']) || !is_numeric($data['total_marks']) || $data['total_marks'] <= 0 ||
            !isset($data['pass_marks']) || !is_numeric($data['pass_marks']) || $data['pass_marks'] < 0
        ) {
            sendJsonResponse(['message' => 'Invalid input for custom exam creation. Missing required fields or invalid data.'], 400);
        }

        $custom_exam_title = htmlspecialchars(strip_tags($data['title']));
        $custom_exam_duration = (int)$data['duration_minutes'];
        $selected_topic_id = (int)$data['topic_id'];
        $selected_exams_details = $data['selected_exams']; // Array of {exam_id: X, num_questions: Y}
        // --- NEW: Get Total Marks and Pass Marks from payload ---
        $custom_exam_total_marks = (float)$data['total_marks'];
        $custom_exam_pass_marks = (float)$data['pass_marks'];

        // Additional server-side validation for marks
        if ($custom_exam_pass_marks > $custom_exam_total_marks) {
            sendJsonResponse(['message' => 'Pass Marks cannot be greater than Total Marks.'], 400);
        }


        $db->beginTransaction(); // Start transaction for atomicity

        try {
            // Check if topic_id exists
            $checkTopicQuery = "SELECT id FROM topics WHERE id = :topic_id LIMIT 1";
            $checkTopicStmt = $db->prepare($checkTopicQuery);
            $checkTopicStmt->bindParam(':topic_id', $selected_topic_id, PDO::PARAM_INT);
            $checkTopicStmt->execute();
            if ($checkTopicStmt->rowCount() === 0) {
                sendJsonResponse(['message' => 'Invalid Topic ID provided for custom exam.'], 400);
                $db->rollBack(); // Rollback if topic is invalid
            }

            $total_questions_for_custom_exam = 0;
            // The marks calculation below is now *supplemental* to the user-provided marks,
            // or can be used if you decide to *override* the user's input with calculated marks.
            // For now, we'll use the user's input for total_marks and pass_marks.
            $calculated_total_marks_from_questions = 0.0; // Keep this for internal verification if needed
            $negative_mark_value = 0.50; // Hardcode negative marking for custom exams too

            // 2. Create the new custom exam entry in the 'exams' table
            // We now use the user-provided total_marks and pass_marks
            $insertExamQuery = "INSERT INTO exams (topic_id, title, duration_minutes, total_marks, pass_marks, instructions, total_questions, negative_mark_value)
                                 VALUES (:topic_id, :title, :duration_minutes, :total_marks, :pass_marks, :instructions, :total_questions, :negative_mark_value)";
            $insertExamStmt = $db->prepare($insertExamQuery);

            $instructions = "This is a custom exam generated from selected existing exams."; // Default instructions

            $insertExamStmt->bindParam(':topic_id', $selected_topic_id, PDO::PARAM_INT);
            $insertExamStmt->bindParam(':title', $custom_exam_title, PDO::PARAM_STR);
            $insertExamStmt->bindParam(':duration_minutes', $custom_exam_duration, PDO::PARAM_INT);
            // --- NEW: Bind user-provided Total Marks and Pass Marks ---
            $insertExamStmt->bindParam(':total_marks', $custom_exam_total_marks, PDO::PARAM_STR); // Use PARAM_STR for float/decimal
            $insertExamStmt->bindParam(':pass_marks', $custom_exam_pass_marks, PDO::PARAM_STR); // Use PARAM_STR for float/decimal
            $insertExamStmt->bindParam(':instructions', $instructions, PDO::PARAM_STR);
            $insertExamStmt->bindParam(':total_questions', $total_questions_for_custom_exam, PDO::PARAM_INT); // This will be updated later
            $insertExamStmt->bindParam(':negative_mark_value', $negative_mark_value, PDO::PARAM_STR);

            if (!$insertExamStmt->execute()) {
                throw new Exception("Failed to create custom exam record.");
            }
            $new_exam_id = $db->lastInsertId();

            // 3. Select and copy questions from source exams
            foreach ($selected_exams_details as $exam_selection) {
                $source_exam_id = (int)$exam_selection['exam_id'];
                $num_questions_to_copy = (int)$exam_selection['num_questions'];

                if ($num_questions_to_copy <= 0) continue; // Skip if no questions requested from this exam

                // Fetch random questions from the source exam
                $fetchQuestionsQuery = "SELECT question_text, question_type, options_json, correct_answer, marks
                                         FROM questions
                                         WHERE exam_id = :source_exam_id
                                         ORDER BY RAND()
                                         LIMIT :num_questions";
                $fetchQuestionsStmt = $db->prepare($fetchQuestionsQuery);
                $fetchQuestionsStmt->bindParam(':source_exam_id', $source_exam_id, PDO::PARAM_INT);
                $fetchQuestionsStmt->bindParam(':num_questions', $num_questions_to_copy, PDO::PARAM_INT);
                $fetchQuestionsStmt->execute();
                $questions_to_copy = $fetchQuestionsStmt->fetchAll(PDO::FETCH_ASSOC);

                if (count($questions_to_copy) < $num_questions_to_copy) {
                    error_log("Warning: Requested {$num_questions_to_copy} questions from exam {$source_exam_id}, but only " . count($questions_to_copy) . " were found.");
                }

                // Insert copied questions into the 'questions' table, linked to the NEW custom exam
                $insertQuestionQuery = "INSERT INTO questions (exam_id, question_text, question_type, options_json, correct_answer, marks)
                                         VALUES (:new_exam_id, :question_text, :question_type, :options_json, :correct_answer, :marks)";
                $insertQuestionStmt = $db->prepare($insertQuestionQuery);

                foreach ($questions_to_copy as $question) {
                    $q_options_json = $question['options_json'] ?? null;
                    $q_correct_answer = $question['correct_answer'] ?? null;

                    $insertQuestionStmt->bindParam(':new_exam_id', $new_exam_id, PDO::PARAM_INT);
                    $insertQuestionStmt->bindParam(':question_text', $question['question_text'], PDO::PARAM_STR);
                    $insertQuestionStmt->bindParam(':question_type', $question['question_type'], PDO::PARAM_STR);
                    $insertQuestionStmt->bindParam(':options_json', $q_options_json, PDO::PARAM_STR);
                    $insertQuestionStmt->bindParam(':correct_answer', $q_correct_answer, PDO::PARAM_STR);
                    $insertQuestionStmt->bindParam(':marks', $question['marks'], PDO::PARAM_STR);

                    if (!$insertQuestionStmt->execute()) {
                        throw new Exception("Failed to copy question for custom exam.");
                    }
                    $total_questions_for_custom_exam++;
                    $calculated_total_marks_from_questions += (float)$question['marks'];
                }
            }

            // 4. Update the newly created custom exam's total_questions
            // total_marks and pass_marks are now *not* updated here, as they are provided by the user.
            // If you wanted to *force* total_marks to be the sum of question marks, you'd uncomment the lines below.
            // $custom_exam_total_marks = $calculated_total_marks_from_questions;
            // $custom_exam_pass_marks = $custom_exam_total_marks * 0.5; // Or whatever logic you prefer if overriding

            $updateExamQuery = "UPDATE exams
                                 SET total_questions = :total_questions
                                 WHERE id = :exam_id";
            $updateExamStmt = $db->prepare($updateExamQuery);
            $updateExamStmt->bindParam(':total_questions', $total_questions_for_custom_exam, PDO::PARAM_INT);
            $updateExamStmt->bindParam(':exam_id', $new_exam_id, PDO::PARAM_INT);

            if (!$updateExamStmt->execute()) {
                throw new Exception("Failed to update custom exam's question count.");
            }

            $db->commit(); // Commit all changes

            sendJsonResponse([
                'message' => 'Custom exam created successfully!',
                'exam_id' => $new_exam_id,
                'total_questions' => $total_questions_for_custom_exam,
                'total_marks' => $custom_exam_total_marks, // Sending back user-provided marks
                'pass_marks' => $custom_exam_pass_marks    // Sending back user-provided marks
            ], 201);

        } catch (Exception $e) {
            $db->rollBack(); // Rollback on error
            error_log("Custom Exam POST error: " . $e->getMessage());
            sendJsonResponse(['message' => 'Error creating custom exam.', 'details' => $e->getMessage()], 500);
        }
        break;

    default:
        sendJsonResponse(['message' => 'Method Not Allowed.'], 405);
        break;
}