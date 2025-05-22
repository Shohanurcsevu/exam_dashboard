// exams.js
// File Version: 1.0.0
// App Version: 0.0.10

const examsModule = (() => {
    const contentArea = document.getElementById('content-area');
    let allSubjects = [];
    let allLessons = [];
    let allTopics = [];

    // Function to fetch all data for cascading dropdowns
    const fetchDataForExamDropdowns = async () => {
        try {
            allSubjects = await apiFetch('subjects');
            allLessons = await apiFetch('lessons');
            allTopics = await apiFetch('topics');
        } catch (error) {
            console.error('Failed to fetch data for exam form dropdowns:', error);
            window.showToast('Could not load subjects/lessons/topics for the exam form. Please refresh.', 'error');
            allSubjects = [];
            allLessons = [];
            allTopics = [];
        }
    };

    // Function to render the "Create Exam" form
    const renderCreateExamForm = () => {
        const subjectOptions = allSubjects.map(subject =>
            `<option value="${subject.id}">${subject.name} (${subject.subject_code})</option>`
        ).join('');

        return `
            <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 class="text-2xl font-semibold mb-4 text-gray-800">Create New Exam</h3>
                <form id="create-exam-form">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label for="exam-subject-filter" class="block text-gray-700 text-sm font-bold mb-2">Select Subject:</label>
                            <select id="exam-subject-filter" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                                <option value="">-- Select a Subject --</option>
                                ${subjectOptions}
                            </select>
                        </div>
                        <div>
                            <label for="exam-lesson-filter" class="block text-gray-700 text-sm font-bold mb-2">Select Lesson:</label>
                            <select id="exam-lesson-filter" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" disabled>
                                <option value="">-- Select a Subject first --</option>
                            </select>
                        </div>
                        <div>
                            <label for="topic-id" class="block text-gray-700 text-sm font-bold mb-2">Select Topic:</label>
                            <select id="topic-id" name="topic_id" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required disabled>
                                <option value="">-- Select a Lesson first --</option>
                            </select>
                            ${allTopics.length === 0 ? '<p class="text-red-500 text-xs italic mt-1">No topics available. Please add topics first.</p>' : ''}
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label for="exam-title" class="block text-gray-700 text-sm font-bold mb-2">Exam Title:</label>
                            <input type="text" id="exam-title" name="title" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                        </div>
                        <div>
                            <label for="duration-minutes" class="block text-gray-700 text-sm font-bold mb-2">Duration (Minutes):</label>
                            <input type="number" id="duration-minutes" name="duration_minutes" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" min="1" required>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label for="total-marks" class="block text-gray-700 text-sm font-bold mb-2">Total Marks:</label>
                            <input type="number" id="total-marks" name="total_marks" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" min="0" step="0.1" required>
                        </div>
                        <div>
                            <label for="pass-marks" class="block text-gray-700 text-sm font-bold mb-2">Pass Marks:</label>
                            <input type="number" id="pass-marks" name="pass_marks" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" min="0" step="0.1" required>
                        </div>
                    </div>
                    <div class="mb-6">
                        <label for="instructions" class="block text-gray-700 text-sm font-bold mb-2">Instructions (Optional):</label>
                        <textarea id="instructions" name="instructions" rows="4" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                    </div>
                    <div class="flex items-center justify-end">
                        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Create Exam
                        </button>
                    </div>
                </form>
            </div>
        `;
    };

    // Cascading dropdown logic:
    const populateLessonDropdown = (selectedSubjectId) => {
        const lessonDropdown = document.getElementById('exam-lesson-filter');
        const topicDropdown = document.getElementById('topic-id');
        lessonDropdown.innerHTML = '';
        topicDropdown.innerHTML = '';

        if (!selectedSubjectId) {
            lessonDropdown.innerHTML = '<option value="">-- Select a Subject first --</option>';
            lessonDropdown.disabled = true;
            topicDropdown.innerHTML = '<option value="">-- Select a Lesson first --</option>';
            topicDropdown.disabled = true;
            return;
        }

        const filteredLessons = allLessons.filter(lesson =>
            parseInt(lesson.subject_id) === parseInt(selectedSubjectId)
        );

        if (filteredLessons.length === 0) {
            lessonDropdown.innerHTML = '<option value="">-- No Lessons for this Subject --</option>';
            lessonDropdown.disabled = true;
            topicDropdown.innerHTML = '<option value="">-- Select a Lesson first --</option>';
            topicDropdown.disabled = true;
            window.showToast('No lessons found for the selected subject.', 'info');
        } else {
            let optionsHtml = '<option value="">-- Select a Lesson --</option>';
            optionsHtml += filteredLessons.map(lesson =>
                `<option value="${lesson.id}">${lesson.title}</option>`
            ).join('');
            lessonDropdown.innerHTML = optionsHtml;
            lessonDropdown.disabled = false;
            // Also reset topic dropdown as lesson filter changes
            populateTopicDropdown('');
        }
    };

    const populateTopicDropdown = (selectedLessonId) => {
        const topicDropdown = document.getElementById('topic-id');
        topicDropdown.innerHTML = '';

        if (!selectedLessonId) {
            topicDropdown.innerHTML = '<option value="">-- Select a Lesson first --</option>';
            topicDropdown.disabled = true;
            return;
        }

        const filteredTopics = allTopics.filter(topic =>
            parseInt(topic.lesson_id) === parseInt(selectedLessonId)
        );

        if (filteredTopics.length === 0) {
            topicDropdown.innerHTML = '<option value="">-- No Topics for this Lesson --</option>';
            topicDropdown.disabled = true;
            window.showToast('No topics found for the selected lesson.', 'info');
        } else {
            let optionsHtml = '<option value="">-- Select a Topic --</option>';
            optionsHtml += filteredTopics.map(topic =>
                `<option value="${topic.id}">${topic.name}</option>`
            ).join('');
            topicDropdown.innerHTML = optionsHtml;
            topicDropdown.disabled = false;
        }
    };

    // Function to handle adding a new exam
    const handleCreateExam = async (event) => {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const examData = {};
        formData.forEach((value, key) => {
            examData[key] = value;
        });

        // Ensure numeric fields are parsed correctly
        examData.topic_id = parseInt(document.getElementById('topic-id').value, 10);
        examData.duration_minutes = parseInt(examData.duration_minutes, 10);
        examData.total_marks = parseFloat(examData.total_marks);
        examData.pass_marks = parseFloat(examData.pass_marks);
        // total_questions will default to 0 in PHP, no need to send if not specified by user
        // For now, it's not in the form, so it won't be sent. This is fine.

        if (isNaN(examData.topic_id) || examData.topic_id <= 0) {
            window.showToast('Please select a valid Topic.', 'error');
            return;
        }
        if (isNaN(examData.duration_minutes) || examData.duration_minutes <= 0) {
            window.showToast('Duration must be a positive number.', 'error');
            return;
        }
        if (isNaN(examData.total_marks) || examData.total_marks <= 0) {
            window.showToast('Total Marks must be a positive number.', 'error');
            return;
        }
        if (isNaN(examData.pass_marks) || examData.pass_marks < 0 || examData.pass_marks > examData.total_marks) {
            window.showToast('Pass Marks must be between 0 and Total Marks.', 'error');
            return;
        }

        try {
            const response = await apiFetch('exams', 'POST', examData);
            window.showToast(response.message, 'success');
            form.reset(); // Clear form
            // Reset cascading dropdowns
            document.getElementById('exam-subject-filter').value = '';
            populateLessonDropdown(''); // This will also reset the topic dropdown
            // Optionally, navigate to a list of exams or prompt to add questions
            // For now, let's just refresh the dashboard eventually to show updated exam count
            navigateTo('dashboard');
        } catch (error) {
            // Error already shown by apiFetch
        }
    };

    // Main function to load the Create Exam page
    const loadCreateExamPage = async () => {
        await fetchDataForExamDropdowns(); // Fetch all data first

        contentArea.innerHTML = `
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Create New Exam</h2>
            <div id="create-exam-section">
                ${renderCreateExamForm()}
            </div>
            `;

        // Attach event listeners after rendering the form
        document.getElementById('create-exam-form').addEventListener('submit', handleCreateExam);
        document.getElementById('exam-subject-filter').addEventListener('change', (event) => {
            populateLessonDropdown(event.target.value);
        });
        document.getElementById('exam-lesson-filter').addEventListener('change', (event) => {
            populateTopicDropdown(event.target.value);
        });

        // Initialize dropdowns
        populateLessonDropdown(''); // This will also initialize the topic dropdown
    };

    return {
        loadCreateExamPage: loadCreateExamPage
    };
})();