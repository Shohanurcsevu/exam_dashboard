<?php
// api/take_exam.php
// File Version: 1.0.3 (Updated with conditional question fetching for 'Custom' exams)
// App Version: 0.0.14

require_once '../utils.php'; // Contains sendJsonResponse function
require_once '../database.php'; // Contains Database class

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    sendJsonResponse(['message' => 'Database connection failed.'], 500);
}

$request_method = $_SERVER["REQUEST_METHOD"];

switch ($request_method) {
    case 'GET':
        // --- Fetch exam details and questions for starting an exam ---
        try {
            if (!isset($_GET['exam_id']) || !is_numeric($_GET['exam_id'])) {
                sendJsonResponse(['message' => 'Exam ID is required.'], 400);
            }

            $exam_id = (int)$_GET['exam_id'];

            // Fetch exam details, including negative_mark_value, total_questions etc.
            // Added 'e.type' to distinguish between regular and custom exams.
            $examQuery = "SELECT e.id, e.title, e.duration_minutes, e.total_marks, e.pass_marks, e.instructions, e.total_questions,
                                 e.negative_mark_value, e.type,
                                 t.name as topic_name,
                                 l.title as lesson_title,
                                 s.name as subject_name
                          FROM exams e
                          LEFT JOIN topics t ON e.topic_id = t.id
                          LEFT JOIN lessons l ON t.lesson_id = l.id
                          LEFT JOIN subjects s ON l.subject_id = s.id
                          WHERE e.id = :exam_id LIMIT 1";
            $examStmt = $db->prepare($examQuery);
            $examStmt->bindParam(':exam_id', $exam_id, PDO::PARAM_INT);
            $examStmt->execute();
            $exam = $examStmt->fetch(PDO::FETCH_ASSOC);

            if (!$exam) {
                sendJsonResponse(['message' => 'Exam not found.'], 404);
            }

            // --- Conditionally fetch questions based on exam type ---
            $questions = [];
            // Assuming 'Custom' is the type value stored for exams created from topics.
            // Adjust 'Custom' if your database uses a different string (e.g., 'topic_based').
            if (isset($exam['type']) && $exam['type'] === 'Custom') {
                // For 'Custom' exams, questions are linked via the 'exam_questions' junction table.
                $questionsQuery = "SELECT q.id, q.question_text, q.question_type, q.options_json, q.marks
                                   FROM questions q
                                   JOIN exam_questions eq ON q.id = eq.question_id
                                   WHERE eq.exam_id = :exam_id
                                   ORDER BY RAND()"; // Shuffles questions
            } else {
                // For 'Regular' or other types, questions have the exam_id directly.
                $questionsQuery = "SELECT id, question_text, question_type, options_json, marks
                                   FROM questions
                                   WHERE exam_id = :exam_id
                                   ORDER BY RAND()"; // Shuffles questions
            }

            $questionsStmt = $db->prepare($questionsQuery);
            $questionsStmt->bindParam(':exam_id', $exam_id, PDO::PARAM_INT);
            $questionsStmt->execute();
            $questions = $questionsStmt->fetchAll(PDO::FETCH_ASSOC);

            // Decode and SHUFFLE options_json for each question
            foreach ($questions as &$question) {
                if (!empty($question['options_json'])) {
                    $options = json_decode($question['options_json'], true);
                    if (is_array($options)) {
                        shuffle($options); // Shuffles options array
                        $question['options_json'] = $options;
                    } else {
                        // Handle case where options_json is not a valid JSON array (e.g., malformed or empty)
                        $question['options_json'] = [];
                    }
                } else {
                    $question['options_json'] = []; // Ensure it's an empty array if no options
                }
            }
            unset($question); // Break the reference to the last element

            sendJsonResponse([
                'exam' => $exam,
                'questions' => $questions
            ]);

        } catch (PDOException $e) {
            error_log("Take Exam GET error: " . $e->getMessage());
            sendJsonResponse(['message' => 'Error fetching exam data.', 'details' => $e->getMessage()], 500);
        }
        break;

    case 'POST':
        // --- Submit user answers for grading and store attempt ---
        $data = json_decode(file_get_contents("php://input"), true); // Decode as associative array

        // Validate incoming data
        if (!isset($data['exam_id']) || !is_numeric($data['exam_id']) || !isset($data['answers']) || !is_array($data['answers'])) {
            sendJsonResponse(['message' => 'Invalid input. Exam ID and answers array are required.'], 400);
        }

        $exam_id = (int)$data['exam_id'];
        $user_answers = $data['answers']; // Array of {question_id: X, selected_option: Y}

        $db->beginTransaction(); // Start a transaction for atomicity

        try {
            // 1. Fetch exam details to get total_marks, pass_marks, and negative_mark_value
            // Added 'type' to the exam query here as well, needed for correct answer fetching in step 2.
            $examQuery = "SELECT total_marks, total_questions, pass_marks, negative_mark_value, type FROM exams WHERE id = :exam_id";
            $examStmt = $db->prepare($examQuery);
            $examStmt->bindParam(':exam_id', $exam_id, PDO::PARAM_INT);
            $examStmt->execute();
            $examDetails = $examStmt->fetch(PDO::FETCH_ASSOC);

            if (!$examDetails) {
                sendJsonResponse(['message' => 'Exam not found for grading.'], 404);
            }

            $examTotalMarks = (float)$examDetails['total_marks'];
            $examPassMarks = (float)$examDetails['pass_marks'];
            $negativeMarkValue = (float)$examDetails['negative_mark_value']; // Fetched negative mark value
            $totalQuestionsInExam = (int)$examDetails['total_questions'];
            $examType = $examDetails['type']; // Get the exam type

            // 2. Get all questions with their correct answers for this exam (needed for grading)
            // Conditional fetching of correct answers based on exam type.
            if (isset($examType) && $examType === 'Custom') {
                 $questionsQuery = "SELECT q.id, q.question_text, q.question_type, q.correct_answer, q.marks
                                    FROM questions q
                                    JOIN exam_questions eq ON q.id = eq.question_id
                                    WHERE eq.exam_id = :exam_id";
            } else {
                 $questionsQuery = "SELECT id, question_text, question_type, correct_answer, marks FROM questions WHERE exam_id = :exam_id";
            }

            $questionsStmt = $db->prepare($questionsQuery);
            $questionsStmt->bindParam(':exam_id', $exam_id, PDO::PARAM_INT);
            $questionsStmt->execute();
            $correctAnswersData = []; // Store question details for grading
            while ($row = $questionsStmt->fetch(PDO::FETCH_ASSOC)) {
                $correctAnswersData[$row['id']] = [
                    'answer' => $row['correct_answer'],
                    'type' => $row['question_type'],
                    'marks' => (float)$row['marks'] // Ensure marks are treated as float
                ];
            }

            $score = 0.0; // Initialize score
            $gradedAnswers = []; // To store full details for the Answers table
            $correct_count = 0;
            $incorrect_count = 0;
            $unanswered_count_from_empty_response = 0; // Counts questions explicitly sent but with empty selected_option
            $question_ids_attempted_by_user = []; // Track which question_ids were present in the user's submitted answers array

            // 3. Grade user answers
            foreach ($user_answers as $userAnswer) {
                $question_id = (int)$userAnswer['question_id'];
                // Ensure selected_option is always a string, even if null/empty
                $selected_option = isset($userAnswer['selected_option']) ? (string)$userAnswer['selected_option'] : '';
                $question_ids_attempted_by_user[] = $question_id;

                if (isset($correctAnswersData[$question_id])) {
                    $correct_answer = $correctAnswersData[$question_id]['answer'];
                    $question_type = $correctAnswersData[$question_id]['type'];
                    $marks_for_this_question = $correctAnswersData[$question_id]['marks'];
                    $status = 'Unanswered'; // Default status

                    // Normalize selected_option for comparison
                    $normalized_selected_option = trim(strtolower($selected_option));
                    $normalized_correct_answer = trim(strtolower($correct_answer));

                    if (!empty($normalized_selected_option)) {
                        if ($question_type === 'multiple_choice' || $question_type === 'true_false') {
                            if ($normalized_selected_option === $normalized_correct_answer) {
                                $status = 'Correct';
                                $score += $marks_for_this_question;
                                $correct_count++;
                            } else {
                                $status = 'Incorrect';
                                $score -= $negativeMarkValue; // Apply negative marking
                                $incorrect_count++;
                            }
                        } elseif ($question_type === 'short_answer') {
                            // For short answer, a simple exact match (case-insensitive)
                            if ($normalized_selected_option === $normalized_correct_answer) {
                                $status = 'Correct';
                                $score += $marks_for_this_question;
                                $correct_count++;
                            } else {
                                $status = 'Incorrect';
                                // Apply negative marking for short answer too, if configured
                                $score -= $negativeMarkValue;
                                $incorrect_count++;
                            }
                        }
                    } else {
                        // Question was explicitly sent in user_answers but left blank/unselected
                        $unanswered_count_from_empty_response++;
                    }

                    // Store details for Answers table
                    $gradedAnswers[] = [
                        'question_id' => $question_id,
                        'selected_option' => $selected_option, // Store original user input
                        'answer_details' => json_encode([
                            'question_id' => $question_id,
                            'user_answer' => $selected_option,
                            'correct_answer' => $correct_answer,
                            'status' => $status,
                            // Store marks awarded/deducted for this specific question
                            'marks_awarded' => ($status === 'Correct' ? $marks_for_this_question : ($status === 'Incorrect' ? -$negativeMarkValue : 0))
                        ])
                    ];
                }
            }

            // Ensure score doesn't go below 0
            $score = max(0, $score);

            // Calculate overall unanswered questions
            // This counts questions that were part of the exam but NOT included in user_answers,
            // PLUS questions included in user_answers but left blank.
            $all_question_ids_in_exam = array_keys($correctAnswersData);
            $truly_unattempted_questions = array_diff($all_question_ids_in_exam, $question_ids_attempted_by_user);
            $final_unanswered_count = count($truly_unattempted_questions) + $unanswered_count_from_empty_response;

            // Calculate total questions actually attempted (answered either correctly or incorrectly)
            $questions_attempted_count = $correct_count + $incorrect_count;

            // Calculate total_percentage
            $total_percentage = 0;
            // Use examTotalMarks from the exam config, not just sum of questions,
            // as examTotalMarks might be set explicitly
            if ($examTotalMarks > 0) {
                $total_percentage = ($score / $examTotalMarks) * 100;
            } else {
                // Fallback: If total_marks in exam config is 0, sum marks of all questions
                // This ensures percentage can still be calculated if examTotalMarks isn't explicitly set.
                $calculatedMaxScore = array_sum(array_column($correctAnswersData, 'marks'));
                if ($calculatedMaxScore > 0) {
                    $total_percentage = ($score / $calculatedMaxScore) * 100;
                }
            }
            // Ensure percentage is not negative
            $total_percentage = max(0, $total_percentage);


            // Determine pass/fail status
            $is_passed = ($score >= $examPassMarks);

            // 4. Determine next attempt number for this exam
            $lastAttemptQuery = "SELECT MAX(attempt_no) as max_attempt FROM attempts WHERE exam_id = :exam_id";
            $lastAttemptStmt = $db->prepare($lastAttemptQuery);
            $lastAttemptStmt->bindParam(':exam_id', $exam_id, PDO::PARAM_INT);
            $lastAttemptStmt->execute();
            $maxAttempt = $lastAttemptStmt->fetch(PDO::FETCH_ASSOC)['max_attempt'];
            $attempt_no = ($maxAttempt !== null) ? $maxAttempt + 1 : 1; // Increment last attempt or start at 1

            // 5. Insert into Attempts table
            $attemptsInsertQuery = "INSERT INTO attempts (exam_id, score, total_percentage, attempt_no, correct_count, incorrect_count, unanswered_count, is_passed)
                                     VALUES (:exam_id, :score, :total_percentage, :attempt_no, :correct_count, :incorrect_count, :unanswered_count, :is_passed)";
            $attemptsStmt = $db->prepare($attemptsInsertQuery);
            $attemptsStmt->bindParam(':exam_id', $exam_id, PDO::PARAM_INT);
            $attemptsStmt->bindParam(':score', $score, PDO::PARAM_STR); // Use PARAM_STR for float/decimal
            $attemptsStmt->bindParam(':total_percentage', $total_percentage, PDO::PARAM_STR); // Use PARAM_STR for float/decimal
            $attemptsStmt->bindParam(':attempt_no', $attempt_no, PDO::PARAM_INT);
            $attemptsStmt->bindParam(':correct_count', $correct_count, PDO::PARAM_INT);
            $attemptsStmt->bindParam(':incorrect_count', $incorrect_count, PDO::PARAM_INT);
            $attemptsStmt->bindParam(':unanswered_count', $final_unanswered_count, PDO::PARAM_INT); // Using final calculated unanswered
            $attemptsStmt->bindParam(':is_passed', $is_passed, PDO::PARAM_BOOL);
            $attemptsStmt->execute();
            $attempt_id = $db->lastInsertId(); // Get the ID of the newly inserted attempt

            // 6. Insert into Answers table for each graded question
            $answersInsertQuery = "INSERT INTO answers (attempt_id, question_id, selected_option, answer_details)
                                     VALUES (:attempt_id, :question_id, :selected_option, :answer_details)";
            $answersStmt = $db->prepare($answersInsertQuery);

            foreach ($gradedAnswers as $answer) {
                // Ensure attempt_id is always available for binding
                $answersStmt->bindParam(':attempt_id', $attempt_id, PDO::PARAM_INT);
                $answersStmt->bindParam(':question_id', $answer['question_id'], PDO::PARAM_INT);
                $answersStmt->bindParam(':selected_option', $answer['selected_option']);
                $answersStmt->bindParam(':answer_details', $answer['answer_details']);
                $answersStmt->execute();
            }

            $db->commit(); // Commit all changes if everything was successful

            // Send success response back to the frontend
            sendJsonResponse([
                'message' => 'Exam attempt recorded successfully.',
                'attempt_id' => $attempt_id,
                'score' => $score,
                'total_percentage' => $total_percentage,
                'attempt_no' => $attempt_no,
                'correct_count' => $correct_count,
                'incorrect_count' => $incorrect_count,
                'unanswered_count' => $final_unanswered_count, // Send the final overall unanswered count
                'is_passed' => $is_passed,
                'total_questions_in_exam' => $totalQuestionsInExam,
                'questions_attempted' => $questions_attempted_count // Count of questions user actually provided an answer for (correct/incorrect)
            ], 200);

        } catch (PDOException $e) {
            $db->rollBack(); // Rollback changes if any error occurred
            error_log("Take Exam POST error: " . $e->getMessage()); // Log the detailed error
            sendJsonResponse(['message' => 'Error submitting exam attempt.', 'details' => $e->getMessage()], 500);
        }
        break;

    default:
        // Handle unsupported request methods
        sendJsonResponse(['message' => 'Method Not Allowed.'], 405);
        break;
}