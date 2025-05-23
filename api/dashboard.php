<?php
// api/dashboard.php
// File Version: 1.0.2 (Corrected Subjects Query)
// App Version: 0.0.4

// Ensure CORS headers are sent and handle preflight
require_once '../utils.php'; // Adjust path as necessary from api/ directory

// Other required files
require_once '../database.php';

// Instantiate DB & connect
$database = new Database();
$db = $database->getConnection();

if ($db === null) {
    sendJsonResponse(['message' => 'Database connection failed.'], 500);
}

// Initialize summary data with defaults for "empty state"
$summary = [
    'subjects' => [
        'total' => 0,
        'completion_progress' => 0,
        'most_active' => 'N/A',
        'lessons_created' => 0, // This will be total lessons created across all subjects
        'total_lessons_specified' => 0 // This will be sum of total_lessons from subjects table
    ],
    'lessons' => [
        'total' => 0,
        'completion_progress' => 0,
        'recently_added' => 'N/A',
        'topics_created' => 0,
        'total_topics_specified' => 0
    ],
    'topics' => [
        'total' => 0,
        'completion_progress' => 0,
        'most_questions' => 'N/A',
        'exams_created' => 0,
        'total_exams_specified' => 0
    ],
    'exams' => [
        'total' => 0,
        'attempted_count' => 0,
        'average_score' => 0
    ],
    'questions' => [
        'total' => 0,
        'attempted_count' => 0,
        'correct_rate' => 0
    ]
];

try {
    // --- Subjects Summary ---
    // Get total subjects and sum of total_lessons specified by subjects
    $stmtSubjects = $db->query("SELECT
        COUNT(id) AS total,
        SUM(total_lessons) AS total_lessons_specified
        FROM subjects");
    $subjectsData = $stmtSubjects->fetch(PDO::FETCH_ASSOC);
    if ($subjectsData) {
        $summary['subjects']['total'] = (int)$subjectsData['total'];
        $summary['subjects']['total_lessons_specified'] = (int)$subjectsData['total_lessons_specified'];
    }

    // Get count of actual lessons created
    $stmtLessonsCreated = $db->query("SELECT COUNT(id) AS lessons_count FROM lessons");
    $lessonsCreatedData = $stmtLessonsCreated->fetch(PDO::FETCH_ASSOC);
    if ($lessonsCreatedData) {
        $summary['subjects']['lessons_created'] = (int)$lessonsCreatedData['lessons_count'];
    }

    // Calculate completion progress for subjects (based on lessons created vs. total specified)
    if ($summary['subjects']['total_lessons_specified'] > 0) {
        $summary['subjects']['completion_progress'] = ($summary['subjects']['lessons_created'] / $summary['subjects']['total_lessons_specified']) * 100;
    }

    // Get most active subject (using a subquery to avoid affecting main counts)
    $stmtMostActiveSubject = $db->query("SELECT name FROM subjects
        ORDER BY
            (SELECT COUNT(*) FROM exams e WHERE e.subject_id = subjects.id) DESC,
            (SELECT COUNT(*) FROM questions q JOIN exams ex ON q.exam_id = ex.id WHERE ex.subject_id = subjects.id) DESC
        LIMIT 1");
    $mostActiveSubjectData = $stmtMostActiveSubject->fetch(PDO::FETCH_ASSOC);
    $summary['subjects']['most_active'] = $mostActiveSubjectData['name'] ?? 'N/A';


    // --- Lessons Summary ---
    $stmt = $db->query("SELECT
        COUNT(DISTINCT le.id) AS total_lessons,
        SUM(le.total_topics) AS total_topics_specified_across_lessons,
        COUNT(t.id) AS topics_created_across_lessons,
        (SELECT title FROM lessons ORDER BY created_at DESC LIMIT 1) AS recently_added_lesson
        FROM lessons le
        LEFT JOIN topics t ON le.id = t.lesson_id");
    $row = $stmt->fetch(PDO::FETCH_ASSOC); // Fetch as associative array
    if ($row) {
        $summary['lessons']['total'] = (int)$row['total_lessons'];
        $summary['lessons']['topics_created'] = (int)$row['topics_created_across_lessons'];
        $summary['lessons']['total_topics_specified'] = (int)$row['total_topics_specified_across_lessons'];
        $summary['lessons']['completion_progress'] = $summary['lessons']['total_topics_specified'] > 0 ?
            ($summary['lessons']['topics_created'] / $summary['lessons']['total_topics_specified']) * 100 : 0;
        $summary['lessons']['recently_added'] = $row['recently_added_lesson'] ?? 'N/A';
    }

    // --- Topics Summary ---
    $stmt = $db->query("SELECT
        COUNT(t.id) AS total_topics,
        SUM(t.total_exams) AS total_exams_specified_across_topics,
        COUNT(e.id) AS exams_created_across_topics,
        (SELECT t.name FROM topics t LEFT JOIN exams e ON t.id = e.topic_id LEFT JOIN questions q ON e.id = q.exam_id GROUP BY t.id ORDER BY COUNT(q.id) DESC LIMIT 1) AS topic_with_most_questions
        FROM topics t
        LEFT JOIN exams e ON t.id = e.topic_id");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $summary['topics']['total'] = (int)$row['total_topics'];
        $summary['topics']['exams_created'] = (int)$row['exams_created_across_topics'];
        $summary['topics']['total_exams_specified'] = (int)$row['total_exams_specified_across_topics'];
        $summary['topics']['completion_progress'] = $summary['topics']['total_exams_specified'] > 0 ?
            ($summary['topics']['exams_created'] / $summary['topics']['total_exams_specified']) * 100 : 0;
        $summary['topics']['most_questions'] = $row['topic_with_most_questions'] ?? 'N/A';
    }

    // --- Exams Summary ---
    // Corrected query: now using at.exam_id for distinct count
    $stmt = $db->query("SELECT
        COUNT(e.id) AS total_exams,
        COUNT(DISTINCT at.exam_id) AS attempted_exams_count,
        AVG(at.total_percentage) AS average_total_percentage
        FROM exams e
        LEFT JOIN attempts at ON e.id = at.exam_id");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $summary['exams']['total'] = (int)$row['total_exams'];
        $summary['exams']['attempted_count'] = (int)$row['attempted_exams_count'];
        $summary['exams']['average_score'] = $row['average_total_percentage'] !== null ? (float)$row['average_total_percentage'] : 0;
    }

    // --- Questions Summary ---
    $stmt = $db->query("SELECT
        COUNT(q.id) AS total_questions,
        COUNT(ans.id) AS attempted_questions_count,
        SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(ans.answer_details, '$.status')) = 'Correct' THEN 1 ELSE 0 END) AS correct_answers_count
        FROM questions q
        LEFT JOIN answers ans ON q.id = ans.question_id");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $summary['questions']['total'] = (int)$row['total_questions'];
        $summary['questions']['attempted_count'] = (int)$row['attempted_questions_count'];
        $summary['questions']['correct_rate'] = $summary['questions']['attempted_count'] > 0 ?
            ((int)$row['correct_answers_count'] / $summary['questions']['attempted_count']) * 100 : 0;
    }

    sendJsonResponse($summary);

} catch (PDOException $e) {
    error_log("Dashboard API error: " . $e->getMessage());
    sendJsonResponse(['message' => 'Error fetching dashboard data.', 'details' => $e->getMessage()], 500);
}
?>