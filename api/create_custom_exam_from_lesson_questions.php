<?php
// api/create_custom_exam_from_lesson_questions.php
// This endpoint creates a new custom exam by randomly selecting a specified number of questions
// from various lessons and LINKING them to the new exam via the exam_questions pivot table.

require_once '../utils.php';
require_once '../database.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    sendJsonResponse(['success' => false, 'message' => 'Database connection failed.'], 500);
    exit();
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $data = json_decode(file_get_contents("php://input"));

    // Basic validation
    if (
        empty($data->title) ||
        !isset($data->duration_minutes) ||
        !isset($data->total_marks) ||
        !isset($data->pass_marks) ||
        !isset($data->negative_mark_value) || // Can be 0
        !isset($data->lesson_question_requests) || !is_array($data->lesson_question_requests) || count($data->lesson_question_requests) === 0
    ) {
        sendJsonResponse(['success' => false, 'message' => 'Missing required exam details or lesson question requests.'], 400);
        exit();
    }

    $title = htmlspecialchars(strip_tags($data->title));
    $duration_minutes = (int)$data->duration_minutes;
    $total_marks = (float)$data->total_marks;
    $pass_marks = (float)$data->pass_marks;
    $instructions = isset($data->instructions) ? htmlspecialchars(strip_tags($data->instructions)) : null;
    $negative_mark_value = isset($data->negative_mark_value) ? (float)$data->negative_mark_value : 0.00;
    $lesson_question_requests = $data->lesson_question_requests;
    $type = isset($data->type) ? htmlspecialchars(strip_tags($data->type)) : 'Custom'; // Should be 'Custom'

    $total_questions_linked = 0; // Will count actual linked questions

    $db->beginTransaction(); // Start transaction for atomicity of exam and question linking

    try {
        // 1. Insert the new custom exam record into the 'exams' table
        //    Set total_questions to 0 temporarily, update it later.
        $insertExamQuery = "INSERT INTO exams (topic_id, lesson_id, subject_id, title, duration_minutes, total_marks, pass_marks, instructions, total_questions, negative_mark_value, type)
                            VALUES (:topic_id, :lesson_id, :subject_id, :title, :duration_minutes, :total_marks, :pass_marks, :instructions, :total_questions, :negative_mark_value, :type)";
        $stmt = $db->prepare($insertExamQuery);

        $new_exam_topic_id = null; // Custom exams don't belong to a single topic/lesson/subject directly
        $new_exam_lesson_id = null;
        $new_exam_subject_id = null;
        $temp_total_questions = 0; // Placeholder

        $stmt->bindParam(':topic_id', $new_exam_topic_id, PDO::PARAM_INT);
        $stmt->bindParam(':lesson_id', $new_exam_lesson_id, PDO::PARAM_INT);
        $stmt->bindParam(':subject_id', $new_exam_subject_id, PDO::PARAM_INT);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':duration_minutes', $duration_minutes);
        $stmt->bindParam(':total_marks', $total_marks);
        $stmt->bindParam(':pass_marks', $pass_marks);
        $stmt->bindParam(':instructions', $instructions);
        $stmt->bindParam(':total_questions', $temp_total_questions, PDO::PARAM_INT);
        $stmt->bindParam(':negative_mark_value', $negative_mark_value);
        $stmt->bindParam(':type', $type);

        $stmt->execute();
        $new_exam_id = $db->lastInsertId();

        if (!$new_exam_id) {
            throw new Exception("Failed to insert exam record into 'exams' table.");
        }

        // Prepare statement for inserting into the exam_questions pivot table
        $insertPivotQuery = "INSERT INTO exam_questions (exam_id, question_id, order_in_exam) VALUES (:exam_id, :question_id, :order_in_exam)";
        $insertPivotStmt = $db->prepare($insertPivotQuery);

        $current_order = 1; // Start ordering questions from 1 for this exam

        // 2. Select random questions for each requested lesson and LINK them
        foreach ($lesson_question_requests as $request) {
            $lesson_id = (int)$request->lesson_id;
            $num_questions = (int)$request->num_questions;

            if ($num_questions <= 0) {
                continue; // Skip if no questions requested for this lesson
            }

            // Select random question IDs from the lesson (only fetching IDs is enough)
            $selectQuestionIdsQuery = "SELECT id FROM questions WHERE lesson_id = :lesson_id ORDER BY RAND() LIMIT :num_questions";
            $selectIdsStmt = $db->prepare($selectQuestionIdsQuery);
            $selectIdsStmt->bindParam(':lesson_id', $lesson_id, PDO::PARAM_INT);
            $selectIdsStmt->bindParam(':num_questions', $num_questions, PDO::PARAM_INT);
            $selectIdsStmt->execute();
            $question_ids_from_lesson = $selectIdsStmt->fetchAll(PDO::FETCH_COLUMN, 0); // Fetches only the 'id' column

            // Link each selected question ID to the new exam in the exam_questions table
            foreach ($question_ids_from_lesson as $question_id) {
                $insertPivotStmt->bindParam(':exam_id', $new_exam_id, PDO::PARAM_INT);
                $insertPivotStmt->bindParam(':question_id', $question_id, PDO::PARAM_INT);
                $insertPivotStmt->bindParam(':order_in_exam', $current_order, PDO::PARAM_INT);
                $insertPivotStmt->execute();
                $current_order++; // Increment order for the next question
                $total_questions_linked++; // Count total questions successfully linked
            }
        }

        if ($total_questions_linked === 0) {
            $db->rollBack(); // No questions linked, so rollback the exam creation too
            sendJsonResponse(['success' => false, 'message' => 'No questions could be added to the custom exam from the selected lessons. Exam not created.'], 400);
            exit();
        }

        // 3. Update the total_questions in the new exam record in the 'exams' table
        $updateTotalQuestionsQuery = "UPDATE exams SET total_questions = :total_questions WHERE id = :exam_id";
        $updateStmt = $db->prepare($updateTotalQuestionsQuery);
        $updateStmt->bindParam(':total_questions', $total_questions_linked, PDO::PARAM_INT);
        $updateStmt->bindParam(':exam_id', $new_exam_id, PDO::PARAM_INT);
        $updateStmt->execute();

        $db->commit(); // Commit all changes

        sendJsonResponse(['success' => true, 'message' => 'Custom exam created successfully.', 'id' => $new_exam_id, 'total_questions_linked' => $total_questions_linked], 201);

    } catch (PDOException $e) {
        $db->rollBack();
        error_log("Error creating custom exam from lessons (PDOException): " . $e->getMessage());
        sendJsonResponse(['success' => false, 'message' => 'Error creating custom exam (database issue).', 'details' => $e->getMessage()], 500);
    } catch (Exception $e) {
        $db->rollBack();
        error_log("Error creating custom exam (General Exception): " . $e->getMessage());
        sendJsonResponse(['success' => false, 'message' => 'Error creating custom exam (general issue).', 'details' => $e->getMessage()], 500);
    }
} else {
    sendJsonResponse(['success' => false, 'message' => 'Method Not Allowed.'], 405);
}
?>