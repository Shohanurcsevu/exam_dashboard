<?php
// review_exam.php
// API endpoint to fetch details of a specific exam attempt for review.
// Requires attempt_id.

header('Content-Type: application/json');

require_once '../utils.php';
require_once '../database.php'; // This includes your Database class

// Instantiate Database class and get connection
$database = new Database();
$db = $database->getConnection(); // Get the PDO connection object

// Check if the database connection was successful
if (!$db) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed. Check your database.php configuration.'
    ]);
    exit(); // Stop execution if no connection
}

// Get ID from URL
$attempt_id = isset($_GET['id']) ? $_GET['id'] : die(json_encode(['message' => 'No attempt ID provided.']));

// Fetch attempt details (first query - this part is now correct)
$query = "
    SELECT
        a.id AS attempt_id,
        a.exam_id,
        e.title AS exam_title,
        a.score,
        e.total_questions,   -- ADD THIS LINE: Fetch total_questions from the exams table
        a.total_percentage,
        a.attempt_no,
        a.created_at
    FROM
        attempts a
    JOIN
        exams e ON a.exam_id = e.id
    WHERE
        a.id = :attempt_id
";

try {
    $stmt = $db->prepare($query);
    $stmt->bindParam(':attempt_id', $attempt_id);
    $stmt->execute();

    $attemptDetails = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($attemptDetails) {
        // Fetch questions and answers for this attempt
        // UPDATED: Use 'answers' table and get necessary columns for review
        $questionsQuery = "
            SELECT
                ans.question_id,
                q.question_text,
                ans.selected_option AS user_answer,  -- Get the user's answer from the 'answers' table
                q.correct_answer,                    -- Get the correct answer from the 'questions' table
                q.options_json                       -- Get the options (for multiple choice) from 'questions' table
            FROM
                answers ans                         -- Use the 'answers' table, aliased as 'ans'
            JOIN
                questions q ON ans.question_id = q.id  -- Join with 'questions' table on 'questions.id'
            WHERE
                ans.attempt_id = :attempt_id        -- Filter by attempt_id from 'answers' table
            ORDER BY
                ans.question_id
        ";
        $questionsStmt = $db->prepare($questionsQuery);
        $questionsStmt->bindParam(':attempt_id', $attempt_id);
        $questionsStmt->execute();
        $attemptQuestions = $questionsStmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate 'is_correct' for each question, as it's not stored directly in 'answers' table
        foreach ($attemptQuestions as &$q_data) {
            // Basic comparison: Convert both to lowercase and trim for robust comparison
            $q_data['is_correct'] = (
                strtolower(trim($q_data['user_answer'])) === strtolower(trim($q_data['correct_answer']))
            );

            // You might want to decode options_json if it's a JSON string
            if (!empty($q_data['options_json'])) {
                $q_data['options'] = json_decode($q_data['options_json'], true);
                // Optionally unset the raw JSON string if not needed on frontend
                // unset($q_data['options_json']);
            } else {
                $q_data['options'] = []; // Ensure it's an array if no options
            }

            // For security/cleanliness, you might choose to unset the raw correct_answer
            // if the frontend will determine it from options or doesn't need it explicitly
            // unset($q_data['correct_answer']);
        }
        unset($q_data); // Unset the reference to the last element

        $attemptDetails['questions'] = $attemptQuestions;

        echo json_encode([
            'success' => true,
            'attempt' => $attemptDetails
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Exam attempt not found.'
        ]);
    }

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Application error: ' . $e->getMessage()
    ]);
}
?>