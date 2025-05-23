// custom_exam_topics.js
// Version: 1.0.5 (Adjusted lesson property from 'name' to 'title' for display)

const customExamTopicsModule = (() => {
    const contentArea = document.getElementById('content-area');

    // State variables for filters
    let selectedSubjectId = null;
    let selectedLessonId = null;
    let topicsWithQuestions = []; // Stores topics with question counts after filtering

    /**
     * Helper to safely call window.apiFetch
     */
    const safeApiFetch = async (endpoint, method = 'GET', data = null) => {
        if (typeof window.apiFetch !== 'function') {
            console.error('Error: window.apiFetch is not defined. Ensure utils.js is loaded.');
            throw new Error('API fetch utility not available.');
        }
        return await window.apiFetch(endpoint, method, data);
    };

    /**
     * Helper to safely call window.showToast
     */
    const safeShowToast = (message, type = 'info') => {
        if (typeof window.showToast !== 'function') {
            console.warn('Warning: window.showToast is not defined. Cannot display toast:', message);
            return;
        }
        window.showToast(message, type);
    };

    /**
     * Renders the main custom exam from topics page.
     */
    const renderPage = async () => {
        console.log('renderPage: Starting to render custom exam topics page.');
        contentArea.innerHTML = `
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Create Custom Exam from Topics</h2>

            <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 class="text-xl font-semibold mb-4 text-gray-800">Filter Topics</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label for="custom-exam-subjects-filter" class="block text-gray-700 text-sm font-bold mb-2">Select Subject:</label>
                        <select id="custom-exam-subjects-filter" class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                            <option value="">Loading Subjects...</option>
                        </select>
                    </div>
                    <div>
                        <label for="custom-exam-lessons-filter" class="block text-gray-700 text-sm font-bold mb-2">Select Lesson <span class="text-red-500">*</span>:</label>
                        <select id="custom-exam-lessons-filter" class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" disabled>
                            <option value="">Select a subject first</option>
                        </select>
                    </div>
                </div>
                <button id="apply-topic-filter-btn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    Apply Filters
                </button>
            </div>

            <div id="topics-questions-table-container" class="bg-white p-6 rounded-lg shadow-md mb-6 hidden">
                <h3 class="text-xl font-semibold mb-4 text-gray-800">Available Topics & Questions</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">No.</th>
                                <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Topic Name</th>
                                <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Total Questions</th>
                                <th class="py-2 px-4 border-b text-left text-sm font-semibold text-gray-600">Questions to Attempt</th>
                            </tr>
                        </thead>
                        <tbody id="topics-questions-table-body">
                            </tbody>
                    </table>
                </div>
            </div>

            <div id="exam-details-form-container" class="bg-white p-6 rounded-lg shadow-md hidden">
                <h3 class="text-xl font-semibold mb-4 text-gray-800">Exam Details</h3>
                <form id="custom-exam-details-form">
                    <div class="mb-4">
                        <label for="exam-title" class="block text-gray-700 text-sm font-bold mb-2">Enter Topics Custom Exam Name:</label>
                        <input type="text" id="exam-title" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                    </div>
                    <div class="mb-4">
                        <label for="exam-duration" class="block text-gray-700 text-sm font-bold mb-2">Exam Duration (minutes):</label>
                        <input type="number" id="exam-duration" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" min="1" required>
                    </div>
                    <div class="mb-4">
                        <label for="exam-total-marks" class="block text-gray-700 text-sm font-bold mb-2">Total Marks:</label>
                        <input type="number" id="exam-total-marks" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" step="0.01" min="0" required>
                    </div>
                    <div class="mb-4">
                        <label for="exam-pass-marks" class="block text-gray-700 text-sm font-bold mb-2">Pass Mark:</label>
                        <input type="number" id="exam-pass-marks" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" step="0.01" min="0" required>
                    </div>
                     <div class="mb-4">
                        <label for="exam-instructions" class="block text-gray-700 text-sm font-bold mb-2">Instructions (Optional):</label>
                        <textarea id="exam-instructions" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" rows="4"></textarea>
                    </div>
                    <div class="mb-4">
                        <label for="exam-negative-marking" class="block text-gray-700 text-sm font-bold mb-2">Negative Mark Value (e.g., 0.25 for 25% deduction):</label>
                        <input type="number" id="exam-negative-marking" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" step="0.01" min="0" value="0.00">
                    </div>
                    <button type="submit" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        Save Custom Exam
                    </button>
                </form>
            </div>
        `;

        await populateSubjectFilter();
        attachEventListeners();
        console.log('renderPage: Page rendered and event listeners attached.');
    };

    /**
     * Populates the subject filter dropdown.
     */
    const populateSubjectFilter = async () => {
        console.log('populateSubjectFilter: Attempting to populate subjects...');
        const subjectSelect = document.getElementById('custom-exam-subjects-filter');
        subjectSelect.innerHTML = '<option value="">Loading Subjects...</option>'; // Set loading message
        try {
            const subjects = await safeApiFetch('subjects');
            console.log('populateSubjectFilter: API response for subjects:', subjects);

            if (!Array.isArray(subjects)) {
                throw new Error('API did not return an array for subjects.');
            }

            if (subjects.length === 0) {
                subjectSelect.innerHTML = '<option value="">No Subjects found</option>';
                safeShowToast('No subjects found in the database.', 'info');
                console.log('populateSubjectFilter: No subjects found.');
            } else {
                let optionsHtml = '<option value="">Select a Subject</option>';
                subjects.forEach(subject => {
                    if (subject && subject.id && subject.name) {
                        optionsHtml += `<option value="${subject.id}">${subject.name}</option>`;
                    } else {
                        console.warn('populateSubjectFilter: Skipping malformed subject object:', subject);
                    }
                });
                subjectSelect.innerHTML = optionsHtml;
                console.log(`populateSubjectFilter: Populated ${subjects.length} subjects.`);
            }
        } catch (error) {
            console.error('populateSubjectFilter: Error fetching subjects:', error);
            subjectSelect.innerHTML = '<option value="">Error loading subjects</option>';
            safeShowToast('Failed to load subjects. Check console for details.', 'error');
        }
    };

    /**
     * Populates the lesson filter dropdown based on the selected subject.
     */
    const populateLessonFilter = async (subjectId) => {
        console.log('populateLessonFilter: Called with subjectId:', subjectId);
        const lessonSelect = document.getElementById('custom-exam-lessons-filter');

        // Clear existing options and set a loading/initial state
        lessonSelect.innerHTML = '<option value="">Loading Lessons...</option>';
        lessonSelect.disabled = true; // Disable until data is ready

        // Reset topic table/form when subject changes
        document.getElementById('topics-questions-table-container').classList.add('hidden');
        document.getElementById('exam-details-form-container').classList.add('hidden');

        if (!subjectId) {
            console.log('populateLessonFilter: No subjectId provided. Resetting lesson dropdown.');
            lessonSelect.innerHTML = '<option value="">Select a subject first</option>';
            selectedLessonId = null; // Ensure lesson ID is reset
            return;
        }

        try {
            console.log(`populateLessonFilter: Attempting to fetch lessons for subject_id=${subjectId}`);
            // Expects an array of objects like: [{ id: 101, title: 'Kinematics', subject_id: 1 }]
            // We're now explicitly using 'title' from the API response
            const lessons = await safeApiFetch(`lessons?subject_id=${subjectId}`);
            console.log('populateLessonFilter: Raw API response for lessons (filtered by subject):', lessons);

            if (!Array.isArray(lessons)) {
                throw new Error('API did not return an array for lessons.');
            }

            if (lessons.length === 0) {
                console.log('populateLessonFilter: No lessons found for this subject. Setting message.');
                lessonSelect.innerHTML = '<option value="">No lessons found for this subject</option>';
                selectedLessonId = null; // If no lessons, ensure state is null
                safeShowToast('No lessons found for the selected subject.', 'info');
            } else {
                console.log(`populateLessonFilter: Found ${lessons.length} lessons. Populating dropdown.`);
                let optionsHtml = '<option value="">Select a Lesson</option>';
                lessons.forEach(lesson => {
                    // *** FIX IS HERE: Change lesson.name to lesson.title ***
                    if (lesson && lesson.id && lesson.title) { // Expects 'title' property
                        optionsHtml += `<option value="${lesson.id}">${lesson.title}</option>`; // Use 'title' for display
                    } else {
                        console.warn('populateLessonFilter: Skipping malformed lesson object (missing id or title):', lesson);
                    }
                });
                lessonSelect.innerHTML = optionsHtml;

                // If there's exactly one lesson, pre-select it and populate topics
                if (lessons.length === 1) {
                    const firstLessonId = lessons[0].id;
                    lessonSelect.value = firstLessonId;
                    selectedLessonId = parseInt(firstLessonId, 10);
                    console.log('populateLessonFilter: Auto-selected single lesson:', selectedLessonId);
                    // Decide if you want to auto-apply filters here or rely on the 'Apply Filters' button
                    // loadTopicsWithQuestionCounts(); // Uncomment this line if you want auto-apply
                } else {
                    // Otherwise, ensure selectedLessonId reflects current dropdown value
                    selectedLessonId = lessonSelect.value === "" ? null : parseInt(lessonSelect.value, 10);
                    console.log('populateLessonFilter: Lessons available, current selectedLessonId (from dropdown):', selectedLessonId);
                }
            }
            lessonSelect.disabled = false; // Enable the dropdown
        } catch (error) {
            console.error('populateLessonFilter: Critical Error fetching or processing lessons:', error);
            lessonSelect.innerHTML = '<option value="">Error loading lessons</option>';
            safeShowToast('Failed to load lessons. Check console for details.', 'error');
            selectedLessonId = null; // Reset on error
        }
    };


    /**
     * Fetches and displays topics with question counts based on filters.
     */
    const loadTopicsWithQuestionCounts = async () => {
        console.log('loadTopicsWithQuestionCounts: Attempting to load topics with counts.');
        const tableBody = document.getElementById('topics-questions-table-body');
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading topics...</td></tr>';
        document.getElementById('topics-questions-table-container').classList.remove('hidden');
        document.getElementById('exam-details-form-container').classList.add('hidden');

        if (!selectedSubjectId) {
            safeShowToast('Please select a Subject to filter topics.', 'warning');
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">Please select a Subject and Lesson to view topics.</td></tr>';
            document.getElementById('topics-questions-table-container').classList.add('hidden');
            console.log('loadTopicsWithQuestionCounts: Aborting - No subject selected.');
            return;
        }

        if (!selectedLessonId) {
            safeShowToast('Please select a Lesson to filter topics.', 'warning');
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">Please select a Subject and Lesson to view topics.</td></tr>';
            document.getElementById('topics-questions-table-container').classList.add('hidden');
            console.log('loadTopicsWithQuestionCounts: Aborting - No lesson selected.');
            return;
        }


        let url = 'topics_with_question_counts'; // Endpoint for aggregated topic data

        const params = [];
        params.push(`subject_id=${selectedSubjectId}`);
        params.push(`lesson_id=${selectedLessonId}`);


        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }
        console.log('loadTopicsWithQuestionCounts: Fetching URL:', url);

        try {
            // Expects an array of objects like: [{ topic_id: 1, topic_name: 'Vectors', total_questions: 15 }]
            topicsWithQuestions = await safeApiFetch(url);
            console.log('loadTopicsWithQuestionCounts: API response for topics with questions:', topicsWithQuestions);

            if (!Array.isArray(topicsWithQuestions)) {
                throw new Error('API did not return an array for topics with question counts.');
            }

            if (topicsWithQuestions.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">No topics found with questions for the selected filters.</td></tr>';
                document.getElementById('exam-details-form-container').classList.add('hidden');
                console.log('loadTopicsWithQuestionCounts: No topics with questions found for selected filters.');
                safeShowToast('No topics with questions found for the selected subject and lesson.', 'info');
                return;
            }

            tableBody.innerHTML = ''; // Clear loading message

            topicsWithQuestions.forEach((topic, index) => {
                const row = document.createElement('tr');
                row.classList.add(index % 2 === 0 ? 'bg-white' : 'bg-gray-50');
                row.innerHTML = `
                    <td class="py-2 px-4 border-b">${index + 1}</td>
                    <td class="py-2 px-4 border-b">${topic.topic_name}</td>
                    <td class="py-2 px-4 border-b text-center">${topic.total_questions}</td>
                    <td class="py-2 px-4 border-b">
                        <input type="number" data-topic-id="${topic.topic_id}"
                               data-total-questions="${topic.total_questions}"
                               class="num-questions-input shadow appearance-none border rounded w-24 py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                               min="0" max="${topic.total_questions}" value="0">
                    </td>
                `;
                tableBody.appendChild(row);
            });
            document.getElementById('exam-details-form-container').classList.remove('hidden');
            console.log(`loadTopicsWithQuestionCounts: Populated ${topicsWithQuestions.length} topics with question counts.`);
        } catch (error) {
            console.error('loadTopicsWithQuestionCounts: Error fetching topics with questions:', error);
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500">Error loading topics.</td></tr>';
            safeShowToast('Failed to load topics with questions. Check console for details.', 'error');
            document.getElementById('exam-details-form-container').classList.add('hidden');
        }
    };

    /**
     * Handles saving the custom exam.
     */
    const saveCustomExam = async (event) => {
        event.preventDefault();
        console.log('saveCustomExam: Form submission initiated.');

        const title = document.getElementById('exam-title').value.trim();
        const duration_minutes = parseInt(document.getElementById('exam-duration').value, 10);
        const total_marks = parseFloat(document.getElementById('exam-total-marks').value);
        const pass_marks = parseFloat(document.getElementById('exam-pass-marks').value);
        const instructions = document.getElementById('exam-instructions').value.trim();
        const negative_mark_value = parseFloat(document.getElementById('exam-negative-marking').value);

        const selectedQuestionsPerTopic = [];
        let totalQuestionsForExam = 0;

        try {
            document.querySelectorAll('.num-questions-input').forEach(input => {
                const topicId = input.dataset.topicId;
                const numQuestions = parseInt(input.value, 10);
                const totalAvailable = parseInt(input.dataset.totalQuestions, 10);

                if (isNaN(numQuestions) || numQuestions < 0) {
                    safeShowToast(`Invalid number of questions for topic ID ${topicId}. Please enter a non-negative number.`, 'warning');
                    throw new Error('Invalid number of questions for a topic.');
                }
                
                if (numQuestions > 0) { // Only add if questions are selected for this topic
                    if (numQuestions > totalAvailable) {
                        safeShowToast(`Cannot select more than ${totalAvailable} questions for topic ID ${topicId}. You entered ${numQuestions}.`, 'warning');
                        throw new Error('Invalid number of questions selected for a topic.');
                    }
                    selectedQuestionsPerTopic.push({
                        topic_id: parseInt(topicId, 10),
                        num_questions: numQuestions
                    });
                    totalQuestionsForExam += numQuestions;
                }
            });
        } catch (error) {
            console.error("saveCustomExam: Validation error during question selection:", error.message);
            return; // Stop execution
        }

        if (totalQuestionsForExam === 0) {
            safeShowToast('Please enter the number of questions to attempt from at least one topic.', 'warning');
            console.log('saveCustomExam: No questions selected.');
            return;
        }
        if (!title) {
            safeShowToast('Exam Title is required.', 'warning');
            return;
        }
        if (isNaN(duration_minutes) || duration_minutes <= 0) {
            safeShowToast('Exam Duration must be a positive number.', 'warning');
            return;
        }
        if (isNaN(total_marks) || total_marks <= 0) {
            safeShowToast('Total Marks must be a positive number.', 'warning');
            return;
        }
        if (isNaN(pass_marks) || pass_marks <= 0) {
            safeShowToast('Pass Mark must be a positive number.', 'warning');
            return;
        }
        if (pass_marks > total_marks) {
            safeShowToast('Pass marks cannot be greater than total marks.', 'warning');
            return;
        }

        if (selectedSubjectId === null) { // Check for null, not just falsy
             safeShowToast('Subject is required to create a custom exam from topics.', 'error');
             return;
        }
        if (selectedLessonId === null) { // Check for null, not just falsy
             safeShowToast('Lesson is required to create a custom exam from topics.', 'error');
             return;
        }
        console.log('saveCustomExam: All client-side validations passed.');

        const examData = {
            subject_id: selectedSubjectId,
            lesson_id: selectedLessonId,
            title: title,
            duration_minutes: duration_minutes,
            total_marks: total_marks,
            pass_marks: pass_marks,
            instructions: instructions || null,
            total_questions: totalQuestionsForExam,
            type: 'Custom',
            negative_mark_value: negative_mark_value,
            selected_questions_per_topic: selectedQuestionsPerTopic
        };
        console.log('saveCustomExam: Exam data prepared for API:', examData);

        try {
            const response = await safeApiFetch('create_custom_exam_from_topics', 'POST', examData);
            console.log('saveCustomExam: API response for creating exam:', response);
            if (response.success) {
                safeShowToast(response.message || 'Custom exam created successfully!', 'success');
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo('take-exam'); // Assuming this navigates to the exam page
                } else {
                    console.warn('window.navigateTo is not defined. Cannot navigate.');
                    // Consider a fallback like window.location.href = '/take-exam-page.html'
                }
            } else {
                safeShowToast(response.message || 'Failed to create custom exam!', 'error');
            }
        } catch (error) {
            console.error('saveCustomExam: Error saving custom exam:', error);
            // If the error was from internal validation, the toast was already shown
            if (error.message !== 'Invalid number of questions selected for a topic.') {
                safeShowToast('Failed to save custom exam. Check console for details.', 'error');
            }
        }
    };

    /**
     * Attaches all event listeners for the page.
     */
    const attachEventListeners = () => {
        console.log('attachEventListeners: Attaching event listeners.');
        const subjectSelect = document.getElementById('custom-exam-subjects-filter');
        const lessonSelect = document.getElementById('custom-exam-lessons-filter');
        const applyFilterBtn = document.getElementById('apply-topic-filter-btn');
        const examDetailsForm = document.getElementById('custom-exam-details-form');

        if (subjectSelect) {
            subjectSelect.onchange = (event) => {
                const newSubjectId = event.target.value === "" ? null : parseInt(event.target.value, 10);
                console.log('Event: Subject changed from', selectedSubjectId, 'to', newSubjectId);
                selectedSubjectId = newSubjectId;
                selectedLessonId = null; // Reset lesson state variable
                lessonSelect.value = ""; // Clear lesson selection visually
                populateLessonFilter(selectedSubjectId);
            };
        } else {
            console.error('attachEventListeners: Subject select element not found!');
        }

        if (lessonSelect) {
            lessonSelect.onchange = (event) => {
                const newLessonId = event.target.value === "" ? null : parseInt(event.target.value, 10);
                console.log('Event: Lesson changed from', selectedLessonId, 'to', newLessonId);
                selectedLessonId = newLessonId;
            };
        } else {
            console.error('attachEventListeners: Lesson select element not found!');
        }


        if (applyFilterBtn) {
            applyFilterBtn.onclick = () => {
                console.log('Event: Apply Filters button clicked.');
                loadTopicsWithQuestionCounts();
            };
        } else {
            console.error('attachEventListeners: Apply Filter button not found!');
        }

        if (examDetailsForm) {
            examDetailsForm.onsubmit = saveCustomExam;
        } else {
            console.error('attachEventListeners: Exam details form not found!');
        }
        console.log('attachEventListeners: Event listeners attached successfully.');
    };

    return {
        loadCustomExamTopicsPage: renderPage
    };
})();