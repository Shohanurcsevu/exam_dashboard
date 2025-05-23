<?php
// api/create_custom_exam_from_topics.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Consider restricting this in production for security
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../utils.php'; // Contains sendJsonResponse function (assuming it's compatible)
require_once '../database.php'; // Contains Database class

$db = null; // Initialize $db to null

try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Exception $e) {
    error_log("API Connection Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to connect to the database. Please try again later.']);
    http_response_code(500);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

// Basic input validation
if (!isset($input['title'], $input['duration_minutes'], $input['total_marks'], $input['pass_marks'], $input['total_questions']) || !is_array($input['selected_questions_per_topic'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input data. Missing required fields or selected_questions_per_topic is not an array.']);
    http_response_code(400);
    exit();
}

$subject_id = $input['subject_id'] ?? null;
$lesson_id = $input['lesson_id'] ?? null;
$topic_id = $input['topic_id'] ?? null; // Keep this as it is, will be null if not in payload

$title = trim($input['title']);
$duration_minutes = intval($input['duration_minutes']);
$total_marks = floatval($input['total_marks']);
$pass_marks = floatval($input['pass_marks']);
$instructions = $input['instructions'] ?? null;
$total_questions = intval($input['total_questions']);
$negative_mark_value = floatval($input['negative_mark_value'] ?? 0.00);
$selected_questions_per_topic = $input['selected_questions_per_topic'];

// Further validation
if (empty($title) || $duration_minutes <= 0 || $total_marks <= 0 || $pass_marks <= 0 || $pass_marks > $total_marks || $total_questions <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid exam details. Ensure title, duration, marks, and question counts are valid.']);
    http_response_code(400);
    exit();
}

// Start transaction using PDO
$db->beginTransaction();

try {
    // 1. Insert into exams table
    // Using named placeholders for clarity and explicit type binding.
    $stmt = $db->prepare("INSERT INTO exams (subject_id, lesson_id, topic_id, title, duration_minutes, total_marks, pass_marks, instructions, total_questions, type, negative_mark_value)
                          VALUES (:subject_id, :lesson_id, :topic_id, :title, :duration_minutes, :total_marks, :pass_marks, :instructions, :total_questions, :type, :negative_mark_value)");

    // Explicitly bind parameters with their types
    $stmt->bindParam(':subject_id', $subject_id, PDO::PARAM_INT);
    $stmt->bindParam(':lesson_id', $lesson_id, PDO::PARAM_INT);
    $stmt->bindParam(':topic_id', $topic_id, PDO::PARAM_INT); // topic_id from exam payload, will be null if not present
    $stmt->bindParam(':title', $title, PDO::PARAM_STR);
    $stmt->bindParam(':duration_minutes', $duration_minutes, PDO::PARAM_INT);
    $stmt->bindParam(':total_marks', $total_marks, PDO::PARAM_STR); // Use PARAM_STR for float/decimal
    $stmt->bindParam(':pass_marks', $pass_marks, PDO::PARAM_STR);   // Use PARAM_STR for float/decimal
    $stmt->bindParam(':instructions', $instructions, PDO::PARAM_STR);
    $stmt->bindParam(':total_questions', $total_questions, PDO::PARAM_INT);
    $stmt->bindParam(':type', $input['type'], PDO::PARAM_STR); // Directly use type from input, 'Custom'
    $stmt->bindParam(':negative_mark_value', $negative_mark_value, PDO::PARAM_STR); // Use PARAM_STR for decimal

    $stmt->execute(); // No array needed here when using bindParam

    $exam_id = $db->lastInsertId();

    if (!$exam_id) {
        throw new Exception("Failed to retrieve new exam ID after insertion.");
    }

    // 2. Select random questions and link them to the exam
    $exam_questions_values = [];
    $total_selected_actual = 0;

    foreach ($selected_questions_per_topic as $topic_selection) {
        $topic_id_for_questions = intval($topic_selection['topic_id']); // Use topic_id from this selection
        $num_questions_to_select = intval($topic_selection['num_questions']);

        if ($num_questions_to_select <= 0) {
            continue;
        }

        $q_stmt = $db->prepare("SELECT id FROM questions WHERE topic_id = :topic_id ORDER BY RAND() LIMIT :num_questions");
        $q_stmt->bindParam(':topic_id', $topic_id_for_questions, PDO::PARAM_INT);
        $q_stmt->bindParam(':num_questions', $num_questions_to_select, PDO::PARAM_INT);
        $q_stmt->execute();

        while ($question_row = $q_stmt->fetch(PDO::FETCH_ASSOC)) {
            $exam_questions_values[] = "($exam_id, {$question_row['id']})";
            $total_selected_actual++;
        }
    }

    if ($total_selected_actual !== $total_questions) {
        error_log("Warning: Mismatch in total_questions for exam_id $exam_id. Expected: $total_questions, Actual: $total_selected_actual. Updating exam record.");
        $update_exam_total_stmt = $db->prepare("UPDATE exams SET total_questions = :actual_total WHERE id = :exam_id");
        $update_exam_total_stmt->bindParam(':actual_total', $total_selected_actual, PDO::PARAM_INT);
        $update_exam_total_stmt->bindParam(':exam_id', $exam_id, PDO::PARAM_INT);
        $update_exam_total_stmt->execute();
    }

    if (empty($exam_questions_values)) {
        throw new Exception("No questions were actually selected for the exam. This might mean no questions exist for the chosen topics or invalid question counts were provided.");
    }

    // Constructing an INSTEAD OF prepared statement for bulk insert for exam_questions
    // This is safer than directly implanting values into the query string for security
    // though the current method is likely safe given the nature of question_row['id']
    // For large inserts, you'd use a loop with a prepared statement or PDOStatement::execute with batches.
    $insert_exam_questions_sql = "INSERT INTO exam_questions (exam_id, question_id) VALUES " . implode(", ", $exam_questions_values);
    $db->query($insert_exam_questions_sql);

    $db->commit();
    echo json_encode(['success' => true, 'message' => 'Custom exam created successfully!', 'exam_id' => $exam_id, 'total_questions_created' => $total_selected_actual]);

} catch (Exception $e) {
    if ($db && $db->inTransaction()) {
        $db->rollback();
    }
    error_log("Error creating custom exam: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error creating custom exam: ' . $e->getMessage()]);
    http_response_code(500);
} finally {
    $db = null; // Close PDO connection
}
?>