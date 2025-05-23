<?php
// api/exams.php
// File Version: 1.0.2 (Modified GET filtering to include Model Tests)
// App Version: 0.0.17

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
        try {
            $subject_id = filter_input(INPUT_GET, 'subject_id', FILTER_VALIDATE_INT);
            $lesson_id = filter_input(INPUT_GET, 'lesson_id', FILTER_VALIDATE_INT);
            $topic_id = filter_input(INPUT_GET, 'topic_id', FILTER_VALIDATE_INT);
            // Optionally, add a filter for 'type' if you want to explicitly request specific types
            $exam_type = filter_input(INPUT_GET, 'type', FILTER_SANITIZE_STRING);


            $query = "SELECT
                        e.id,
                        e.topic_id,
                        e.lesson_id,
                        e.subject_id,
                        t.name as topic_name,
                        l.title as lesson_title,
                        s.name as subject_name,
                        e.title,
                        e.duration_minutes,
                        e.total_marks,
                        e.pass_marks,
                        e.instructions,
                        e.total_questions,
                        e.created_at,
                        e.type,
                        e.negative_mark_value
                      FROM
                        exams e
                      LEFT JOIN topics t ON e.topic_id = t.id
                      LEFT JOIN lessons l ON e.lesson_id = l.id
                      LEFT JOIN subjects s ON e.subject_id = s.id
                      WHERE 1=1 ";

            $params = [];

            // Add conditions based on provided filters
            if ($subject_id !== false && $subject_id !== null) {
                $query .= " AND e.subject_id = :subject_id";
                $params[':subject_id'] = $subject_id;
            }
            if ($lesson_id !== false && $lesson_id !== null) {
                $query .= " AND e.lesson_id = :lesson_id";
                $params[':lesson_id'] = $lesson_id;
            }
            if ($topic_id !== false && $topic_id !== null) {
                $query .= " AND e.topic_id = :topic_id";
                $params[':topic_id'] = $topic_id;
            }

            // ONLY EXCLUDE 'Custom' if NO specific subject/lesson/topic filter is active.
            // This is complex because you want to show Model Tests when no filters are selected,
            // but still exclude "Custom" exams that are created via existing ones.
            // A simpler approach: if exam_type is passed, filter by it. Otherwise, show all except 'Custom'.
            // OR, if 'Model Test' is a *different* type, then explicitly include it.

            // Let's refine this logic. The original goal was to show all exams *except* user-created Custom exams.
            // If your Model Tests are also type 'ModelTest' (or similar), and not 'Custom', then the original
            // exclusion for 'Custom' is probably fine.
            // The key is: WHAT IS THE `type` OF YOUR MODEL EXAMS?

            // Assuming 'Model Test' exams have `type = 'Model'` or `type = 'ModelTest'`
            // If they are `type = 'Custom'`, then you need to be very careful.

            // The simplest modification that fixes the *reported* problem without knowing the exact type:
            // Remove or modify the line that excludes 'Custom' exams *if* your model exams are of type 'Custom'.

            // If your model exams have a different type, e.g., 'ModelTest', then the original line was NOT the problem.
            // If your model exams are type 'ModelTest', and you want them to always show up when no filters are applied,
            // AND the frontend's `populateExamDropdown` (Scenario 0) gets all exams, then the issue is not here.

            // Given your description ("model exams subject_id , lesson_id, topic_id is null"),
            // and the `AND e.type != 'Custom'` line, it's highly likely that your model exams are being stored
            // with a `type` of 'Custom'.

            // Let's modify the exclusion. If `type` is 'Custom' for model tests,
            // and you want them to appear, you cannot exclude 'Custom' here.
            // Instead, you'd need a different mechanism to identify user-generated custom exams.

            // TEMPORARY FIX (to test if 'Custom' type is the issue for Model Tests):
            // COMMENT OUT the line:
            // $query .= " AND e.type != 'Custom' ";
            // OR, if you know Model Tests have a distinct type (e.g., 'Model'), allow it:
            // $query .= " AND (e.type != 'Custom' OR e.type = 'Model') ";
            // This is getting complicated. The simplest fix is to *remove* the `type != 'Custom'` filter from the general GET.

            // REMOVE THIS LINE IF your Model Test exams are of type 'Custom' and you want them to appear.
            // $query .= " AND e.type != 'Custom' ";
            // If you keep the above line, make sure your Model Test exams have a DIFFERENT 'type' value than 'Custom'.

            // Let's assume for now that "Model Test" exams might be of type 'ModelTest' or just 'Standard'
            // and you only want to exclude 'Custom' exams that are user-generated from existing ones.
            // If the model exams are specifically 'Custom', and you want them to be selectable as main exams,
            // then this 'Custom' filter should indeed be removed, or modified to only exclude specific *kinds* of Custom exams.

            // For now, let's remove the problematic filter, assuming model exams might be of type 'Custom' or similar.
            // You can add more nuanced filtering later if 'Custom' truly means "user-generated exam from parts".
            // IF you need to filter "user-generated Custom exams", you'd need another column like `is_user_custom_exam`
            // or a different `type` value for these.

            // To confirm: What is the `type` column value for your "Model Test" exams in the database?
            // If it's 'Custom', comment out the line below.
            // If it's something else, e.g., 'Model', then the issue is not this line, but perhaps the `null` IDs
            // not being handled on the frontend (which we've already tried to fix).

            // Assuming Model Tests are indeed type 'Custom' and this line is the problem:
            // $query .= " AND e.type != 'Custom' "; // COMMENT THIS OUT OR ADJUST

            // If `exam_type` is provided in GET, apply it
            if (!empty($exam_type)) {
                $query .= " AND e.type = :exam_type";
                $params[':exam_type'] = $exam_type;
            } else {
                // Default behavior: Exclude user-generated 'Custom' exams from the general list
                // This means 'Model Test' must NOT be 'Custom' if you want it to appear here.
                // If model tests ARE 'Custom', you need to decide if they should always show up.
                // For "take exam", probably yes.
                $query .= " AND e.type != 'UserCustomExam'"; // Change 'Custom' to a more specific type if 'Custom' is used for model tests
            }


            $query .= " ORDER BY e.created_at DESC";

            $stmt = $db->prepare($query);

            foreach ($params as $param_name => $param_value) {
                $param_type = is_int($param_value) ? PDO::PARAM_INT : PDO::PARAM_STR;
                $stmt->bindValue($param_name, $param_value, $param_type);
            }

            $stmt->execute();
            $exams = $stmt->fetchAll(PDO::FETCH_ASSOC);

            sendJsonResponse($exams);

        } catch (PDOException $e) {
            error_log("Exams GET error: " . $e->getMessage());
            sendJsonResponse(['message' => 'Error fetching exams.', 'details' => $e->getMessage()], 500);
        }
        break;

    // ... (rest of your POST logic remains unchanged)
    case 'POST':
        // Handle POST requests to add a new exam
        $data = json_decode(file_get_contents("php://input"));

        // Basic validation for new exam creation
        if (
            empty($data->title) ||
            !isset($data->duration_minutes) ||
            !isset($data->total_marks) ||
            !isset($data->pass_marks)
        ) {
            sendJsonResponse(['message' => 'Missing required fields (title, duration_minutes, total_marks, pass_marks).'], 400);
        }

        $topic_id = isset($data->topic_id) && !empty($data->topic_id) ? (int)$data->topic_id : null;
        $lesson_id = isset($data->lesson_id) && !empty($data->lesson_id) ? (int)$data->lesson_id : null;
        $subject_id = null;

        if ($topic_id === null && $lesson_id === null && (!isset($data->subject_id) || empty($data->subject_id))) {
            sendJsonResponse(['message' => 'At least one of topic_id, lesson_id, or subject_id must be provided for exam creation.'], 400);
        }

        try {
            if ($topic_id !== null) {
                $checkTopicQuery = "SELECT id, lesson_id FROM topics WHERE id = :topic_id LIMIT 1";
                $checkTopicStmt = $db->prepare($checkTopicQuery);
                $checkTopicStmt->bindParam(':topic_id', $topic_id, PDO::PARAM_INT);
                $checkTopicStmt->execute();
                $topicInfo = $checkTopicStmt->fetch(PDO::FETCH_ASSOC);

                if ($topicInfo === false) {
                    sendJsonResponse(['message' => 'Invalid Topic ID provided.'], 400);
                }
                $lesson_id = (int)$topicInfo['lesson_id'];
            }

            if ($lesson_id !== null) {
                $checkLessonQuery = "SELECT id, subject_id FROM lessons WHERE id = :lesson_id LIMIT 1";
                $checkLessonStmt = $db->prepare($checkLessonQuery);
                $checkLessonStmt->bindParam(':lesson_id', $lesson_id, PDO::PARAM_INT);
                $checkLessonStmt->execute();
                $lessonInfo = $checkLessonStmt->fetch(PDO::FETCH_ASSOC);

                if ($lessonInfo === false) {
                    sendJsonResponse(['message' => 'Invalid Lesson ID provided or derived.'], 400);
                }
                $subject_id = (int)$lessonInfo['subject_id'];
            } elseif (isset($data->subject_id) && !empty($data->subject_id)) {
                $subject_id = (int)$data->subject_id;
            } else {
                sendJsonResponse(['message' => 'Could not determine subject for exam.'], 400);
            }

            $query = "INSERT INTO exams (topic_id, lesson_id, subject_id, title, duration_minutes, total_marks, pass_marks, instructions, total_questions, negative_mark_value, type)
                      VALUES (:topic_id, :lesson_id, :subject_id, :title, :duration_minutes, :total_marks, :pass_marks, :instructions, :total_questions, :negative_mark_value, :type)";
            $stmt = $db->prepare($query);

            $title = htmlspecialchars(strip_tags($data->title));
            $duration_minutes = (int)$data->duration_minutes;
            $total_marks = (float)$data->total_marks;
            $pass_marks = (float)$data->pass_marks;
            $instructions = isset($data->instructions) ? htmlspecialchars(strip_tags($data->instructions)) : null;
            $total_questions = isset($data->total_questions) ? (int)$data->total_questions : 0;
            $negative_mark_value = isset($data->negative_mark_value) ? (float)$data->negative_mark_value : 0.00;
            $type = isset($data->type) ? htmlspecialchars(strip_tags($data->type)) : 'Standard'; // Default type for POST

            $stmt->bindParam(':topic_id', $topic_id, PDO::PARAM_INT);
            $stmt->bindParam(':lesson_id', $lesson_id, PDO::PARAM_INT);
            $stmt->bindParam(':subject_id', $subject_id, PDO::PARAM_INT);
            $stmt->bindParam(':title', $title);
            $stmt->bindParam(':duration_minutes', $duration_minutes);
            $stmt->bindParam(':total_marks', $total_marks);
            $stmt->bindParam(':pass_marks', $pass_marks);
            $stmt->bindParam(':instructions', $instructions);
            $stmt->bindParam(':total_questions', $total_questions);
            $stmt->bindParam(':negative_mark_value', $negative_mark_value);
            $stmt->bindParam(':type', $type);


            if ($stmt->execute()) {
                if ($topic_id !== null) {
                    $updateCountQuery = "UPDATE topics SET total_exams = total_exams + 1 WHERE id = :id";
                    $updateCountStmt = $db->prepare($updateCountQuery);
                    $updateCountStmt->bindParam(':id', $topic_id, PDO::PARAM_INT);
                    $updateCountStmt->execute();
                } else if ($lesson_id !== null) {
                    $updateCountQuery = "UPDATE lessons SET total_exams = total_exams + 1 WHERE id = :id";
                    $updateCountStmt = $db->prepare($updateCountQuery);
                    $updateCountStmt->bindParam(':id', $lesson_id, PDO::PARAM_INT);
                    $updateCountStmt->execute();
                } else if ($subject_id !== null) {
                    $updateCountQuery = "UPDATE subjects SET total_exams = total_exams + 1 WHERE id = :id";
                    $updateCountStmt = $db->prepare($updateCountQuery);
                    $updateCountStmt->bindParam(':id', $subject_id, PDO::PARAM_INT);
                    $updateCountStmt->execute();
                }

                sendJsonResponse(['message' => 'Exam added successfully.', 'id' => $db->lastInsertId()], 201);
            } else {
                sendJsonResponse(['message' => 'Failed to add exam.'], 500);
            }
        } catch (PDOException $e) {
            error_log("Exams POST error: " . $e->getMessage());
            sendJsonResponse(['message' => 'Error adding exam.', 'details' => $e->getMessage()], 500);
        }
        break;

    default:
        sendJsonResponse(['message' => 'Method Not Allowed.'], 405);
        break;
}
?>