// question_importer.js
// File Version: 1.0.1
// App Version: 0.0.12 (Updated to send lesson_id and topic_id with questions)

const questionImporterModule = (() => {
    const contentArea = document.getElementById('content-area');
    let allSubjects = [];
    let allLessons = [];
    let allTopics = [];
    let allExams = [];

    // Re-use logic for fetching data for dropdowns
    const fetchDataForDropdowns = async () => {
        try {
            allSubjects = await apiFetch('subjects');
            allLessons = await apiFetch('lessons');
            allTopics = await apiFetch('topics');
            allExams = await apiFetch('exams');
        } catch (error) {
            console.error('Failed to fetch data for question import dropdowns:', error);
            window.showToast('Could not load subjects/lessons/topics/exams for the import form. Please refresh.', 'error');
            allSubjects = [];
            allLessons = [];
            allTopics = [];
            allExams = [];
        }
    };

    const renderImportForm = () => {
        const subjectOptions = allSubjects.map(subject =>
            `<option value="${subject.id}">${subject.name} (${subject.subject_code})</option>`
        ).join('');

        return `
            <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 class="text-2xl font-semibold mb-4 text-gray-800">Import Questions from JSON</h3>
                <form id="import-questions-form">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label for="import-subject-filter" class="block text-gray-700 text-sm font-bold mb-2">Select Subject:</label>
                            <select id="import-subject-filter" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                                <option value="">-- Select a Subject --</option>
                                ${subjectOptions}
                            </select>
                        </div>
                        <div>
                            <label for="import-lesson-filter" class="block text-gray-700 text-sm font-bold mb-2">Select Lesson:</label>
                            <select id="import-lesson-filter" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" disabled>
                                <option value="">-- Select a Subject first --</option>
                            </select>
                        </div>
                        <div>
                            <label for="import-topic-filter" class="block text-gray-700 text-sm font-bold mb-2">Select Topic:</label>
                            <select id="import-topic-filter" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" disabled>
                                <option value="">-- Select a Lesson first --</option>
                            </select>
                        </div>
                    </div>
                    <div class="mb-4">
                        <label for="import-exam-selector" class="block text-gray-700 text-sm font-bold mb-2">Select Exam to import into:</label>
                        <select id="import-exam-selector" name="exam_id" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required disabled>
                            <option value="">-- Select a Topic first --</option>
                        </select>
                        ${allExams.length === 0 ? '<p class="text-red-500 text-xs italic mt-1">No exams available. Please create exams first.</p>' : ''}
                    </div>

                    <div class="mb-4">
                        <label for="json-input" class="block text-gray-700 text-sm font-bold mb-2">Paste Questions JSON (Array of Objects):</label>
                        <textarea id="json-input" rows="15" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-mono text-xs" placeholder='[{"question": "What is 2+2?", "options": {"A": "3", "B": "4"}, "answer": "B"}, {"question": "Is the sky blue?", "answer": "True"}]'></textarea>
                        <p class="text-xs text-gray-500 mt-1">Your JSON should be an array of question objects, each with 'question', 'answer', and optionally 'options' and 'marks'.</p>
                    </div>

                    <div class="flex items-center justify-end">
                        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Import Questions
                        </button>
                    </div>
                </form>
            </div>
        `;
    };

    // Cascading dropdown logic (similar to exams.js and questions.js)
    const populateLessonDropdown = (selectedSubjectId) => {
        const lessonDropdown = document.getElementById('import-lesson-filter');
        const topicDropdown = document.getElementById('import-topic-filter');
        const examDropdown = document.getElementById('import-exam-selector');

        lessonDropdown.innerHTML = '';
        topicDropdown.innerHTML = '';
        examDropdown.innerHTML = '';

        if (!selectedSubjectId) {
            lessonDropdown.innerHTML = '<option value="">-- Select a Subject first --</option>';
            lessonDropdown.disabled = true;
            topicDropdown.innerHTML = '<option value="">-- Select a Lesson first --</option>';
            topicDropdown.disabled = true;
            examDropdown.innerHTML = '<option value="">-- Select a Topic first --</option>';
            examDropdown.disabled = true;
            return;
        }

        const filteredLessons = allLessons.filter(lesson =>
            parseInt(lesson.subject_id) === parseInt(selectedSubjectId)
        );

        if (filteredLessons.length === 0) {
            lessonDropdown.innerHTML = '<option value="">-- No Lessons for this Subject --</option>';
            lessonDropdown.disabled = true;
            topicDropdown.innerHTML = '<option value="">-- No Topics for this Lesson --</option>';
            topicDropdown.disabled = true;
            examDropdown.innerHTML = '<option value="">-- No Exams for this Topic --</option>';
            examDropdown.disabled = true;
        } else {
            let optionsHtml = '<option value="">-- Select a Lesson --</option>';
            optionsHtml += filteredLessons.map(lesson =>
                `<option value="${lesson.id}">${lesson.title}</option>`
            ).join('');
            lessonDropdown.innerHTML = optionsHtml;
            lessonDropdown.disabled = false;
            populateTopicDropdown('');
        }
    };

    const populateTopicDropdown = (selectedLessonId) => {
        const topicDropdown = document.getElementById('import-topic-filter');
        const examDropdown = document.getElementById('import-exam-selector');
        topicDropdown.innerHTML = '';
        examDropdown.innerHTML = '';

        if (!selectedLessonId) {
            topicDropdown.innerHTML = '<option value="">-- Select a Lesson first --</option>';
            topicDropdown.disabled = true;
            examDropdown.innerHTML = '<option value="">-- Select a Topic first --</option>';
            examDropdown.disabled = true;
            return;
        }

        const filteredTopics = allTopics.filter(topic =>
            parseInt(topic.lesson_id) === parseInt(selectedLessonId)
        );

        if (filteredTopics.length === 0) {
            topicDropdown.innerHTML = '<option value="">-- No Topics for this Lesson --</option>';
            topicDropdown.disabled = true;
            examDropdown.innerHTML = '<option value="">-- No Exams for this Topic --</option>';
            examDropdown.disabled = true;
        } else {
            let optionsHtml = '<option value="">-- Select a Topic --</option>';
            optionsHtml += filteredTopics.map(topic =>
                `<option value="${topic.id}">${topic.name}</option>`
            ).join('');
            topicDropdown.innerHTML = optionsHtml;
            topicDropdown.disabled = false;
            populateExamDropdown('');
        }
    };

    const populateExamDropdown = (selectedTopicId) => {
        const examDropdown = document.getElementById('import-exam-selector');
        examDropdown.innerHTML = '';

        if (!selectedTopicId) {
            examDropdown.innerHTML = '<option value="">-- Select a Topic first --</option>';
            examDropdown.disabled = true;
            return;
        }

        const filteredExams = allExams.filter(exam =>
            parseInt(exam.topic_id) === parseInt(selectedTopicId)
        );

        if (filteredExams.length === 0) {
            examDropdown.innerHTML = '<option value="">-- No Exams for this Topic --</option>';
            examDropdown.disabled = true;
            window.showToast('No exams found for the selected topic. Create an exam for this topic first.', 'info');
        } else {
            let optionsHtml = '<option value="">-- Select an Exam --</option>';
            optionsHtml += filteredExams.map(exam =>
                `<option value="${exam.id}">${exam.title} (ID: ${exam.id})</option>`
            ).join('');
            examDropdown.innerHTML = optionsHtml;
            examDropdown.disabled = false;
        }
    };

    const handleImportQuestions = async (event) => {
        event.preventDefault();

        const examId = document.getElementById('import-exam-selector').value;
        const lessonId = document.getElementById('import-lesson-filter').value; // Get selected lesson ID
        const topicId = document.getElementById('import-topic-filter').value;   // Get selected topic ID
        const jsonInput = document.getElementById('json-input').value;

        if (!examId) {
            window.showToast('Please select an Exam.', 'error');
            return;
        }
        if (!jsonInput.trim()) {
            window.showToast('Please paste your questions JSON.', 'error');
            return;
        }

        let questionsArray;
        try {
            questionsArray = JSON.parse(jsonInput);
            if (!Array.isArray(questionsArray)) {
                window.showToast('JSON input must be an array of questions.', 'error');
                return;
            }
        } catch (e) {
            window.showToast('Invalid JSON format. Please check your syntax.', 'error');
            return;
        }

        // --- NEW: Add lesson_id and topic_id to each question object in the array ---
        const questionsWithAssociations = questionsArray.map(question => {
            return {
                ...question, // Spread existing question properties
                lesson_id: lessonId ? parseInt(lessonId, 10) : null, // Add lesson_id if selected, else null
                topic_id: topicId ? parseInt(topicId, 10) : null   // Add topic_id if selected, else null
            };
        });

        const payload = {
            exam_id: parseInt(examId, 10),
            questions: questionsWithAssociations // Use the modified array
        };

        try {
            const response = await apiFetch('import_questions', 'POST', payload);
            let message = `${response.imported_count} questions imported successfully.`;
            if (response.errors && response.errors.length > 0) {
                message += ` Some errors occurred: ${response.errors.join(', ')}`;
                window.showToast(message, 'warning', 8000); // Show warning for longer
            } else {
                window.showToast(message, 'success');
            }
            document.getElementById('json-input').value = ''; // Clear textarea
            window.navigateTo('add-questions'); // Optionally, navigate to the "Add Questions" page to see the new list
        } catch (error) {
            // apiFetch already shows toast
            console.error('Import API error:', error); // Log the full error for debugging
        }
    };

    const loadQuestionImporterPage = async () => {
        await fetchDataForDropdowns();

        contentArea.innerHTML = `
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Bulk Question Import</h2>
            <div id="import-questions-section">
                ${renderImportForm()}
            </div>
        `;

        // Attach event listeners
        document.getElementById('import-questions-form').addEventListener('submit', handleImportQuestions);
        document.getElementById('import-subject-filter').addEventListener('change', (event) => {
            populateLessonDropdown(event.target.value);
        });
        document.getElementById('import-lesson-filter').addEventListener('change', (event) => {
            populateTopicDropdown(event.target.value);
        });
        document.getElementById('import-topic-filter').addEventListener('change', (event) => {
            populateExamDropdown(event.target.value);
        });

        // Initialize dropdowns
        populateLessonDropdown('');
    };

    return {
        loadQuestionImporterPage: loadQuestionImporterPage
    };
})();