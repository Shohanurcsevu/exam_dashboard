// take_exam.js
// File Version: 1.0.1 (Updated with parseFloat() for total_percentage)
// App Version: 0.0.12

const takeExamModule = (() => {
    const contentArea = document.getElementById('content-area');
    let allSubjects = [];
    let allLessons = [];
    let allTopics = [];
    let allExams = [];

    let currentExam = null;
    let examQuestions = [];
    let userAnswers = {}; // Stores {question_id: selected_option}
    let timerInterval = null;
    let timeLeft = 0; // In seconds

    // --- Data Fetching for Dropdowns ---
    const fetchDataForExamSelectionDropdowns = async () => {
        try {
            allSubjects = await apiFetch('subjects');
            allLessons = await apiFetch('lessons');
            allTopics = await apiFetch('topics');
            allExams = await apiFetch('exams');
        } catch (error) {
            console.error('Failed to fetch data for exam selection dropdowns:', error);
            window.showToast('Could not load subjects/lessons/topics/exams. Please refresh.', 'error');
            allSubjects = [];
            allLessons = [];
            allTopics = [];
            allExams = [];
        }
    };

    // --- Cascading Dropdown Logic (Re-used) ---
    const populateLessonDropdown = (selectedSubjectId) => {
        const lessonDropdown = document.getElementById('take-exam-lesson-filter');
        const topicDropdown = document.getElementById('take-exam-topic-filter');
        const examDropdown = document.getElementById('take-exam-selector');

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
        const topicDropdown = document.getElementById('take-exam-topic-filter');
        const examDropdown = document.getElementById('take-exam-selector');
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
        const examDropdown = document.getElementById('take-exam-selector');
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
            window.showToast('No exams found for the selected topic.', 'info');
        } else {
            let optionsHtml = '<option value="">-- Select an Exam --</option>';
            optionsHtml += filteredExams.map(exam =>
                `<option value="${exam.id}">${exam.title} (${exam.duration_minutes} mins, ${exam.total_questions} Qs, ${exam.total_marks} Marks)</option>`
            ).join('');
            examDropdown.innerHTML = optionsHtml;
            examDropdown.disabled = false;
        }
    };

    // --- Exam Display and Interaction ---

    const renderExamDetails = (exam) => {
        return `
            <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6" role="alert">
                <p class="font-bold text-xl">${exam.title}</p>
                <p>Subject: ${exam.subject_name || 'N/A'} > Lesson: ${exam.lesson_title || 'N/A'} > Topic: ${exam.topic_name || 'N/A'}</p>
                <p>Duration: <span class="font-bold">${exam.duration_minutes} minutes</span></p>
                <p>Total Questions: <span class="font-bold">${exam.total_questions}</span></p>
                <p>Total Marks: <span class="font-bold">${exam.total_marks}</span> | Pass Marks: <span class="font-bold">${exam.pass_marks}</span></p>
                ${exam.instructions ? `<p class="mt-2 text-sm">Instructions: ${exam.instructions}</p>` : ''}
            </div>
            <div class="flex justify-between items-center bg-gray-100 p-4 rounded-md shadow-sm mb-6">
                <div class="text-gray-800 font-semibold">Time Left: <span id="exam-timer" class="text-red-600 text-xl font-bold">--:--</span></div>
                <button id="submit-exam-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline">
                    Submit Exam
                </button>
            </div>
        `;
    };

    const renderQuestion = (question, index) => {
        let optionsHtml = '';
        if (question.question_type === 'multiple_choice') {
            optionsHtml = question.options_json.map(option => `
                <div class="flex items-center mb-2">
                    <input type="radio" id="q${question.id}-option-${option.key}" name="question-${question.id}" value="${option.key}" class="form-radio h-4 w-4 text-blue-600" data-question-id="${question.id}">
                    <label for="q${question.id}-option-${option.key}" class="ml-2 text-gray-700">${option.key}. ${option.value}</label>
                </div>
            `).join('');
        } else if (question.question_type === 'true_false') {
            optionsHtml = `
                <div class="flex items-center mb-2">
                    <input type="radio" id="q${question.id}-option-true" name="question-${question.id}" value="True" class="form-radio h-4 w-4 text-blue-600" data-question-id="${question.id}">
                    <label for="q${question.id}-option-true" class="ml-2 text-gray-700">True</label>
                </div>
                <div class="flex items-center mb-2">
                    <input type="radio" id="q${question.id}-option-false" name="question-${question.id}" value="False" class="form-radio h-4 w-4 text-blue-600" data-question-id="${question.id}">
                    <label for="q${question.id}-option-false" class="ml-2 text-gray-700">False</label>
                </div>
            `;
        } else if (question.question_type === 'short_answer') {
            optionsHtml = `
                <div>
                    <label for="q${question.id}-short-answer" class="sr-only">Your Answer</label>
                    <input type="text" id="q${question.id}-short-answer" name="question-${question.id}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mt-2" placeholder="Your short answer" data-question-id="${question.id}">
                </div>
            `;
        }

        // Check if an answer was previously selected/entered and pre-fill
        const currentAnswer = userAnswers[question.id];
        let prefillScript = '';
        if (currentAnswer) {
            if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
                prefillScript = `document.getElementById('q${question.id}-option-${currentAnswer}').checked = true;`;
            } else if (question.question_type === 'short_answer') {
                prefillScript = `document.getElementById('q${question.id}-short-answer').value = \`${currentAnswer.replace(/`/g, '\\`')}\`;`; // Escape backticks
            }
        }

        return `
            <div class="bg-white p-6 rounded-lg shadow-md mb-6 question-card" id="question-${question.id}">
                <p class="text-gray-500 text-sm mb-2">Question ${index + 1} of ${examQuestions.length} (${question.marks} Marks)</p>
                <p class="text-lg font-medium text-gray-800 mb-4">${question.question_text}</p>
                <div class="options-container">
                    ${optionsHtml}
                </div>
            </div>
            <script>${prefillScript}</script>
        `;
    };

    const setupExamEventListeners = () => {
        document.getElementById('submit-exam-btn').addEventListener('click', confirmAndSubmitExam);

        // Event delegation for answers
        document.getElementById('exam-questions-container').addEventListener('change', (event) => {
            const target = event.target;
            const questionId = target.dataset.questionId;
            if (questionId) {
                userAnswers[questionId] = target.value;
            }
        });

        document.getElementById('exam-questions-container').addEventListener('input', (event) => {
            const target = event.target;
            const questionId = target.dataset.questionId;
            if (questionId && target.type === 'text') { // Only for short answer inputs
                userAnswers[questionId] = target.value;
            }
        });
    };

    const startTimer = (durationMinutes) => {
        clearInterval(timerInterval); // Clear any existing timer
        timeLeft = durationMinutes * 60; // Convert to seconds
        const timerDisplay = document.getElementById('exam-timer');

        if (!timerDisplay) {
            console.error('Timer display element not found.');
            return;
        }

        timerInterval = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;

            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                window.showToast('Time is up! Submitting your exam...', 'info', 5000);
                submitExam(); // Auto-submit when time runs out
            }
            timeLeft--;
        }, 1000);
    };

    const confirmAndSubmitExam = () => {
        window.showModal(`
            <p class="mb-4">Are you sure you want to submit the exam?</p>
            <div class="flex justify-end space-x-4">
                <button id="cancel-submit-btn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Cancel</button>
                <button id="confirm-submit-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Confirm Submit</button>
            </div>
        `, 'Confirm Exam Submission');

        document.getElementById('cancel-submit-btn').addEventListener('click', window.hideModal);
        document.getElementById('confirm-submit-btn').addEventListener('click', () => {
            window.hideModal();
            submitExam();
        });
    };

    const submitExam = async () => {
        clearInterval(timerInterval); // Stop the timer
        document.getElementById('submit-exam-btn').disabled = true; // Prevent multiple submissions

        const submissionPayload = {
            exam_id: currentExam.id,
            answers: Object.keys(userAnswers).map(qId => ({
                question_id: qId,
                selected_option: userAnswers[qId]
            }))
        };

        window.showToast('Submitting your exam...', 'info');

        try {
            console.log('Attempting to submit exam with payload:', submissionPayload);
            const response = await apiFetch('take_exam', 'POST', submissionPayload);
            console.log('API responded successfully with:', response);
            console.log('Current Exam Details (for total_marks):', currentExam);

            // Construct the message parts first for clarity
            const scoreMessage = `Exam submitted! Score: ${response.score} / ${currentExam.total_marks}`;
            const percentageValue = parseFloat(response.total_percentage); // Ensure it's a number
            const percentageMessage = `${percentageValue.toFixed(2)}%`;

            // This is the crucial line: Use BACKTICKS ( ` ) for the string template!
            window.showToast(`${scoreMessage} (${percentageMessage})`, 'success', 8000);

            // Display results or navigate to performance page
            renderExamResults(response);
            console.log('Successfully rendered exam results.');

        } catch (error) {
            console.error('Error in submitExam function catch block:', error); // Crucial: Look here!
            window.showToast('Failed to submit exam. Please try again.', 'error', 5000);
            document.getElementById('submit-exam-btn').disabled = false;
        }
    };

    const renderExamResults = (results) => {
        let resultMessage = `You scored ${results.score} out of ${currentExam.total_marks} marks.`;
        if (currentExam.total_marks > 0) {
             // FIX APPLIED HERE TOO: Convert total_percentage to a float
             resultMessage += ` That's ${parseFloat(results.total_percentage).toFixed(2)}%!`;
             // FIX APPLIED HERE TOO: Convert total_percentage to a float for comparison
             if (parseFloat(results.total_percentage) >= currentExam.pass_marks) {
                resultMessage += `<br><span class="text-green-600 font-bold">Congratulations! You passed!</span>`;
            } else {
                resultMessage += `<br><span class="text-red-600 font-bold">You did not pass. Keep practicing!</span>`;
            }
        } else {
            resultMessage += `<br>No total marks specified for this exam, so percentage cannot be calculated.`;
        }

        contentArea.innerHTML = `
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Exam Results: ${currentExam.title}</h2>
            <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
                <p class="font-bold text-xl">Exam Completed!</p>
                <p class="mt-2">${resultMessage}</p>
                <p class="mt-2">Attempt Number: ${results.attempt_no}</p>
                <p>Questions Attempted: ${results.questions_attempted} / ${results.total_questions_in_exam}</p>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 class="text-xl font-semibold mb-4 text-gray-800">Review Questions (Coming Soon)</h3>
                <p class="text-gray-600">Detailed review of your answers will be available in a future update.</p>
                <button onclick="window.navigateTo('take-exam')" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
                    Take Another Exam
                </button>
                <button onclick="window.navigateTo('dashboard')" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mt-4 ml-2">
                    Go to Dashboard
                </button>
            </div>
        `;
    };


    // --- Main Page Load Function ---
    const loadTakeExamPage = async () => {
        await fetchDataForExamSelectionDropdowns();

        contentArea.innerHTML = `
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Take an Exam</h2>
            <div id="exam-selection-section" class="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 class="text-2xl font-semibold mb-4 text-gray-800">Select Exam to Take</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label for="take-exam-subject-filter" class="block text-gray-700 text-sm font-bold mb-2">Select Subject:</label>
                        <select id="take-exam-subject-filter" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                            <option value="">-- Select a Subject --</option>
                            ${allSubjects.map(subject => `<option value="${subject.id}">${subject.name} (${subject.subject_code})</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label for="take-exam-lesson-filter" class="block text-gray-700 text-sm font-bold mb-2">Select Lesson:</label>
                        <select id="take-exam-lesson-filter" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" disabled>
                            <option value="">-- Select a Subject first --</option>
                        </select>
                    </div>
                    <div>
                        <label for="take-exam-topic-filter" class="block text-gray-700 text-sm font-bold mb-2">Select Topic:</label>
                        <select id="take-exam-topic-filter" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" disabled>
                            <option value="">-- Select a Lesson first --</option>
                        </select>
                    </div>
                </div>
                <div class="mb-4">
                    <label for="take-exam-selector" class="block text-gray-700 text-sm font-bold mb-2">Choose Exam:</label>
                    <select id="take-exam-selector" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required disabled>
                        <option value="">-- Select a Topic first --</option>
                    </select>
                    ${allExams.length === 0 ? '<p class="text-red-500 text-xs italic mt-1">No exams available. Please create exams first.</p>' : ''}
                </div>
                <div class="flex justify-end">
                    <button id="start-exam-btn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline" disabled>
                        Start Exam
                    </button>
                </div>
            </div>

            <div id="exam-active-section" class="hidden">
                </div>
        `;

        // Attach event listeners for selection
        document.getElementById('take-exam-subject-filter').addEventListener('change', (event) => {
            populateLessonDropdown(event.target.value);
            document.getElementById('start-exam-btn').disabled = true; // Disable start button until exam is selected
        });
        document.getElementById('take-exam-lesson-filter').addEventListener('change', (event) => {
            populateTopicDropdown(event.target.value);
            document.getElementById('start-exam-btn').disabled = true;
        });
        document.getElementById('take-exam-topic-filter').addEventListener('change', (event) => {
            populateExamDropdown(event.target.value);
            document.getElementById('start-exam-btn').disabled = true;
        });
        document.getElementById('take-exam-selector').addEventListener('change', (event) => {
            document.getElementById('start-exam-btn').disabled = !event.target.value; // Enable if an exam is selected
        });

        document.getElementById('start-exam-btn').addEventListener('click', startSelectedExam);

        // Initialize dropdowns
        populateLessonDropdown('');
    };

    const startSelectedExam = async () => {
        const examId = document.getElementById('take-exam-selector').value;
        if (!examId) {
            window.showToast('Please select an exam to start.', 'error');
            return;
        }

        window.showToast('Loading exam...', 'info');
        try {
            const data = await apiFetch(`take_exam?exam_id=${examId}`);
            currentExam = data.exam;
            examQuestions = data.questions;
            userAnswers = {}; // Reset user answers for new exam

            if (examQuestions.length === 0) {
                window.showToast('This exam has no questions yet. Please add questions first.', 'warning');
                return;
            }

            document.getElementById('exam-selection-section').classList.add('hidden');
            const examActiveSection = document.getElementById('exam-active-section');
            examActiveSection.classList.remove('hidden');

            examActiveSection.innerHTML = `
                ${renderExamDetails(currentExam)}
                <div id="exam-questions-container">
                    ${examQuestions.map((q, i) => renderQuestion(q, i)).join('')}
                </div>
                <div class="flex justify-center mt-6">
                    <button id="submit-exam-btn-bottom" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-md focus:outline-none focus:shadow-outline">
                        Submit Exam
                    </button>
                </div>
            `;
            // Attach event listener to the bottom submit button as well
            document.getElementById('submit-exam-btn-bottom').addEventListener('click', confirmAndSubmitExam);


            startTimer(currentExam.duration_minutes);
            setupExamEventListeners();

            // Re-run the prefill scripts after the DOM is rendered
            document.querySelectorAll('#exam-active-section script').forEach(script => {
                try {
                    eval(script.textContent); // DANGER: eval can be dangerous. For this controlled environment, it's acceptable.
                                            // A safer way would be to pass `userAnswers` to renderQuestion
                                            // and directly set checked/value attributes within renderQuestion.
                } catch (e) {
                    console.error("Error executing prefill script:", e);
                }
            });


        } catch (error) {
            console.error('Error starting exam:', error);
            window.showToast('Failed to load exam. Please try again.', 'error');
            document.getElementById('exam-selection-section').classList.remove('hidden'); // Show selection again
            document.getElementById('exam-active-section').classList.add('hidden'); // Hide active exam
        }
    };

    return {
        loadTakeExamPage: loadTakeExamPage
    };
})();