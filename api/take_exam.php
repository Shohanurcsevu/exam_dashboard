<?php
// api/take_exam.php
// File Version: 1.0.0
// App Version: 0.0.12

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
        // Fetch exam details and questions (for starting an exam)
        try {
            if (!isset($_GET['exam_id']) || !is_numeric($_GET['exam_id'])) {
                sendJsonResponse(['message' => 'Exam ID is required.'], 400);
            }

            $exam_id = (int)$_GET['exam_id'];

            // Fetch exam details
            $examQuery = "SELECT e.id, e.title, e.duration_minutes, e.total_marks, e.pass_marks, e.instructions, e.total_questions,
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

            // Fetch questions for the exam (without correct answers)
            $questionsQuery = "SELECT id, question_text, question_type, options_json, marks
                               FROM questions
                               WHERE exam_id = :exam_id
                               ORDER BY id ASC"; // Or RAND() for shuffled questions
            $questionsStmt = $db->prepare($questionsQuery);
            $questionsStmt->bindParam(':exam_id', $exam_id, PDO::PARAM_INT);
            $questionsStmt->execute();
            $questions = $questionsStmt->fetchAll(PDO::FETCH_ASSOC);

            // Decode options_json for each question
            foreach ($questions as &$question) {
                if (!empty($question['options_json'])) {
                    $question['options_json'] = json_decode($question['options_json'], true);
                } else {
                    $question['options_json'] = null;
                }
            }
            unset($question); // Break the reference

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
        // Submit user answers for grading and store attempt
        $data = json_decode(file_get_contents("php://input"), true); // Decode as associative array

        if (!isset($data['exam_id']) || !is_numeric($data['exam_id']) || !isset($data['answers']) || !is_array($data['answers'])) {
            sendJsonResponse(['message' => 'Invalid input. Exam ID and answers array are required.'], 400);
        }

        $exam_id = (int)$data['exam_id'];
        $user_answers = $data['answers']; // Array of {question_id: X, selected_option: Y}

        $db->beginTransaction();
        try {
            // 1. Fetch exam details to get total_marks
            $examQuery = "SELECT total_marks, total_questions FROM exams WHERE id = :exam_id";
            $examStmt = $db->prepare($examQuery);
            $examStmt->bindParam(':exam_id', $exam_id, PDO::PARAM_INT);
            $examStmt->execute();
            $examDetails = $examStmt->fetch(PDO::FETCH_ASSOC);

            if (!$examDetails) {
                sendJsonResponse(['message' => 'Exam not found for grading.'], 404);
            }

            $examTotalMarks = $examDetails['total_marks'];

            // 2. Get all questions with their correct answers for this exam
            $questionsQuery = "SELECT id, question_type, correct_answer, marks FROM questions WHERE exam_id = :exam_id";
            $questionsStmt = $db->prepare($questionsQuery);
            $questionsStmt->bindParam(':exam_id', $exam_id, PDO::PARAM_INT);
            $questionsStmt->execute();
            $correctAnswers = [];
            $questionMarks = [];
            while ($row = $questionsStmt->fetch(PDO::FETCH_ASSOC)) {
                $correctAnswers[$row['id']] = [
                    'answer' => $row['correct_answer'],
                    'type' => $row['question_type']
                ];
                $questionMarks[$row['id']] = $row['marks'];
            }

            $score = 0;
            $gradedAnswers = []; // To store full details for the Answers table
            $attemptedQuestionCount = 0;

            // 3. Grade user answers
            foreach ($user_answers as $userAnswer) {
                $question_id = (int)$userAnswer['question_id'];
                $selected_option = isset($userAnswer['selected_option']) ? $userAnswer['selected_option'] : null;

                if (isset($correctAnswers[$question_id])) {
                    $attemptedQuestionCount++;
                    $correct_answer = $correctAnswers[$question_id]['answer'];
                    $question_type = $correctAnswers[$question_id]['type'];
                    $marks_for_this_question = $questionMarks[$question_id];
                    $status = 'Incorrect'; // Default status

                    if ($question_type === 'multiple_choice' || $question_type === 'true_false') {
                        if (trim(strtolower($selected_option)) === trim(strtolower($correct_answer))) {
                            $status = 'Correct';
                            $score += $marks_for_this_question;
                        }
                    } elseif ($question_type === 'short_answer') {
                        // For short answer, a simple exact match (case-insensitive) for now.
                        // Can be extended with more sophisticated matching (e.g., Levenshtein distance)
                        if (trim(strtolower($selected_option)) === trim(strtolower($correct_answer))) {
                            $status = 'Correct';
                            $score += $marks_for_this_question;
                        }
                    }

                    // Store details for Answers table
                    $gradedAnswers[] = [
                        'question_id' => $question_id,
                        'selected_option' => $selected_option,
                        'answer_details' => json_encode([
                            'question_id' => $question_id,
                            'user_answer' => $selected_option,
                            'correct_answer' => $correct_answer,
                            'status' => $status
                        ])
                    ];
                }
            }

            // Calculate total_percentage
            $total_percentage = 0;
            if ($examTotalMarks > 0) {
                $total_percentage = ($score / $examTotalMarks) * 100;
            } else {
                // If total_marks is 0 (e.g., just for practice), and user attempts questions,
                // we can calculate based on marks obtained vs max possible for attempted questions.
                // Or, if no marks, percentage is always 0.
                // For now, let's keep it simple: if examTotalMarks is 0, percentage is 0.
                // This might need adjustment based on business logic.
            }

            // 4. Determine next attempt number
            $lastAttemptQuery = "SELECT MAX(attempt_no) as max_attempt FROM attempts WHERE exam_id = :exam_id";
            $lastAttemptStmt = $db->prepare($lastAttemptQuery);
            $lastAttemptStmt->bindParam(':exam_id', $exam_id, PDO::PARAM_INT);
            $lastAttemptStmt->execute();
            $maxAttempt = $lastAttemptStmt->fetch(PDO::FETCH_ASSOC)['max_attempt'];
            $attempt_no = ($maxAttempt !== null) ? $maxAttempt + 1 : 1;

            // 5. Insert into Attempts table
            $attemptsInsertQuery = "INSERT INTO attempts (exam_id, score, total_percentage, attempt_no)
                                    VALUES (:exam_id, :score, :total_percentage, :attempt_no)";
            $attemptsStmt = $db->prepare($attemptsInsertQuery);
            $attemptsStmt->bindParam(':exam_id', $exam_id, PDO::PARAM_INT);
            $attemptsStmt->bindParam(':score', $score, PDO::PARAM_STR);
            $attemptsStmt->bindParam(':total_percentage', $total_percentage, PDO::PARAM_STR);
            $attemptsStmt->bindParam(':attempt_no', $attempt_no, PDO::PARAM_INT);
            $attemptsStmt->execute();
            $attempt_id = $db->lastInsertId();

            // 6. Insert into Answers table
            $answersInsertQuery = "INSERT INTO answers (attempt_id, question_id, selected_option, answer_details)
                                   VALUES (:attempt_id, :question_id, :selected_option, :answer_details)";
            $answersStmt = $db->prepare($answersInsertQuery);

            foreach ($gradedAnswers as $answer) {
                $answersStmt->bindParam(':attempt_id', $attempt_id, PDO::PARAM_INT);
                $answersStmt->bindParam(':question_id', $answer['question_id'], PDO::PARAM_INT);
                $answersStmt->bindParam(':selected_option', $answer['selected_option']);
                $answersStmt->bindParam(':answer_details', $answer['answer_details']);
                $answersStmt->execute();
            }

            $db->commit(); // Commit all changes

            sendJsonResponse([
                'message' => 'Exam attempt recorded successfully.',
                'attempt_id' => $attempt_id,
                'score' => $score,
                'total_percentage' => $total_percentage,
                'attempt_no' => $attempt_no,
                'total_questions_in_exam' => $examDetails['total_questions'],
                'questions_attempted' => $attemptedQuestionCount
            ], 200);

        } catch (PDOException $e) {
            $db->rollBack();
            error_log("Take Exam POST error: " . $e->getMessage());
            sendJsonResponse(['message' => 'Error submitting exam attempt.', 'details' => $e->getMessage()], 500);
        }
        break;

    default:
        sendJsonResponse(['message' => 'Method Not Allowed.'], 405);
        break;
}
?>