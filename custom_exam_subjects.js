// custom_exam_subjects.js

document.addEventListener('DOMContentLoaded', () => {
    // Event listener for the "Create Custom Exam from Subjects" menu item
    document.body.addEventListener('click', async (event) => {
        if (event.target.closest('[data-page="custom-exam-subjects"]')) {
            event.preventDefault();
            await loadCustomExamSubjectsPage();
        }
    });
});

async function loadCustomExamSubjectsPage() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <h2 class="text-2xl font-semibold text-gray-800 mb-6">Create Custom Exam from Subjects & Lessons</h2>

        <div class="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 class="text-xl font-medium text-gray-700 mb-4">Select Questions per Lesson</h3>
            <div class="overflow-x-auto">
                <form id="custom-exam-questions-form">
                    <table class="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr class="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                                <th class="py-3 px-6 text-left">No.</th>
                                <th class="py-3 px-6 text-left">Subject Name</th>
                                <th class="py-3 px-6 text-left">Lesson Name</th>
                                <th class="py-3 px-6 text-center">Total Questions in Lesson</th>
                                <th class="py-3 px-6 text-center">Input Number of Questions</th>
                            </tr>
                        </thead>
                        <tbody id="lessons-table-body" class="text-gray-600 text-sm font-light">
                            <tr><td colspan="5" class="py-3 px-6 text-center">Loading subjects and lessons...</td></tr>
                        </tbody>
                    </table>

                    <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h3 class="text-xl font-medium text-gray-700 mb-4">Custom Exam Details</h3>
                        <div class="mb-4">
                            <label for="custom-exam-title" class="block text-gray-700 text-sm font-bold mb-2">Exam Name:</label>
                            <input type="text" id="custom-exam-title" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                        </div>
                        <div class="mb-4">
                            <label for="custom-exam-duration" class="block text-gray-700 text-sm font-bold mb-2">Duration (minutes):</label>
                            <input type="number" id="custom-exam-duration" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" min="1" required>
                        </div>
                        <div class="mb-4">
                            <label for="custom-exam-total-marks" class="block text-gray-700 text-sm font-bold mb-2">Total Marks:</label>
                            <input type="number" step="0.01" id="custom-exam-total-marks" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" min="0" required>
                        </div>
                        <div class="mb-4">
                            <label for="custom-exam-pass-marks" class="block text-gray-700 text-sm font-bold mb-2">Pass Marks:</label>
                            <input type="number" step="0.01" id="custom-exam-pass-marks" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" min="0" required>
                        </div>
                        <div class="mb-6">
                            <label for="custom-exam-negative-mark-value" class="block text-gray-700 text-sm font-bold mb-2">Negative Mark Value (per wrong answer, e.g., 0.25 for -0.25):</label>
                            <input type="number" step="0.01" id="custom-exam-negative-mark-value" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value="0.00">
                        </div>
                        <div class="mb-6">
                            <label for="custom-exam-instructions" class="block text-gray-700 text-sm font-bold mb-2">Instructions (Optional):</label>
                            <textarea id="custom-exam-instructions" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" rows="3"></textarea>
                        </div>
                        <button type="submit" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Create Custom Exam
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    await fetchSubjectsAndLessonsForQuestions();

    document.getElementById('custom-exam-questions-form').addEventListener('submit', createCustomExamFromLessons);
}

