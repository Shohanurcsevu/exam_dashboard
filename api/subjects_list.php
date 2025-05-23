<?php
// api/subjects_list.php
// File Version: 1.0.0
// App Version: 0.0.17

require_once '../utils.php';
require_once '../database.php';

$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    sendJsonResponse(['message' => 'Database connection failed.'], 500);
}

try {
    $query = "SELECT id, name FROM subjects ORDER BY name ASC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendJsonResponse($subjects);

} catch (PDOException $e) {
    error_log("Subjects List API error: " . $e->getMessage());
    sendJsonResponse(['message' => 'Error fetching subjects.', 'details' => $e->getMessage()], 500);
}
?>