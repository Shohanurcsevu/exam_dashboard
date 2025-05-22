// topics.js
// File Version: 1.0.1
// App Version: 0.0.9

const topicsModule = (() => {
    const contentArea = document.getElementById('content-area');
    let allSubjects = []; // To store all subjects for the dropdown
    let allLessons = [];  // To store all lessons for filtering

    // Function to fetch all subjects and lessons
    const fetchDataForDropdowns = async () => {
        try {
            allSubjects = await apiFetch('subjects');
            allLessons = await apiFetch('lessons'); // Get all lessons initially
        } catch (error) {
            console.error('Failed to fetch data for topic form dropdowns:', error);
            window.showToast('Could not load subjects/lessons for the form. Please refresh.', 'error');
            allSubjects = [];
            allLessons = [];
        }
    };

    // Function to render the add topic form
    const renderAddTopicForm = () => {
        const subjectOptions = allSubjects.map(subject =>
            `<option value="${subject.id}">${subject.name} (${subject.subject_code})</option>`
        ).join('');

        return `
            <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 class="text-2xl font-semibold mb-4 text-gray-800">Add New Topic</h3>
                <form id="add-topic-form">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label for="subject-filter" class="block text-gray-700 text-sm font-bold mb-2">Filter by Subject:</label>
                            <select id="subject-filter" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                                <option value="">-- Select a Subject to Filter Lessons --</option>
                                ${subjectOptions}
                            </select>
                        </div>
                        <div>
                            <label for="lesson-id" class="block text-gray-700 text-sm font-bold mb-2">Select Lesson:</label>
                            <select id="lesson-id" name="lesson_id" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required disabled>
                                <option value="">-- Select a Subject first --</option>
                            </select>
                            ${allLessons.length === 0 ? '<p class="text-red-500 text-xs italic mt-1">No lessons available. Please add lessons first.</p>' : ''}
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label for="topic-name" class="block text-gray-700 text-sm font-bold mb-2">Topic Name:</label>
                            <input type="text" id="topic-name" name="name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                        </div>
                        <div>
                            <label for="total-exams" class="block text-gray-700 text-sm font-bold mb-2">Total Exams (Expected):</label>
                            <input type="number" id="total-exams" name="total_exams" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value="0" min="0" required>
                        </div>
                    </div>
                    <div class="mb-6">
                        <label for="chapter-no" class="block text-gray-700 text-sm font-bold mb-2">Chapter No. (Optional):</label>
                        <input type="text" id="chapter-no" name="chapter_no" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                    </div>
                    <div class="mb-6">
                        <label for="description" class="block text-gray-700 text-sm font-bold mb-2">Description (Optional):</label>
                        <textarea id="description" name="description" rows="3" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                    </div>
                    <div class="flex items-center justify-end">
                        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Add Topic
                        </button>
                    </div>
                </form>
            </div>
        `;
    };

    // Function to populate the lesson dropdown based on selected subject
    const populateLessonDropdown = (selectedSubjectId) => {
        const lessonDropdown = document.getElementById('lesson-id');
        lessonDropdown.innerHTML = ''; // Clear existing options

        if (!selectedSubjectId) {
            lessonDropdown.innerHTML = '<option value="">-- Select a Subject first --</option>';
            lessonDropdown.disabled = true;
            return;
        }

        const filteredLessons = allLessons.filter(lesson => 
            parseInt(lesson.subject_id) === parseInt(selectedSubjectId)
        );

        if (filteredLessons.length === 0) {
            lessonDropdown.innerHTML = '<option value="">-- No Lessons for this Subject --</option>';
            lessonDropdown.disabled = true;
            window.showToast('No lessons found for the selected subject. Add lessons to this subject first.', 'info');
        } else {
            let optionsHtml = '<option value="">-- Select a Lesson --</option>';
            optionsHtml += filteredLessons.map(lesson => 
                `<option value="${lesson.id}">${lesson.title}</option>`
            ).join('');
            lessonDropdown.innerHTML = optionsHtml;
            lessonDropdown.disabled = false;
        }
    };

    // Function to render the topics list (no change from previous)
    const renderTopicsList = (topics) => {
        let topicsHtml = `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-2xl font-semibold mb-4 text-gray-800">Existing Topics</h3>
                ${topics.length === 0 ? '<p class="text-gray-600">No topics added yet. Add one above!</p>' : ''}
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lesson</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exams</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chapter No.</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${topics.map(topic => `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${topic.id}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${topic.lesson_title}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${topic.name}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${topic.total_exams}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${topic.chapter_no || 'N/A'}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Date(topic.created_at).toLocaleDateString()}</td>
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
        return topicsHtml;
    };

    // Main function to load topics page
    const loadTopicsPage = async () => {
        // Fetch subjects and lessons first before rendering the form
        await fetchDataForDropdowns(); 

        contentArea.innerHTML = `
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Topic Management</h2>
            <div id="add-topic-section">
                ${renderAddTopicForm()}
            </div>
            <div id="topics-list-section" class="mt-6">
                <div class="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-48">Loading topics...</div>
            </div>
        `;

        // Attach event listeners AFTER the form is in the DOM
        document.getElementById('add-topic-form').addEventListener('submit', handleAddTopic);
        document.getElementById('subject-filter').addEventListener('change', (event) => {
            populateLessonDropdown(event.target.value);
        });

        // Initialize the lesson dropdown (will be disabled by default if no subject selected)
        populateLessonDropdown(''); // Call with empty string to set initial state

        // Fetch and display topics
        await fetchTopics();
    };

    // Function to fetch topics from API (no change from previous)
    const fetchTopics = async () => {
        try {
            const topics = await apiFetch('topics'); // Call the /api/topics endpoint
            document.getElementById('topics-list-section').innerHTML = renderTopicsList(topics);
        } catch (error) {
            // Error handling is already in apiFetch, just update UI
            document.getElementById('topics-list-section').innerHTML = `<div class="bg-white p-6 rounded-lg shadow-md text-red-600">Failed to load topics.</div>`;
        }
    };

    // Function to handle adding a new topic (minor change to grab lesson_id from the correct element)
    const handleAddTopic = async (event) => {
        event.preventDefault(); // Prevent default form submission

        const form = event.target;
        const formData = new FormData(form);
        const topicData = {};
        formData.forEach((value, key) => {
            topicData[key] = value;
        });

        // Ensure lesson_id and total_exams are numbers
        // We now get lesson_id directly from the 'lesson-id' select
        topicData.lesson_id = parseInt(document.getElementById('lesson-id').value, 10); 
        topicData.total_exams = parseInt(topicData.total_exams, 10);
        
        if (isNaN(topicData.lesson_id) || topicData.lesson_id <= 0) {
            window.showToast('Please select a valid Lesson.', 'error');
            return;
        }
        if (isNaN(topicData.total_exams)) {
            topicData.total_exams = 0;
        }

        try {
            const response = await apiFetch('topics', 'POST', topicData);
            window.showToast(response.message, 'success');
            form.reset(); // Clear form
            // Reset subject and lesson dropdowns after successful submission
            document.getElementById('subject-filter').value = '';
            populateLessonDropdown(''); 
            await fetchTopics(); // Refresh the list
            // Optionally, refresh dashboard to see updated topic counts
            // navigateTo('dashboard'); // If you want to force a dashboard refresh
        } catch (error) {
            // Error already shown by apiFetch
        }
    };

    return {
        loadTopicsPage: loadTopicsPage
    };
})();