async function fetchSubjectsAndLessonsForQuestions() {
    const lessonsTableBody = document.getElementById('lessons-table-body');
    lessonsTableBody.innerHTML = '<tr><td colspan="5" class="py-3 px-6 text-center">Loading subjects and lessons...</td></tr>';

    try {
        const response = await fetch('api/subjects_with_lessons_and_question_counts.php'); // New endpoint!
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const subjectsData = await response.json();
        
        lessonsTableBody.innerHTML = ''; // Clear loading text

        if (subjectsData.length > 0) {
            let rowNum = 1;
            subjectsData.forEach(subject => {
                if (subject.lessons && subject.lessons.length > 0) {
                    subject.lessons.forEach(lesson => {
                        lessonsTableBody.innerHTML += `
                            <tr class="border-b border-gray-200 hover:bg-gray-100">
                                <td class="py-3 px-6 text-left">${rowNum++}</td>
                                <td class="py-3 px-6 text-left font-semibold">${subject.name}</td>
                                <td class="py-3 px-6 text-left">${lesson.title}</td>
                                <td class="py-3 px-6 text-center">${lesson.total_questions_in_lesson}</td>
                                <td class="py-3 px-6 text-center">
                                    <input type="number"
                                           class="shadow appearance-none border rounded w-24 py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline question-input"
                                           data-lesson-id="${lesson.id}"
                                           data-subject-id="${subject.id}"
                                           data-max-questions="${lesson.total_questions_in_lesson}"
                                           min="0" value="0">
                                </td>
                            </tr>
                        `;
                    });
                } else {
                     // Display subjects even if they have no lessons
                     lessonsTableBody.innerHTML += `
                            <tr class="border-b border-gray-200 hover:bg-gray-100">
                                <td class="py-3 px-6 text-left">${rowNum++}</td>
                                <td class="py-3 px-6 text-left font-semibold">${subject.name}</td>
                                <td class="py-3 px-6 text-left text-gray-500" colspan="3">No lessons found for this subject.</td>
                            </tr>
                        `;
                }
            });
        } else {
            lessonsTableBody.innerHTML = '<tr><td colspan="5" class="py-3 px-6 text-center text-red-500">No subjects or lessons found. Please add them first.</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching subjects and lessons with question counts:', error);
        showToast('Error loading subjects and lessons.', 'error');
        lessonsTableBody.innerHTML = '<tr><td colspan="5" class="py-3 px-6 text-center text-red-500">Failed to load data.</td></tr>';
    }
}

async function createCustomExamFromLessons(event) {
    event.preventDefault();

    const lessonQuestionRequests = [];
    document.querySelectorAll('.question-input').forEach(input => {
        const lessonId = parseInt(input.dataset.lessonId);
        const subjectId = parseInt(input.dataset.subjectId);
        const requestedQuestions = parseInt(input.value);
        const maxQuestions = parseInt(input.dataset.maxQuestions);

        if (requestedQuestions > 0) {
            if (requestedQuestions > maxQuestions) {
                showToast(`Requested questions for lesson ${lessonId} (${requestedQuestions}) exceed available questions (${maxQuestions}). Adjusting to max.`, 'warning');
                input.value = maxQuestions; // Adjust input value
                lessonQuestionRequests.push({ lesson_id: lessonId, subject_id: subjectId, num_questions: maxQuestions });
            } else {
                lessonQuestionRequests.push({ lesson_id: lessonId, subject_id: subjectId, num_questions: requestedQuestions });
            }
        }
    });

    if (lessonQuestionRequests.length === 0) {
        showToast('Please specify the number of questions for at least one lesson.', 'warning');
        return;
    }

    const title = document.getElementById('custom-exam-title').value.trim();
    const duration_minutes = parseInt(document.getElementById('custom-exam-duration').value);
    const total_marks = parseFloat(document.getElementById('custom-exam-total-marks').value);
    const pass_marks = parseFloat(document.getElementById('custom-exam-pass-marks').value);
    const negative_mark_value = parseFloat(document.getElementById('custom-exam-negative-mark-value').value);
    const instructions = document.getElementById('custom-exam-instructions').value.trim();

    if (!title || isNaN(duration_minutes) || isNaN(total_marks) || isNaN(pass_marks)) {
        showToast('Please fill all required custom exam details correctly.', 'warning');
        return;
    }

    const customExamData = {
        title: title,
        duration_minutes: duration_minutes,
        total_marks: total_marks,
        pass_marks: pass_marks,
        instructions: instructions,
        negative_mark_value: negative_mark_value,
        lesson_question_requests: lessonQuestionRequests, // New data structure for backend
        type: 'Custom'
    };

    try {
        // This will be a NEW backend endpoint
        const response = await fetch('api/create_custom_exam_from_lesson_questions.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customExamData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        showToast('Custom exam created successfully!', 'success');
        console.log('Custom Exam Created:', result);
        
        // Clear form and reset table
        document.getElementById('custom-exam-questions-form').reset();
        await fetchSubjectsAndLessonsForQuestions(); // Reload to show updated counts
    } catch (error) {
        console.error('Error creating custom exam:', error);
        showToast(`Error creating custom exam: ${error.message}`, 'error');
    }
}