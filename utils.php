<?php
// utils.php
// File Version: 1.0.0
// App Version: 0.0.4

/**
 * Sends a JSON response to the client and terminates the script.
 *
 * @param mixed $data The data to be encoded as JSON.
 * @param int $statusCode The HTTP status code to send (default: 200).
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    // Enable CORS for development. In production, restrict to your frontend domain.
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
    echo json_encode($data);
    exit();
}

/**
 * Handles CORS preflight requests (OPTIONS method).
 * If it's an OPTIONS request, sends appropriate headers and exits.
 */
function handleCorsPreflight() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
        http_response_code(200);
        exit();
    }
}

// Call this at the very beginning of each API script
handleCorsPreflight();