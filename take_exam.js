// take_exam.js
// File Version: 1.0.6 (Further Updated for Exam Filtering: Subject-level Custom Exams - fixing direct display on subject selection)
// App Version: 0.0.14

const takeExamModule = (() => {
    const contentArea = document.getElementById('content-area');
    let allSubjects = [];
    let allLessons = [];
    let allTopics = [];
    let allExams = []; // This should include lesson_id and topic_id for filtering

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
            // Assuming the 'exams' API endpoint returns exams with their associated
            // topic_id and lesson_id (even if topic_id is null for custom exams).
            allExams = await apiFetch('exams');
            console.log('Fetched Exams:', allExams); // Debugging
        } catch (error) {
            console.error('Failed to fetch data for exam selection dropdowns:', error);
            window.showToast('Could not load subjects/lessons/topics/exams. Please refresh.', 'error');
            allSubjects = [];
            allLessons = [];
            allTopics = [];
            allExams = [];
        }
    };

    // --- Cascading Dropdown Logic ---
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
            examDropdown.innerHTML = '<option value="">-- Select a Subject, Lesson, or Topic first --</option>'; // Updated prompt
            examDropdown.disabled = true;
            // Crucial: When no subject is selected, clear and disable exam dropdown
            populateExamDropdown('', '', ''); // Clear all filters
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
            // If no lessons, still call populateExamDropdown with the subject ID
            populateExamDropdown('', '', selectedSubjectId);
        } else {
            let optionsHtml = '<option value="">-- Select a Lesson --</option>';
            optionsHtml += filteredLessons.map(lesson =>
                `<option value="${lesson.id}">${lesson.title}</option>`
            ).join('');
            lessonDropdown.innerHTML = optionsHtml;
            lessonDropdown.disabled = false;
            // When lesson dropdown is populated, reset topic and populate exams based on subject
            populateTopicDropdown(''); // Reset topic dropdown, passing empty lesson ID to populate exams
            // Crucial: After populating lessons, call populateExamDropdown with the selected subject ID
            // This ensures exams associated with the subject (including custom ones without topics) are shown
            populateExamDropdown('', '', selectedSubjectId);
        }
    };

    const populateTopicDropdown = (selectedLessonId) => {
        const topicDropdown = document.getElementById('take-exam-topic-filter');
        const examDropdown = document.getElementById('take-exam-selector');
        topicDropdown.innerHTML = '';
        examDropdown.innerHTML = ''; // Clear exam dropdown to be re-populated

        const selectedSubjectId = document.getElementById('take-exam-subject-filter').value; // Get current subject

        if (!selectedLessonId) {
            topicDropdown.innerHTML = '<option value="">-- Select a Lesson first --</option>';
            topicDropdown.disabled = true;
            examDropdown.innerHTML = '<option value="">-- Select a Lesson or Topic first --</option>'; // Updated prompt
            examDropdown.disabled = true;
            // If no lesson selected, but a subject *is* selected, populate exams based on subject
            populateExamDropdown('', '', selectedSubjectId);
            return;
        }

        const filteredTopics = allTopics.filter(topic =>
            parseInt(topic.lesson_id) === parseInt(selectedLessonId)
        );

        if (filteredTopics.length === 0) {
            topicDropdown.innerHTML = '<option value="">-- No Topics for this Lesson --</option>';
            topicDropdown.disabled = true;
            window.showToast('No topics found for the selected lesson. Showing exams directly related to the lesson.', 'info');
            // If no topics, still call populateExamDropdown, passing the lesson_id but no topic_id
            populateExamDropdown('', selectedLessonId);
        } else {
            let optionsHtml = '<option value="">-- Select a Topic --</option>';
            optionsHtml += filteredTopics.map(topic =>
                `<option value="${topic.id}">${topic.name}</option>`
            ).join('');
            topicDropdown.innerHTML = optionsHtml;
            topicDropdown.disabled = false;
            // After populating topics, populate exams for the *selected lesson* (no specific topic yet)
            populateExamDropdown('', selectedLessonId);
        }
    };

    // MODIFIED: populateExamDropdown now takes selectedTopicId, selectedLessonId, AND selectedSubjectId (optional override)
    const populateExamDropdown = (selectedTopicId, selectedLessonId, selectedSubjectIdOverride = null) => {
        const examDropdown = document.getElementById('take-exam-selector');
        examDropdown.innerHTML = '';

        let filteredExams = [];
        // Get the current selected subject from the dropdown, or use the override if provided
        const currentSelectedSubjectId = selectedSubjectIdOverride || document.getElementById('take-exam-subject-filter').value;


        if (selectedTopicId) {
            // Scenario 1: A specific topic is selected.
            // Show exams explicitly tied to this topic.
            filteredExams = allExams.filter(exam =>
                parseInt(exam.topic_id) === parseInt(selectedTopicId)
            );
        } else if (selectedLessonId) {
            // Scenario 2: A lesson is selected, but NO topic is selected.
            // Show custom exams specific to this lesson (topic_id is NULL/undefined, and lesson_id matches)
            // AND any regular exams whose topic_id belongs to a topic under this lesson.

            const topicIdsInSelectedLesson = allTopics
                .filter(topic => parseInt(topic.lesson_id) === parseInt(selectedLessonId))
                .map(topic => parseInt(topic.id));

            filteredExams = allExams.filter(exam => {
                // Check if it's a custom exam (topic_id is null/undefined) for the selected lesson
                const isCustomExamForLesson = (exam.topic_id === null || typeof exam.topic_id === 'undefined') &&
                                              parseInt(exam.lesson_id) === parseInt(selectedLessonId);

                // Check if it's a regular exam whose topic_id belongs to a topic within the selected lesson
                const isRegularExamForTopicInLesson = (exam.topic_id !== null && typeof exam.topic_id !== 'undefined' && topicIdsInSelectedLesson.includes(parseInt(exam.topic_id)));
                
                return isCustomExamForLesson || isRegularExamForTopicInLesson;
            });

        } else if (currentSelectedSubjectId) {
            // Scenario 3: Only a subject is selected (neither lesson nor topic specific).
            // Show all exams (regular AND custom exams without topics) that belong to this subject.

            // First, get all lesson IDs belonging to the selected subject
            const lessonIdsInSelectedSubject = allLessons
                .filter(lesson => parseInt(lesson.subject_id) === parseInt(currentSelectedSubjectId))
                .map(lesson => parseInt(lesson.id));

            // Then, get all topic IDs belonging to these lessons
            const topicIdsInSelectedSubject = allTopics
                .filter(topic => lessonIdsInSelectedSubject.includes(parseInt(topic.lesson_id)))
                .map(topic => parseInt(topic.id));

            filteredExams = allExams.filter(exam => {
                // Include exams that are tied to a topic within the selected subject's lessons
                const isRegularExamInSubject = (exam.topic_id !== null && typeof exam.topic_id !== 'undefined' && topicIdsInSelectedSubject.includes(parseInt(exam.topic_id)));
                
                // Include custom exams that are tied to a lesson within the selected subject (topic_id is null/undefined)
                const isCustomExamInLessonOfSubject = (exam.topic_id === null || typeof exam.topic_id === 'undefined') && 
                                                      exam.lesson_id && // Ensure custom exam has a lesson_id
                                                      lessonIdsInSelectedSubject.includes(parseInt(exam.lesson_id));

                // NEW: Include custom exams that are tied directly to the subject (both lesson_id and topic_id are null)
                const isDirectSubjectCustomExam = (exam.topic_id === null || typeof exam.topic_id === 'undefined') &&
                                                  (exam.lesson_id === null || typeof exam.lesson_id === 'undefined') &&
                                                  parseInt(exam.subject_id) === parseInt(currentSelectedSubjectId);

                return isRegularExamInSubject || isCustomExamInLessonOfSubject || isDirectSubjectCustomExam;
            });

        } else {
            // No subject, lesson, or topic selected
            examDropdown.innerHTML = '<option value="">-- Select a Subject, Lesson, or Topic first --</option>';
            examDropdown.disabled = true;
            return;
        }

        if (filteredExams.length === 0) {
            examDropdown.innerHTML = '<option value="">-- No Exams available --</option>';
            examDropdown.disabled = true;
            window.showToast('No exams found for the selected criteria.', 'info');
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
        const negativeMarkInfo = parseFloat(exam.negative_mark_value) > 0 ?
            `<p class="text-red-600 font-semibold mt-1">Warning: Negative marking applies! Incorrect answers will deduct ${parseFloat(exam.negative_mark_value).toFixed(2)} marks.</p>` : '';

        return `
            <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6" role="alert">
                <p class="font-bold text-xl">${exam.title}</p>
                <p>Subject: ${exam.subject_name || 'N/A'} > Lesson: ${exam.lesson_title || 'N/A'} > Topic: ${exam.topic_name || 'N/A'}</p>
                <p>Duration: <span class="font-bold">${exam.duration_minutes} minutes</span></p>
                <p>Total Questions: <span class="font-bold">${exam.total_questions}</span></p>
                <p>Total Marks: <span class="font-bold">${exam.total_marks}</span> | Pass Marks: <span class="font-bold">${exam.pass_marks}</span></p>
                ${negativeMarkInfo}
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

    // MODIFIED: renderQuestion to pre-fill directly without eval()
    const renderQuestion = (question, index) => {
        let optionsHtml = '';
        const currentAnswer = userAnswers[question.id]; // Get the previously selected/entered answer

        if (question.question_type === 'multiple_choice') {
            optionsHtml = question.options_json.map(option => `
                <div class="flex items-center mb-2">
                    <input type="radio" id="q${question.id}-option-${option.key}" name="question-${question.id}" value="${option.key}" class="form-radio h-4 w-4 text-blue-600" data-question-id="${question.id}" ${currentAnswer === option.key ? 'checked' : ''}>
                    <label for="q${question.id}-option-${option.key}" class="ml-2 text-gray-700">${option.key}. ${option.value}</label>
                </div>
            `).join('');
        } else if (question.question_type === 'true_false') {
            optionsHtml = `
                <div class="flex items-center mb-2">
                    <input type="radio" id="q${question.id}-option-true" name="question-${question.id}" value="True" class="form-radio h-4 w-4 text-blue-600" data-question-id="${question.id}" ${currentAnswer === 'True' ? 'checked' : ''}>
                    <label for="q${question.id}-option-true" class="ml-2 text-gray-700">True</label>
                </div>
                <div class="flex items-center mb-2">
                    <input type="radio" id="q${question.id}-option-false" name="question-${question.id}" value="False" class="form-radio h-4 w-4 text-blue-600" data-question-id="${question.id}" ${currentAnswer === 'False' ? 'checked' : ''}>
                    <label for="q${question.id}-option-false" class="ml-2 text-gray-700">False</label>
                </div>
            `;
        } else if (question.question_type === 'short_answer') {
            // Escape double quotes for HTML attribute
            const escapedAnswer = currentAnswer ? currentAnswer.replace(/"/g, '&quot;') : '';
            optionsHtml = `
                <div>
                    <label for="q${question.id}-short-answer" class="sr-only">Your Answer</label>
                    <input type="text" id="q${question.id}-short-answer" name="question-${question.id}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mt-2" placeholder="Your short answer" data-question-id="${question.id}" value="${escapedAnswer}">
                </div>
            `;
        }

        return `
            <div class="bg-white p-6 rounded-lg shadow-md mb-6 question-card" id="question-${question.id}">
                <p class="text-gray-500 text-sm mb-2">Question ${index + 1} of ${examQuestions.length} (${question.marks} Marks)</p>
                <p class="text-lg font-medium text-gray-800 mb-4">${question.question_text}</p>
                <div class="options-container">
                    ${optionsHtml}
                </div>
            </div>
        `;
    };


    const setupExamEventListeners = () => {
        document.getElementById('submit-exam-btn').addEventListener('click', confirmAndSubmitExam);

        // Event delegation for answers
        document.getElementById('exam-questions-container').addEventListener('change', (event) => {
            const target = event.target;
            const questionId = target.dataset.questionId;
            if (questionId && (target.type === 'radio' || target.type === 'checkbox')) {
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
        if (document.getElementById('submit-exam-btn-bottom')) {
            document.getElementById('submit-exam-btn-bottom').disabled = true;
        }

        // Map userAnswers to the format expected by the backend
        const submissionPayload = {
            exam_id: currentExam.id,
            answers: Object.keys(userAnswers).map(qId => ({
                question_id: parseInt(qId), // Ensure question_id is integer
                selected_option: userAnswers[qId]
            }))
        };

        window.showToast('Submitting your exam...', 'info');

        try {
            console.log('Attempting to submit exam with payload:', submissionPayload);
            const response = await apiFetch('take_exam', 'POST', submissionPayload);
            console.log('API responded successfully with:', response);
            console.log('Current Exam Details (for total_marks):', currentExam);

            // Display results or navigate to performance page
            renderExamResults(response);
            console.log('Successfully rendered exam results.');

        } catch (error) {
            console.error('Error in submitExam function catch block:', error);
            window.showToast('Failed to submit exam. Please try again.', 'error', 5000);
            document.getElementById('submit-exam-btn').disabled = false;
            if (document.getElementById('submit-exam-btn-bottom')) {
                document.getElementById('submit-exam-btn-bottom').disabled = false;
            }
        }
    };

    const renderExamResults = (results) => {
        let resultMessage = `You scored **${parseFloat(results.score).toFixed(2)}** out of **${currentExam.total_marks}** marks.`;
        const percentageValue = parseFloat(results.total_percentage); // Ensure it's a number
        const scorePercentage = percentageValue.toFixed(2);

        resultMessage += ` That's **${scorePercentage}%**!`;

        let passStatusMessage = '';
        if (typeof results.is_passed !== 'undefined') { // Check if is_passed is provided by API
             if (results.is_passed) {
                passStatusMessage = `<span class="text-green-600 font-bold">Congratulations! You passed!</span>`;
            } else {
                passStatusMessage = `<span class="text-red-600 font-bold">You did not pass. Keep practicing!</span>`;
            }
        } else if (parseFloat(currentExam.pass_marks) > 0) { // Fallback if API doesn't send is_passed
            if (parseFloat(results.score) >= parseFloat(currentExam.pass_marks)) {
                passStatusMessage = `<span class="text-green-600 font-bold">Congratulations! You passed!</span>`;
            } else {
                passStatusMessage = `<span class="text-red-600 font-bold">You did not pass. Keep practicing!</span>`;
            }
        }


        contentArea.innerHTML = `
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Exam Results: ${currentExam.title}</h2>
            <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
                <p class="font-bold text-xl">Exam Completed!</p>
                <p class="mt-2">${resultMessage}</p>
                <p class="mt-2">${passStatusMessage}</p>
                <p class="mt-2">Attempt Number: ${results.attempt_no}</p>
                <p>Correct Answers: **${results.correct_count}**</p>
                <p>Incorrect Answers: **${results.incorrect_count}**</p>
                <p>Unanswered Questions: **${results.unanswered_count}**</p>
                <p>Total Questions in Exam: **${results.total_questions_in_exam}**</p>
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
                        <option value="">-- Select a Subject, Lesson, or Topic first --</option> </select>
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
            const selectedSubjectId = event.target.value;
            populateLessonDropdown(selectedSubjectId); // This will handle populating lessons and also triggering exam population
            document.getElementById('start-exam-btn').disabled = true; // Disable start button until exam is selected
        });
        document.getElementById('take-exam-lesson-filter').addEventListener('change', (event) => {
            const selectedLessonId = event.target.value;
            populateTopicDropdown(selectedLessonId);
            // Also update exam dropdown based on the selected lesson (no specific topic yet)
            populateExamDropdown('', selectedLessonId); // Pass empty topic ID, but selected lesson ID
            document.getElementById('start-exam-btn').disabled = true;
        });
        document.getElementById('take-exam-topic-filter').addEventListener('change', (event) => {
            const selectedTopicId = event.target.value;
            const selectedLessonId = document.getElementById('take-exam-lesson-filter').value; // Get current lesson ID
            populateExamDropdown(selectedTopicId, selectedLessonId); // Pass both
            document.getElementById('start-exam-btn').disabled = true;
        });
        document.getElementById('take-exam-selector').addEventListener('change', (event) => {
            document.getElementById('start-exam-btn').disabled = !event.target.value; // Enable if an exam is selected
        });

        document.getElementById('start-exam-btn').addEventListener('click', startSelectedExam);

        // Initialize dropdowns (important for initial state)
        // This will ensure all other dropdowns are disabled and show initial prompts
        // No subject is selected initially, so it will call populateLessonDropdown('')
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