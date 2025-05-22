<?php
// Ensure this path is correct relative to api/performance_history.php
require_once '../utils.php';
require_once '../database.php';

// Instantiate the Database class and get the connection
$database = new Database();
$db = $database->getConnection();

// Check if the database connection was successful
if ($db === null) {
    sendJsonResponse(['success' => false, 'message' => 'Database connection failed.'], 500);
}

// Ensure the Content-Type header is set for JSON
header('Content-Type: application/json');

// The request method is implicitly GET for this endpoint, but can be checked if needed
$request_method = $_SERVER["REQUEST_METHOD"];

try {
    // Query to fetch all exam attempts with exam titles
    // Ordered by creation date (most recent first)
    $stmt = $db->prepare("
        SELECT
            a.id AS attempt_id,
            a.exam_id,
            e.title AS exam_title,
            a.score,
            a.total_percentage,
            a.attempt_no,
            a.created_at
        FROM
            attempts a
        JOIN
            exams e ON a.exam_id = e.id
        ORDER BY
            a.created_at DESC
    ");
    $stmt->execute();
    $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Send a successful JSON response with the fetched attempts
    sendJsonResponse(['success' => true, 'attempts' => $attempts], 200);

} catch (PDOException $e) {
    // Log the error for debugging purposes (check your PHP error logs)
    error_log("Database Error in performance_history.php: " . $e->getMessage());
    // Send a JSON error response
    sendJsonResponse(['success' => false, 'message' => 'Database query error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    // Catch any other unexpected errors
    error_log("General Error in performance_history.php: " . $e->getMessage());
    // Send a JSON error response
    sendJsonResponse(['success' => false, 'message' => 'An unexpected error occurred.'], 500);
}

// No need to explicitly close connection if the Database class handles it
// or if it's handled by PHP's script termination.
?>