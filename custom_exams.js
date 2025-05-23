// custom_exams.js
// File Version: 1.0.2 (Fix for exam table filtering)
// App Version: 0.0.14

const customExamsModule = (() => {
    const contentArea = document.getElementById('content-area');
    let allSubjects = [];
    let allLessons = [];
    let allTopics = [];
    let availableExams = []; // Exams fetched based on selected topic

    // Helper to fetch all data for cascading dropdowns
    const fetchDataForDropdowns = async () => {
        try {
            window.showToast('Fetching subjects, lessons, and topics...', 'info', 1500);
            allSubjects = await apiFetch('subjects');
            allLessons = await apiFetch('lessons');
            allTopics = await apiFetch('topics');
        } catch (error) {
            console.error('Failed to fetch data for custom exam dropdowns:', error);
            window.showToast('Could not load data for filters. Please refresh.', 'error');
            allSubjects = [];
            allLessons = [];
            allTopics = [];
        }
    };

    // Populate Lessons based on selected Subject
    const populateLessonDropdown = (selectedSubjectId) => {
        const lessonDropdown = document.getElementById('custom-exam-lesson-filter');
        const topicDropdown = document.getElementById('custom-exam-topic-filter');
        lessonDropdown.innerHTML = '<option value="">-- Select a Lesson --</option>'; // Always reset
        topicDropdown.innerHTML = '<option value="">-- Select a Topic --</option>'; // Always reset
        lessonDropdown.disabled = true;
        topicDropdown.disabled = true;
        
        // --- REMOVE THESE LINES ---
        // availableExams = []; // This clears exams prematurely
        // renderExamsTable(); // This clears the table prematurely
        // -------------------------

        if (!selectedSubjectId) {
            lessonDropdown.innerHTML = '<option value="">-- Select a Subject first --</option>';
            // If no subject is selected, clear exams table
            availableExams = [];
            renderExamsTable();
            return;
        }

        const filteredLessons = allLessons.filter(lesson =>
            parseInt(lesson.subject_id) === parseInt(selectedSubjectId)
        );

        if (filteredLessons.length === 0) {
            lessonDropdown.innerHTML = '<option value="">-- No Lessons for this Subject --</option>';
            window.showToast('No lessons found for the selected subject.', 'info');
            // If no lessons, clear exams table
            availableExams = [];
            renderExamsTable();
        } else {
            let optionsHtml = '<option value="">-- Select a Lesson --</option>';
            optionsHtml += filteredLessons.map(lesson =>
                `<option value="${lesson.id}">${lesson.title}</option>`
            ).join('');
            lessonDropdown.innerHTML = optionsHtml;
            lessonDropdown.disabled = false;
        }
    };

    // Populate Topics based on selected Lesson
    const populateTopicDropdown = (selectedLessonId) => {
        const topicDropdown = document.getElementById('custom-exam-topic-filter');
        topicDropdown.innerHTML = '<option value="">-- Select a Topic --</option>'; // Always reset
        topicDropdown.disabled = true;
        
        // --- REMOVE THESE LINES ---
        // availableExams = []; // This clears exams prematurely
        // renderExamsTable(); // This clears the table prematurely
        // -------------------------

        if (!selectedLessonId) {
            topicDropdown.innerHTML = '<option value="">-- Select a Lesson first --</option>';
            // If no lesson is selected, clear exams table
            availableExams = [];
            renderExamsTable();
            return;
        }

        const filteredTopics = allTopics.filter(topic =>
            parseInt(topic.lesson_id) === parseInt(selectedLessonId)
        );

        if (filteredTopics.length === 0) {
            topicDropdown.innerHTML = '<option value="">-- No Topics for this Lesson --</option>';
            window.showToast('No topics found for the selected lesson.', 'info');
            // If no topics, clear exams table
            availableExams = [];
            renderExamsTable();
        } else {
            let optionsHtml = '<option value="">-- Select a Topic --</option>';
            optionsHtml += filteredTopics.map(topic =>
                `<option value="${topic.id}">${topic.name}</option>`
            ).join('');
            topicDropdown.innerHTML = optionsHtml;
            topicDropdown.disabled = false;
        }
    };

    // Fetch exams based on selected topic
    const fetchExamsByTopic = async (topicId) => {
        availableExams = []; // Always clear at the start of fetching new exams
        if (!topicId) {
            renderExamsTable(); // Clear table if no topic selected (or if topic is "null")
            return;
        }

        try {
            window.showToast('Fetching exams for the selected topic...', 'info');
            const exams = await apiFetch(`exams.php?topic_id=${topicId}`);
            if (exams.length === 0) {
                window.showToast('No exams found for this topic.', 'info');
            }
            availableExams = exams;
            renderExamsTable(); // Render table with fetched exams
        } catch (error) {
            console.error('Error fetching exams:', error);
            window.showToast('Failed to fetch exams for the topic.', 'error');
            availableExams = [];
            renderExamsTable();
        }
    };

    // Render the table of selectable exams (no changes needed here)
    const renderExamsTable = () => {
        const examsTableBody = document.getElementById('exams-selection-table-body');
        if (!examsTableBody) return;

        if (availableExams.length === 0) {
            examsTableBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-gray-500">Select a topic to see available exams.</td></tr>`;
            return;
        }

        let tableHtml = '';
        availableExams.forEach((exam, index) => {
            tableHtml += `
                <tr class="border-b last:border-b-0">
                    <td class="py-2 px-4">${index + 1}</td>
                    <td class="py-2 px-4">${exam.title}</td>
                    <td class="py-2 px-4">${exam.total_questions || 'N/A'}</td>
                    <td class="py-2 px-4">
                        <input type="number"
                               class="shadow appearance-none border rounded w-24 py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline question-count-input"
                               data-exam-id="${exam.id}"
                               data-max-questions="${exam.total_questions || 0}"
                               min="0"
                               max="${exam.total_questions || 0}"
                               placeholder="0-${exam.total_questions || 0}">
                    </td>
                </tr>
            `;
        });
        examsTableBody.innerHTML = tableHtml;

        // Add event listeners for question count inputs
        document.querySelectorAll('.question-count-input').forEach(input => {
            input.addEventListener('change', (event) => {
                const max = parseInt(event.target.dataset.maxQuestions);
                let value = parseInt(event.target.value);
                if (isNaN(value) || value < 0) {
                    value = 0;
                }
                if (value > max) {
                    value = max;
                    window.showToast(`Cannot select more than ${max} questions from this exam.`, 'warning');
                }
                event.target.value = value;
            });
        });
    };

    // Handle custom exam form submission
    const handleCreateCustomExam = async (event) => {
        event.preventDefault();

        const customExamName = document.getElementById('custom-exam-title').value.trim();
        const customExamDuration = parseInt(document.getElementById('custom-exam-duration').value, 10);
        const customExamTotalMarks = parseFloat(document.getElementById('custom-exam-total-marks').value);
        const customExamPassMarks = parseFloat(document.getElementById('custom-exam-pass-marks').value);


        if (!customExamName) {
            window.showToast('Please enter a name for your custom exam.', 'error');
            return;
        }
        if (isNaN(customExamDuration) || customExamDuration <= 0) {
            window.showToast('Please enter a valid duration (in minutes) for your custom exam.', 'error');
            return;
        }
        if (isNaN(customExamTotalMarks) || customExamTotalMarks <= 0) {
            window.showToast('Please enter a valid Total Marks for your custom exam.', 'error');
            return;
        }
        if (isNaN(customExamPassMarks) || customExamPassMarks < 0) {
            window.showToast('Please enter a valid Pass Marks for your custom exam (can be 0).', 'error');
            return;
        }
        if (customExamPassMarks > customExamTotalMarks) {
            window.showToast('Pass Marks cannot be greater than Total Marks.', 'error');
            return;
        }


        const selectedExamsData = [];
        let totalQuestionsForCustomExam = 0;

        document.querySelectorAll('.question-count-input').forEach(input => {
            const examId = parseInt(input.dataset.examId, 10);
            const numQuestions = parseInt(input.value, 10);

            if (numQuestions > 0) {
                selectedExamsData.push({
                    exam_id: examId,
                    num_questions: numQuestions
                });
                totalQuestionsForCustomExam += numQuestions;
            }
        });

        if (selectedExamsData.length === 0) {
            window.showToast('Please select at least one question from an exam.', 'error');
            return;
        }

        window.showToast('Creating custom exam...', 'info');

        try {
            const customExamPayload = {
                title: customExamName,
                duration_minutes: customExamDuration,
                topic_id: parseInt(document.getElementById('custom-exam-topic-filter').value, 10),
                selected_exams: selectedExamsData,
                total_questions: totalQuestionsForCustomExam,
                total_marks: customExamTotalMarks,
                pass_marks: customExamPassMarks
            };

            const response = await apiFetch('custom_exams', 'POST', customExamPayload);
            window.showToast(response.message, 'success');

            document.getElementById('custom-exam-form').reset();
            document.getElementById('custom-exam-subject-filter').value = '';
            populateLessonDropdown(''); // Resets all filters and tables. This is okay after submission.

            if (window.takeExamModule && typeof window.takeExamModule.fetchDataForExamSelectionDropdowns === 'function') {
                   await window.takeExamModule.fetchDataForExamSelectionDropdowns();
            }
            navigateTo('take-exam');
        } catch (error) {
            console.error('Error creating custom exam:', error);
        }
    };

    // Main function to load the Custom Exam page
    const loadCustomExamExamsPage = async () => {
        await fetchDataForDropdowns();

        const subjectOptions = allSubjects.map(subject =>
            `<option value="${subject.id}">${subject.name} (${subject.subject_code})</option>`
        ).join('');

        contentArea.innerHTML = `
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Create Custom Exam from Existing Exams</h2>

            <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 class="text-xl font-semibold mb-4 text-gray-800">Filter Exams by Category</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label for="custom-exam-subject-filter" class="block text-gray-700 text-sm font-bold mb-2">Select Subject:</label>
                        <select id="custom-exam-subject-filter" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                            <option value="">-- Select a Subject --</option>
                            ${subjectOptions}
                        </select>
                    </div>
                    <div>
                        <label for="custom-exam-lesson-filter" class="block text-gray-700 text-sm font-bold mb-2">Select Lesson:</label>
                        <select id="custom-exam-lesson-filter" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" disabled>
                            <option value="">-- Select a Subject first --</option>
                        </select>
                    </div>
                    <div>
                        <label for="custom-exam-topic-filter" class="block text-gray-700 text-sm font-bold mb-2">Select Topic:</label>
                        <select id="custom-exam-topic-filter" name="topic_id" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" disabled>
                            <option value="">-- Select a Lesson first --</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 class="text-xl font-semibold mb-4 text-gray-800">Select Questions from Exams</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr>
                                <th class="py-2 px-4 bg-gray-100 border-b text-left">No.</th>
                                <th class="py-2 px-4 bg-gray-100 border-b text-left">Exam Name</th>
                                <th class="py-2 px-4 bg-gray-100 border-b text-left">Total Questions</th>
                                <th class="py-2 px-4 bg-gray-100 border-b text-left">Questions to Attempt</th>
                            </tr>
                        </thead>
                        <tbody id="exams-selection-table-body">
                            <tr><td colspan="4" class="py-4 text-center text-gray-500">Select a topic to see available exams.</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 class="text-xl font-semibold mb-4 text-gray-800">Custom Exam Details</h3>
                <form id="custom-exam-form">
                    <div class="mb-4">
                        <label for="custom-exam-title" class="block text-gray-700 text-sm font-bold mb-2">Custom Exam Name:</label>
                        <input type="text" id="custom-exam-title" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label for="custom-exam-duration" class="block text-gray-700 text-sm font-bold mb-2">Custom Exam Duration (Minutes):</label>
                            <input type="number" id="custom-exam-duration" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" min="1" required>
                        </div>
                    
                        <div>
                            <label for="custom-exam-total-marks" class="block text-gray-700 text-sm font-bold mb-2">Total Marks:</label>
                            <input type="number" id="custom-exam-total-marks" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" min="1" step="0.01" required>
                        </div>
                        <div>
                            <label for="custom-exam-pass-marks" class="block text-gray-700 text-sm font-bold mb-2">Pass Marks:</label>
                            <input type="number" id="custom-exam-pass-marks" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" min="0" step="0.01" required>
                        </div>
                    </div>
                    <div class="flex items-center justify-end">
                        <button type="submit" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Save Custom Exam
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Attach event listeners
        document.getElementById('custom-exam-subject-filter').addEventListener('change', (event) => {
            populateLessonDropdown(event.target.value);
        });
        document.getElementById('custom-exam-lesson-filter').addEventListener('change', (event) => {
            populateTopicDropdown(event.target.value);
        });
        document.getElementById('custom-exam-topic-filter').addEventListener('change', (event) => {
            fetchExamsByTopic(event.target.value);
        });
        document.getElementById('custom-exam-form').addEventListener('submit', handleCreateCustomExam);

        // Initial populate of dropdowns and clear table
        populateLessonDropdown(''); // This will call populateTopicDropdown('') which will call fetchExamsByTopic('')
        // No need to call populateTopicDropdown('') explicitly here.
        // fetchExamsByTopic('') will handle the initial clearing of the table.
    };

    return {
        loadCustomExamExamsPage: loadCustomExamExamsPage
    };
})();