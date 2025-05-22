<?php
// database.php
// File Version: 1.0.0
// App Version: 0.0.4

require_once 'config.php';

class Database {
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    public $conn;

    /**
     * Get the database connection.
     *
     * @return PDO|null The PDO connection object or null on failure.
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password,
                [
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4", // Ensure UTF-8mb4
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,        // Throw exceptions on errors
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC    // Fetch rows as associative arrays by default
                ]
            );
        } catch (PDOException $exception) {
            // In a production environment, you might log this error rather than display it
            // For development, displaying it is fine for debugging.
            error_log("Connection error: " . $exception->getMessage());
            // Optionally, return a user-friendly error message or re-throw
            // For now, we just let the API endpoint handle a potential null connection.
        }
        return $this->conn;
    }
}
?>