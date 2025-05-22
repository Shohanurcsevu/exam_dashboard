// questions.js
// File Version: 1.0.0
// App Version: 0.0.11

const questionsModule = (() => {
    const contentArea = document.getElementById('content-area');
    let allSubjects = [];
    let allLessons = [];
    let allTopics = [];
    let allExams = []; // To store all exams for filtering

    let selectedExamId = null; // Store the currently selected exam ID

    // Function to fetch all data for cascading dropdowns
    const fetchDataForQuestionDropdowns = async () => {
        try {
            allSubjects = await apiFetch('subjects');
            allLessons = await apiFetch('lessons');
            allTopics = await apiFetch('topics');
            allExams = await apiFetch('exams'); // Fetch all exams
        } catch (error) {
            console.error('Failed to fetch data for question form dropdowns:', error);
            window.showToast('Could not load subjects/lessons/topics/exams for the form. Please refresh.', 'error');
            allSubjects = [];
            allLessons = [];
            allTopics = [];
            allExams = [];
        }
    };

    // --- Form Rendering and Dynamic Fields ---
    const renderAddQuestionForm = () => {
        const subjectOptions = allSubjects.map(subject =>
            `<option value="${subject.id}">${subject.name} (${subject.subject_code})</option>`
        ).join('');

        return `
            <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 class="text-2xl font-semibold mb-4 text-gray-800">Add New Question</h3>
                <form id="add-question-form">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label for="question-subject-filter" class="block text-gray-700 text-sm font-bold mb-2">Select Subject:</label>
                            <select id="question-subject-filter" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                                <option value="">-- Select a Subject --</option>
                                ${subjectOptions}
                            </select>
                        </div>
                        <div>
                            <label for="question-lesson-filter" class="block text-gray-700 text-sm font-bold mb-2">Select Lesson:</label>
                            <select id="question-lesson-filter" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" disabled>
                                <option value="">-- Select a Subject first --</option>
                            </select>
                        </div>
                        <div>
                            <label for="question-topic-filter" class="block text-gray-700 text-sm font-bold mb-2">Select Topic:</label>
                            <select id="question-topic-filter" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" disabled>
                                <option value="">-- Select a Lesson first --</option>
                            </select>
                        </div>
                    </div>
                    <div class="mb-4">
                        <label for="exam-id-selector" class="block text-gray-700 text-sm font-bold mb-2">Select Exam:</label>
                        <select id="exam-id-selector" name="exam_id" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required disabled>
                            <option value="">-- Select a Topic first --</option>
                        </select>
                        ${allExams.length === 0 ? '<p class="text-red-500 text-xs italic mt-1">No exams available. Please create exams first.</p>' : ''}
                    </div>

                    <div class="mb-4">
                        <label for="question-text" class="block text-gray-700 text-sm font-bold mb-2">Question Text:</label>
                        <textarea id="question-text" name="question_text" rows="4" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required></textarea>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label for="question-type" class="block text-gray-700 text-sm font-bold mb-2">Question Type:</label>
                            <select id="question-type" name="question_type" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                                <option value="">-- Select Type --</option>
                                <option value="multiple_choice">Multiple Choice</option>
                                <option value="true_false">True/False</option>
                                <option value="short_answer">Short Answer</option>
                            </select>
                        </div>
                        <div>
                            <label for="question-marks" class="block text-gray-700 text-sm font-bold mb-2">Marks for this Question:</label>
                            <input type="number" id="question-marks" name="marks" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value="1" min="0.1" step="0.1" required>
                        </div>
                    </div>

                    <div id="question-type-specific-fields" class="mb-6 border p-4 rounded-md bg-gray-50">
                        <p class="text-gray-600">Select a question type to configure options.</p>
                    </div>

                    <div class="flex items-center justify-end">
                        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Add Question
                        </button>
                    </div>
                </form>
            </div>
        `;
    };

    // Function to render type-specific fields
    const renderTypeSpecificFields = (type) => {
        const container = document.getElementById('question-type-specific-fields');
        let html = '';

        switch (type) {
            case 'multiple_choice':
                html = `
                    <h4 class="font-semibold mb-3 text-gray-700">Multiple Choice Options:</h4>
                    <div id="mc-options-container">
                        <div class="flex items-center mb-2">
                            <label for="option-A" class="mr-2 w-8 font-bold">A:</label>
                            <input type="text" id="option-A" name="option_A" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Option A text" required>
                        </div>
                        <div class="flex items-center mb-2">
                            <label for="option-B" class="mr-2 w-8 font-bold">B:</label>
                            <input type="text" id="option-B" name="option_B" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Option B text" required>
                        </div>
                    </div>
                    <button type="button" id="add-mc-option-btn" class="bg-green-500 hover:bg-green-700 text-white text-sm font-bold py-1 px-3 rounded mt-2">Add Option</button>
                    <div class="mt-4">
                        <label for="correct-option-mc" class="block text-gray-700 text-sm font-bold mb-2">Correct Option:</label>
                        <select id="correct-option-mc" name="correct_option" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                            <option value="">-- Select Correct Option --</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                        </select>
                    </div>
                `;
                break;
            case 'true_false':
                html = `
                    <h4 class="font-semibold mb-3 text-gray-700">True/False Answer:</h4>
                    <div>
                        <label for="correct-answer-tf" class="block text-gray-700 text-sm font-bold mb-2">Correct Answer:</label>
                        <select id="correct-answer-tf" name="correct_answer" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                            <option value="">-- Select Answer --</option>
                            <option value="True">True</option>
                            <option value="False">False</option>
                        </select>
                    </div>
                `;
                break;
            case 'short_answer':
                html = `
                    <h4 class="font-semibold mb-3 text-gray-700">Short Answer:</h4>
                    <div>
                        <label for="correct-answer-sa" class="block text-gray-700 text-sm font-bold mb-2">Correct Answer (Expected):</label>
                        <input type="text" id="correct-answer-sa" name="correct_answer" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                        <p class="text-xs text-gray-500 mt-1">For exact matching. Consider common variations if needed.</p>
                    </div>
                `;
                break;
            default:
                html = '<p class="text-gray-600">Select a question type to configure options.</p>';
        }
        container.innerHTML = html;

        // Attach event listener for adding MC options if applicable
        if (type === 'multiple_choice') {
            document.getElementById('add-mc-option-btn').addEventListener('click', addMultipleChoiceOption);
            // Initial sync of correct option dropdown
            syncCorrectOptionDropdown();
        }
    };

    // Helper for adding MC options
    let nextOptionLetter = 'C';
    const addMultipleChoiceOption = () => {
        const optionsContainer = document.getElementById('mc-options-container');
        const correctOptionDropdown = document.getElementById('correct-option-mc');
        const nextLetter = nextOptionLetter;

        const div = document.createElement('div');
        div.classList.add('flex', 'items-center', 'mb-2');
        div.innerHTML = `
            <label for="option-${nextLetter}" class="mr-2 w-8 font-bold">${nextLetter}:</label>
            <input type="text" id="option-${nextLetter}" name="option_${nextLetter}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Option ${nextLetter} text" required>
            <button type="button" class="remove-mc-option-btn bg-red-500 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded ml-2">X</button>
        `;
        optionsContainer.appendChild(div);

        div.querySelector('.remove-mc-option-btn').addEventListener('click', (e) => {
            div.remove();
            syncCorrectOptionDropdown(); // Resync dropdown after removal
        });

        // Add new option to correct option dropdown
        const newOption = document.createElement('option');
        newOption.value = nextLetter;
        newOption.textContent = nextLetter;
        correctOptionDropdown.appendChild(newOption);

        // Increment letter
        nextOptionLetter = String.fromCharCode(nextOptionLetter.charCodeAt(0) + 1);
    };

    const syncCorrectOptionDropdown = () => {
        const correctOptionDropdown = document.getElementById('correct-option-mc');
        if (!correctOptionDropdown) return;

        const currentSelectedValue = correctOptionDropdown.value;
        correctOptionDropdown.innerHTML = '<option value="">-- Select Correct Option --</option>';

        const optionInputs = document.querySelectorAll('#mc-options-container input[type="text"]');
        let currentOptions = [];
        optionInputs.forEach(input => {
            const letter = input.id.split('-')[1];
            currentOptions.push(letter);
            const optionElem = document.createElement('option');
            optionElem.value = letter;
            optionElem.textContent = letter;
            correctOptionDropdown.appendChild(optionElem);
        });

        // Re-select the previously selected value if it still exists
        if (currentOptions.includes(currentSelectedValue)) {
            correctOptionDropdown.value = currentSelectedValue;
        } else if (currentOptions.length > 0) {
            correctOptionDropdown.value = currentOptions[0]; // Select the first available option
        }
    };

    // --- Cascading Dropdown Logic (Exam selection) ---
    const populateLessonDropdown = (selectedSubjectId) => {
        const lessonDropdown = document.getElementById('question-lesson-filter');
        const topicDropdown = document.getElementById('question-topic-filter');
        const examDropdown = document.getElementById('exam-id-selector');

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
            selectedExamId = null; // Clear selected exam
            renderQuestionsList([]); // Clear questions list
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
            selectedExamId = null;
            renderQuestionsList([]);
        } else {
            let optionsHtml = '<option value="">-- Select a Lesson --</option>';
            optionsHtml += filteredLessons.map(lesson =>
                `<option value="${lesson.id}">${lesson.title}</option>`
            ).join('');
            lessonDropdown.innerHTML = optionsHtml;
            lessonDropdown.disabled = false;
            // Also reset topic and exam dropdowns
            populateTopicDropdown('');
        }
    };

    const populateTopicDropdown = (selectedLessonId) => {
        const topicDropdown = document.getElementById('question-topic-filter');
        const examDropdown = document.getElementById('exam-id-selector');
        topicDropdown.innerHTML = '';
        examDropdown.innerHTML = '';

        if (!selectedLessonId) {
            topicDropdown.innerHTML = '<option value="">-- Select a Lesson first --</option>';
            topicDropdown.disabled = true;
            examDropdown.innerHTML = '<option value="">-- Select a Topic first --</option>';
            examDropdown.disabled = true;
            selectedExamId = null;
            renderQuestionsList([]);
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
            selectedExamId = null;
            renderQuestionsList([]);
        } else {
            let optionsHtml = '<option value="">-- Select a Topic --</option>';
            optionsHtml += filteredTopics.map(topic =>
                `<option value="${topic.id}">${topic.name}</option>`
            ).join('');
            topicDropdown.innerHTML = optionsHtml;
            topicDropdown.disabled = false;
            // Also reset exam dropdown
            populateExamDropdown('');
        }
    };

    const populateExamDropdown = (selectedTopicId) => {
        const examDropdown = document.getElementById('exam-id-selector');
        examDropdown.innerHTML = '';

        if (!selectedTopicId) {
            examDropdown.innerHTML = '<option value="">-- Select a Topic first --</option>';
            examDropdown.disabled = true;
            selectedExamId = null;
            renderQuestionsList([]);
            return;
        }

        const filteredExams = allExams.filter(exam =>
            parseInt(exam.topic_id) === parseInt(selectedTopicId)
        );

        if (filteredExams.length === 0) {
            examDropdown.innerHTML = '<option value="">-- No Exams for this Topic --</option>';
            examDropdown.disabled = true;
            selectedExamId = null;
            renderQuestionsList([]);
            window.showToast('No exams found for the selected topic. Create an exam for this topic first.', 'info');
        } else {
            let optionsHtml = '<option value="">-- Select an Exam --</option>';
            optionsHtml += filteredExams.map(exam =>
                `<option value="${exam.id}">${exam.title} (ID: ${exam.id})</option>`
            ).join('');
            examDropdown.innerHTML = optionsHtml;
            examDropdown.disabled = false;
            selectedExamId = null; // Clear previous selection
            renderQuestionsList([]); // Clear questions list until an exam is selected
        }
    };

    // --- Questions List Rendering ---
    const renderQuestionsList = (questions) => {
        const questionsListSection = document.getElementById('questions-list-section');
        if (!questionsListSection) return; // Exit if element not found

        let questionsHtml = `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-2xl font-semibold mb-4 text-gray-800">Questions for Selected Exam</h3>
                ${questions.length === 0 ? '<p class="text-gray-600">No questions added to this exam yet.</p>' : ''}
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct Answer</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${questions.map(question => `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${question.id}</td>
                                    <td class="px-6 py-4 text-sm text-gray-900">${question.question_text.substring(0, 70)}...</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${question.question_type.replace('_', ' ')}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${question.correct_answer || 'N/A'}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${question.marks}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Date(question.created_at).toLocaleDateString()}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button class="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                                        <button class="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        questionsListSection.innerHTML = questionsHtml;
    };

    // Function to fetch questions from API based on selectedExamId
    const fetchQuestions = async () => {
        if (!selectedExamId) {
            renderQuestionsList([]); // Clear list if no exam is selected
            return;
        }
        try {
            const questions = await apiFetch(`questions?exam_id=${selectedExamId}`);
            renderQuestionsList(questions);
        } catch (error) {
            document.getElementById('questions-list-section').innerHTML = `<div class="bg-white p-6 rounded-lg shadow-md text-red-600">Failed to load questions for this exam.</div>`;
        }
    };

    // --- Handle Form Submission ---
    const handleAddQuestion = async (event) => {
        event.preventDefault();

        const form = event.target;
        const examId = document.getElementById('exam-id-selector').value;
        const questionText = document.getElementById('question-text').value;
        const questionType = document.getElementById('question-type').value;
        const marks = parseFloat(document.getElementById('question-marks').value);

        if (!examId || isNaN(marks) || marks <= 0) {
            window.showToast('Please select an Exam and provide valid Marks.', 'error');
            return;
        }

        let questionData = {
            exam_id: parseInt(examId, 10),
            question_text: questionText,
            question_type: questionType,
            marks: marks
        };

        // Collect type-specific data
        switch (questionType) {
            case 'multiple_choice':
                const options = [];
                document.querySelectorAll('#mc-options-container input[type="text"]').forEach(input => {
                    const optionKey = input.id.split('-')[1];
                    options.push({ key: optionKey, value: input.value });
                });
                const correctOptionMC = document.getElementById('correct-option-mc').value;
                if (options.length < 2 || !correctOptionMC) {
                    window.showToast('Multiple choice questions require at least two options and a correct option.', 'error');
                    return;
                }
                questionData.options = options;
                questionData.correct_option = correctOptionMC;
                break;
            case 'true_false':
                const correctAnswerTF = document.getElementById('correct-answer-tf').value;
                if (!correctAnswerTF) {
                    window.showToast('True/False questions require a correct answer.', 'error');
                    return;
                }
                questionData.correct_answer = correctAnswerTF;
                break;
            case 'short_answer':
                const correctAnswerSA = document.getElementById('correct-answer-sa').value;
                if (!correctAnswerSA) {
                    window.showToast('Short answer questions require a correct answer.', 'error');
                    return;
                }
                questionData.correct_answer = correctAnswerSA;
                break;
            default:
                window.showToast('Please select a valid question type.', 'error');
                return;
        }

        try {
            const response = await apiFetch('questions', 'POST', questionData);
            window.showToast(response.message, 'success');
            form.reset(); // Clear form
            // Reset question type specific fields
            renderTypeSpecificFields('');
            // Re-populate dropdowns and questions list
            document.getElementById('question-subject-filter').value = '';
            populateLessonDropdown('');
            // Since we just added a question to the selected exam, refresh its list
            await fetchQuestions();
        } catch (error) {
            // apiFetch already shows toast
        }
    };


    // --- Main Page Load Function ---
    const loadQuestionsPage = async () => {
        await fetchDataForQuestionDropdowns();

        contentArea.innerHTML = `
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Question Management</h2>
            <div id="add-question-section">
                ${renderAddQuestionForm()}
            </div>
            <div id="questions-list-section" class="mt-6">
                <div class="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-48">Select an Exam above to view its questions.</div>
            </div>
        `;

        // Attach event listeners
        document.getElementById('add-question-form').addEventListener('submit', handleAddQuestion);
        document.getElementById('question-type').addEventListener('change', (event) => {
            renderTypeSpecificFields(event.target.value);
        });

        // Cascading dropdowns for Exam selection
        document.getElementById('question-subject-filter').addEventListener('change', (event) => {
            populateLessonDropdown(event.target.value);
        });
        document.getElementById('question-lesson-filter').addEventListener('change', (event) => {
            populateTopicDropdown(event.target.value);
        });
        document.getElementById('question-topic-filter').addEventListener('change', (event) => {
            populateExamDropdown(event.target.value);
        });
        document.getElementById('exam-id-selector').addEventListener('change', (event) => {
            selectedExamId = event.target.value;
            fetchQuestions(); // Fetch questions for the newly selected exam
        });

        // Initialize dropdowns
        populateLessonDropdown(''); // This will also initialize topic and exam dropdowns
        renderTypeSpecificFields(''); // Initialize dynamic fields to empty state
    };

    return {
        loadQuestionsPage: loadQuestionsPage
    };
})();