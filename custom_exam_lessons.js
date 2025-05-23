// custom_exam_lessons.js
// File Version: 1.0.1 (Corrected apiFetch call in handleFormSubmit)
// App Version: 0.0.17

const customExamLessonsModule = (() => {
    let currentSubjectId = null; // Store the currently selected subject ID
    let currentLessonsData = []; // Store lessons fetched for the current subject

    const renderCustomExamForm = async (targetElementId) => {
        const contentArea = document.getElementById(targetElementId);
        if (!contentArea) {
            console.error(`Target element with ID "${targetElementId}" not found for custom exam form.`);
            return;
        }

        contentArea.innerHTML = `
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Create Custom Exam from Lessons</h2>
            
            <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 class="text-xl font-semibold mb-4 text-gray-700">1. Select Subject</h3>
                <div class="mb-4">
                    <label for="subject-selector" class="block text-gray-700 text-sm font-bold mb-2">Subject:</label>
                    <select id="subject-selector" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                        <option value="">-- Select a Subject --</option>
                    </select>
                </div>
            </div>

            <div id="lessons-selection-area" class="hidden bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 class="text-xl font-semibold mb-4 text-gray-700">2. Select Questions from Lessons</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr class="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                                <th class="py-3 px-6 text-left">No</th>
                                <th class="py-3 px-6 text-left">Lesson Name</th>
                                <th class="py-3 px-6 text-center">Total Questions</th>
                                <th class="py-3 px-6 text-center">Questions to Attempt</th>
                            </tr>
                        </thead>
                        <tbody id="lessons-table-body" class="text-gray-700 text-sm font-light">
                            </tbody>
                    </table>
                </div>
                <p id="total-questions-summary" class="mt-4 text-gray-800 font-semibold">Total Questions Selected: 0</p>
            </div>

            <div id="exam-details-form-area" class="hidden bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-xl font-semibold mb-4 text-gray-700">3. Exam Details</h3>
                <form id="create-custom-exam-form">
                    <div class="mb-4">
                        <label for="exam-name" class="block text-gray-700 text-sm font-bold mb-2">Exam Name:</label>
                        <input type="text" id="exam-name" name="exam_name" required
                               class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                    </div>
                    <div class="mb-4">
                        <label for="duration-minutes" class="block text-gray-700 text-sm font-bold mb-2">Duration In Minutes:</label>
                        <input type="number" id="duration-minutes" name="duration_minutes" required min="1"
                               class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                    </div>
                    <div class="mb-4">
                        <label for="total-marks" class="block text-gray-700 text-sm font-bold mb-2">Total Marks:</label>
                        <input type="number" id="total-marks" name="total_marks" step="0.01" required min="1"
                               class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                    </div>
                    <div class="mb-4">
                        <label for="pass-marks" class="block text-gray-700 text-sm font-bold mb-2">Pass Marks:</label>
                        <input type="number" id="pass-marks" name="pass_marks" step="0.01" required min="0"
                               class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                    </div>
                    <div class="mb-4">
                        <label for="instructions" class="block text-gray-700 text-sm font-bold mb-2">Instructions (Optional):</label>
                        <textarea id="instructions" name="instructions" rows="4"
                                  class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                    </div>
                    <div class="mb-6">
                        <label for="negative-mark-value" class="block text-gray-700 text-sm font-bold mb-2">Negative Mark Value (e.g., 0.25 for 25% deduction):</label>
                        <input type="number" id="negative-mark-value" name="negative_mark_value" step="0.01" value="0.0" min="0"
                               class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                    </div>
                    <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        <i class="fas fa-save mr-2"></i> Save Custom Exam
                    </button>
                </form>
            </div>
        `;

        await loadSubjectsIntoSelector('subject-selector');
        
        document.getElementById('subject-selector').addEventListener('change', handleSubjectChange);
        document.getElementById('create-custom-exam-form').addEventListener('submit', handleFormSubmit);
    };

    const loadSubjectsIntoSelector = async (selectorId) => {
        const selector = document.getElementById(selectorId);
        if (!selector) return;

        try {
            const subjects = await window.apiFetch('subjects_list.php');
            subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.id;
                option.textContent = subject.name;
                selector.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading subjects:", error);
            window.showToast("Failed to load subjects.", "error");
        }
    };

    const handleSubjectChange = async (event) => {
        currentSubjectId = event.target.value;
        const lessonsSelectionArea = document.getElementById('lessons-selection-area');
        const examDetailsFormArea = document.getElementById('exam-details-form-area');
        const lessonsTableBody = document.getElementById('lessons-table-body');
        lessonsTableBody.innerHTML = ''; // Clear previous lessons

        if (!currentSubjectId) {
            lessonsSelectionArea.classList.add('hidden');
            examDetailsFormArea.classList.add('hidden');
            currentLessonsData = [];
            updateTotalQuestionsSummary();
            return;
        }

        lessonsSelectionArea.classList.remove('hidden');
        examDetailsFormArea.classList.remove('hidden'); // Show exam details form once subject is selected

        lessonsTableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4">Loading lessons...</td></tr>`;

        try {
            const lessons = await window.apiFetch(`lessons_by_subject.php?subject_id=${currentSubjectId}`);
            currentLessonsData = lessons; // Store for later use
            renderLessonsTable(lessons);
            updateTotalQuestionsSummary(); // Initial calculation
        } catch (error) {
            console.error("Error loading lessons:", error);
            lessonsTableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-red-500">Failed to load lessons.</td></tr>`;
            window.showToast("Failed to load lessons for selected subject.", "error");
        }
    };

    const renderLessonsTable = (lessons) => {
        const lessonsTableBody = document.getElementById('lessons-table-body');
        lessonsTableBody.innerHTML = ''; // Clear existing rows

        if (lessons.length === 0) {
            lessonsTableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4">No lessons found for this subject.</td></tr>`;
            return;
        }

        lessons.forEach((lesson, index) => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-100';
            row.innerHTML = `
                <td class="py-3 px-6 text-left whitespace-nowrap">${index + 1}</td>
                <td class="py-3 px-6 text-left">${lesson.lesson_name}</td>
                <td class="py-3 px-6 text-center">${lesson.total_questions_in_lesson}</td>
                <td class="py-3 px-6 text-center">
                    <input type="number" 
                           class="w-24 px-2 py-1 border rounded focus:outline-none focus:shadow-outline text-center num-questions-input" 
                           data-lesson-id="${lesson.lesson_id}" 
                           data-max-questions="${lesson.total_questions_in_lesson}"
                           value="0" min="0" max="${lesson.total_questions_in_lesson}">
                </td>
            `;
            lessonsTableBody.appendChild(row);
        });

        // Add event listener to all number inputs for real-time total calculation
        lessonsTableBody.querySelectorAll('.num-questions-input').forEach(input => {
            input.addEventListener('input', (event) => {
                let value = parseInt(event.target.value);
                const max = parseInt(event.target.dataset.maxQuestions);
                if (isNaN(value) || value < 0) {
                    value = 0;
                }
                if (value > max) {
                    value = max;
                }
                event.target.value = value; // Update input value to corrected value
                updateTotalQuestionsSummary();
            });
        });
    };

    const updateTotalQuestionsSummary = () => {
        let totalSelected = 0;
        document.querySelectorAll('.num-questions-input').forEach(input => {
            totalSelected += parseInt(input.value) || 0;
        });
        document.getElementById('total-questions-summary').textContent = `Total Questions Selected: ${totalSelected}`;
        return totalSelected;
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault(); // Prevent default form submission

        const totalQuestions = updateTotalQuestionsSummary();
        if (totalQuestions === 0) {
            window.showToast("Please select at least one question from lessons.", "warning");
            return;
        }

        const form = event.target;
        const examTitle = form['exam_name'].value;
        const durationMinutes = parseInt(form['duration_minutes'].value);
        const totalMarks = parseFloat(form['total_marks'].value);
        const passMarks = parseFloat(form['pass_marks'].value);
        const instructions = form['instructions'].value;
        const negativeMarkValue = parseFloat(form['negative_mark_value'].value);

        if (isNaN(durationMinutes) || durationMinutes <= 0) {
            window.showToast("Please enter a valid duration (minutes).", "warning");
            return;
        }
        if (isNaN(totalMarks) || totalMarks <= 0) {
            window.showToast("Please enter valid total marks.", "warning");
            return;
        }
        if (isNaN(passMarks) || passMarks < 0 || passMarks > totalMarks) {
            window.showToast("Please enter valid pass marks (0 or more, less than or equal to total marks).", "warning");
            return;
        }
        if (isNaN(negativeMarkValue) || negativeMarkValue < 0) {
            window.showToast("Please enter a valid negative mark value (0 or more).", "warning");
            return;
        }

        // Collect selected lessons and their question counts
        const selectedLessonsToSave = [];
        document.querySelectorAll('.num-questions-input').forEach(input => {
            const lessonId = parseInt(input.dataset.lessonId);
            const numQuestions = parseInt(input.value);
            if (numQuestions > 0) {
                selectedLessonsToSave.push({ lesson_id: lessonId, num_questions: numQuestions });
            }
        });

        if (selectedLessonsToSave.length === 0) {
            window.showToast("Please select at least one lesson with questions to include.", "warning");
            return;
        }

        const postData = {
            subject_id: currentSubjectId, // The overall subject for the exam
            exam_title: examTitle,
            duration_minutes: durationMinutes,
            total_marks: totalMarks,
            pass_marks: passMarks,
            instructions: instructions,
            negative_mark_value: negativeMarkValue,
            selected_lessons: selectedLessonsToSave
        };

        try {
            window.showToast("Creating custom exam...", "info");
            // CORRECTED CALL
            const response = await window.apiFetch('create_custom_exam_from_lessons.php', 'POST', postData);

            if (response.message) {
                window.showToast(response.message, "success");
                form.reset(); // Clear the form
                document.getElementById('subject-selector').value = ''; // Reset subject selector
                document.getElementById('lessons-selection-area').classList.add('hidden');
                document.getElementById('exam-details-form-area').classList.add('hidden');
                document.getElementById('lessons-table-body').innerHTML = ''; // Clear table
                updateTotalQuestionsSummary();
                window.navigateTo('dashboard'); // Go back to dashboard or exams list
            } else {
                window.showToast("Failed to create custom exam.", "error");
            }
        } catch (error) {
            console.error("Error creating custom exam:", error);
            window.showToast("An error occurred while creating the exam.", "error");
        }
    };

    return {
        renderCustomExamForm
    };
})();