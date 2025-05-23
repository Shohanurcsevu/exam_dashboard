<?php
// api/create_custom_exam_from_lessons.php
// File Version: 1.0.1 (Corrected logic for linking questions via exam_questions table)
// App Version: 0.0.17

require_once '../utils.php';
require_once '../database.php';

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    sendJsonResponse(['message' => 'Database connection failed.'], 500);
}

$request_method = $_SERVER["REQUEST_METHOD"];

if ($request_method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    // 1. Validate incoming exam details
    $examTitle = trim($data['exam_title'] ?? '');
    $durationMinutes = filter_var($data['duration_minutes'] ?? null, FILTER_VALIDATE_INT);
    $totalMarks = filter_var($data['total_marks'] ?? null, FILTER_VALIDATE_FLOAT);
    $passMarks = filter_var($data['pass_marks'] ?? null, FILTER_VALIDATE_FLOAT);
    $instructions = trim($data['instructions'] ?? '');
    $negativeMarkValue = filter_var($data['negative_mark_value'] ?? 0.0, FILTER_VALIDATE_FLOAT, ['options' => ['min_range' => 0]]);
    $selectedLessons = $data['selected_lessons'] ?? []; // Array of { lesson_id: int, num_questions: int }
    $overallSubjectId = filter_var($data['subject_id'] ?? null, FILTER_VALIDATE_INT); // The subject ID chosen by the user

    if (empty($examTitle) || $durationMinutes === false || $totalMarks === false || $passMarks === false || !is_array($selectedLessons) || empty($selectedLessons) || $overallSubjectId === false) {
        sendJsonResponse(['message' => 'Missing or invalid exam details or selected lessons.', 'errors' => $data], 400);
    }

    $db->beginTransaction();
    try {
        // 2. Calculate total questions for the custom exam from selected lessons
        $totalQuestionsForExam = 0;
        $lessonsToProcess = [];
        foreach ($selectedLessons as $lesson) {
            $lessonId = filter_var($lesson['lesson_id'] ?? null, FILTER_VALIDATE_INT);
            $numQuestions = filter_var($lesson['num_questions'] ?? null, FILTER_VALIDATE_INT);

            if ($lessonId === false || $numQuestions === false || $numQuestions < 0) {
                $db->rollBack();
                sendJsonResponse(['message' => 'Invalid lesson selection data.'], 400);
            }
            if ($numQuestions > 0) {
                $totalQuestionsForExam += $numQuestions;
                $lessonsToProcess[] = ['lesson_id' => $lessonId, 'num_questions' => $numQuestions];
            }
        }

        if ($totalQuestionsForExam === 0) {
            $db->rollBack();
            sendJsonResponse(['message' => 'No questions selected for the exam.'], 400);
        }

        // 3. Create a new entry in the 'exams' table
        // For a custom exam from lessons, lesson_id and topic_id are typically NULL
        $insertExamQuery = "INSERT INTO exams (
                                subject_id,
                                lesson_id,    -- Set to NULL for custom exams from lessons
                                topic_id,     -- Set to NULL for custom exams from lessons
                                title,
                                duration_minutes,
                                total_marks,
                                pass_marks,
                                instructions,
                                total_questions,
                                type,
                                negative_mark_value
                            ) VALUES (
                                :subject_id,
                                NULL,         -- lesson_id is NULL
                                NULL,         -- topic_id is NULL
                                :title,
                                :duration_minutes,
                                :total_marks,
                                :pass_marks,
                                :instructions,
                                :total_questions,
                                'Custom',
                                :negative_mark_value
                            )";
        $examStmt = $db->prepare($insertExamQuery);

        $examStmt->bindParam(':subject_id', $overallSubjectId, PDO::PARAM_INT);
        $examStmt->bindParam(':title', $examTitle);
        $examStmt->bindParam(':duration_minutes', $durationMinutes, PDO::PARAM_INT);
        $examStmt->bindParam(':total_marks', $totalMarks, PDO::PARAM_STR); // Use STR for FLOAT/DECIMAL
        $examStmt->bindParam(':pass_marks', $passMarks, PDO::PARAM_STR);
        $examStmt->bindParam(':instructions', $instructions);
        $examStmt->bindParam(':total_questions', $totalQuestionsForExam, PDO::PARAM_INT);
        $examStmt->bindParam(':negative_mark_value', $negativeMarkValue, PDO::PARAM_STR);

        $examStmt->execute();
        $newExamId = $db->lastInsertId();

        if (!$newExamId) {
            throw new Exception("Failed to create exam entry.");
        }

        // 4. Randomly select questions from the specified lessons and link them to the new exam
        $questionsLinkedCount = 0;
        $allSelectedQuestionIds = []; // To store all unique question IDs selected for this exam

        foreach ($lessonsToProcess as $lessonData) {
            $lessonId = $lessonData['lesson_id'];
            $numQuestions = $lessonData['num_questions'];

            if ($numQuestions > 0) {
                // Select random questions from the current lesson
                $selectQuestionsQuery = "SELECT id
                                         FROM questions
                                         WHERE lesson_id = :lesson_id
                                         ORDER BY RAND()
                                         LIMIT :num_questions";
                $selectQuesStmt = $db->prepare($selectQuestionsQuery);
                $selectQuesStmt->bindParam(':lesson_id', $lessonId, PDO::PARAM_INT);
                $selectQuesStmt->bindParam(':num_questions', $numQuestions, PDO::PARAM_INT);
                $selectQuesStmt->execute();
                $questionIds = $selectQuesStmt->fetchAll(PDO::FETCH_COLUMN); // Fetches just the IDs

                foreach ($questionIds as $qId) {
                    $allSelectedQuestionIds[] = $qId;
                }
            }
        }
        
        // Ensure no duplicate questions if by chance RAND() selected same question multiple times
        // (though unlikely with WHERE lesson_id and LIMIT, good for robustness)
        $allSelectedQuestionIds = array_unique($allSelectedQuestionIds);

        // Check if the number of collected questions matches the expected total
        if (count($allSelectedQuestionIds) !== $totalQuestionsForExam) {
            // This can happen if a lesson has fewer questions than requested for that lesson.
            // Adjust total_questions in the exams table if fewer questions were actually found.
            // Alternatively, throw an error if you want strict adherence.
            error_log("Warning: Mismatch in expected vs actual linked questions. Expected: {$totalQuestionsForExam}, Linked: " . count($allSelectedQuestionIds) . ". Exam ID: {$newExamId}");
            
            // Update total_questions in exams table to reflect actual questions linked
            $updateExamTotalQuestionsStmt = $db->prepare("UPDATE exams SET total_questions = :actual_total_questions WHERE id = :exam_id");
            $actualLinkedCount = count($allSelectedQuestionIds);
            $updateExamTotalQuestionsStmt->bindParam(':actual_total_questions', $actualLinkedCount, PDO::PARAM_INT);
            $updateExamTotalQuestionsStmt->bindParam(':exam_id', $newExamId, PDO::PARAM_INT);
            $updateExamTotalQuestionsStmt->execute();
            $totalQuestionsForExam = $actualLinkedCount; // Update for the response
        }

        // 5. Insert entries into the 'exam_questions' pivot table
        if (!empty($allSelectedQuestionIds)) {
            $insertExamQuestionsQuery = "INSERT INTO exam_questions (exam_id, question_id) VALUES (:exam_id, :question_id)";
            $insertExamQuesStmt = $db->prepare($insertExamQuestionsQuery);
            $questionsLinkedCount = 0; // Reset for actual count of inserts

            foreach ($allSelectedQuestionIds as $questionId) {
                $insertExamQuesStmt->bindParam(':exam_id', $newExamId, PDO::PARAM_INT);
                $insertExamQuesStmt->bindParam(':question_id', $questionId, PDO::PARAM_INT);
                $insertExamQuesStmt->execute();
                $questionsLinkedCount++;
            }
        }

        $db->commit();
        sendJsonResponse([
            'message' => 'Custom exam created successfully and questions linked.',
            'exam_id' => $newExamId,
            'total_questions_expected' => $totalQuestionsForExam, // This now reflects actual linked count if adjusted
            'questions_linked' => $questionsLinkedCount
        ], 201);

    } catch (PDOException $e) {
        $db->rollBack();
        error_log("Custom exam creation error: " . $e->getMessage());
        sendJsonResponse(['message' => 'Error creating custom exam.', 'details' => $e->getMessage()], 500);
    } catch (Exception $e) {
        $db->rollBack();
        error_log("General error creating custom exam: " . $e->getMessage());
        sendJsonResponse(['message' => 'An unexpected error occurred.', 'details' => $e->getMessage()], 500);
    }

} else {
    sendJsonResponse(['message' => 'Method Not Allowed.'], 405);
}
?>