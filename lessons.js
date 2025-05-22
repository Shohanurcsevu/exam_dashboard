// lessons.js
// File Version: 1.0.0
// App Version: 0.0.7

const lessonsModule = (() => {
    const contentArea = document.getElementById('content-area');
    let allSubjects = []; // To store subjects for the dropdown

    // Function to fetch all subjects for the dropdown
    const fetchAllSubjects = async () => {
        try {
            allSubjects = await apiFetch('subjects'); // Using the existing subjects API
        } catch (error) {
            console.error('Failed to fetch subjects for lessons form:', error);
            window.showToast('Could not load subjects for the form. Please refresh.', 'error');
            allSubjects = []; // Ensure it's empty on error
        }
    };

    // Function to render the add lesson form
    const renderAddLessonForm = () => {
        const subjectOptions = allSubjects.map(subject => 
            `<option value="${subject.id}">${subject.name} (${subject.subject_code})</option>`
        ).join('');

        return `
            <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 class="text-2xl font-semibold mb-4 text-gray-800">Add New Lesson</h3>
                <form id="add-lesson-form">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label for="subject-id" class="block text-gray-700 text-sm font-bold mb-2">Select Subject:</label>
                            <select id="subject-id" name="subject_id" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                                <option value="">-- Select a Subject --</option>
                                ${subjectOptions}
                            </select>
                            ${allSubjects.length === 0 ? '<p class="text-red-500 text-xs italic mt-1">No subjects available. Please add subjects first.</p>' : ''}
                        </div>
                        <div>
                            <label for="lesson-title" class="block text-gray-700 text-sm font-bold mb-2">Lesson Title:</label>
                            <input type="text" id="lesson-title" name="title" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label for="total-topics" class="block text-gray-700 text-sm font-bold mb-2">Total Topics (Expected):</label>
                            <input type="number" id="total-topics" name="total_topics" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value="0" min="0" required>
                        </div>
                        <div>
                            <label for="page-no" class="block text-gray-700 text-sm font-bold mb-2">Page No. (Optional):</label>
                            <input type="text" id="page-no" name="page_no" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                        </div>
                    </div>
                    <div class="mb-6">
                        <label for="description" class="block text-gray-700 text-sm font-bold mb-2">Description (Optional):</label>
                        <textarea id="description" name="description" rows="3" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                    </div>
                    <div class="flex items-center justify-end">
                        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Add Lesson
                        </button>
                    </div>
                </form>
            </div>
        `;
    };

    // Function to render the lessons list
    const renderLessonsList = (lessons) => {
        let lessonsHtml = `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-2xl font-semibold mb-4 text-gray-800">Existing Lessons</h3>
                ${lessons.length === 0 ? '<p class="text-gray-600">No lessons added yet. Add one above!</p>' : ''}
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topics</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page No.</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${lessons.map(lesson => `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${lesson.id}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${lesson.subject_name}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${lesson.title}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${lesson.total_topics}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${lesson.page_no || 'N/A'}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Date(lesson.created_at).toLocaleDateString()}</td>
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
        return lessonsHtml;
    };

    // Main function to load lessons page
    const loadLessonsPage = async () => {
        // Fetch subjects first before rendering the form
        await fetchAllSubjects(); 

        contentArea.innerHTML = `
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Lesson Management</h2>
            <div id="add-lesson-section">
                ${renderAddLessonForm()}
            </div>
            <div id="lessons-list-section" class="mt-6">
                <div class="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-48">Loading lessons...</div>
            </div>
        `;

        // Attach form submission listener AFTER the form is in the DOM
        document.getElementById('add-lesson-form').addEventListener('submit', handleAddLesson);

        // Fetch and display lessons
        await fetchLessons();
    };

    // Function to fetch lessons from API
    const fetchLessons = async () => {
        try {
            const lessons = await apiFetch('lessons'); // Call the /api/lessons endpoint
            document.getElementById('lessons-list-section').innerHTML = renderLessonsList(lessons);
        } catch (error) {
            // Error handling is already in apiFetch, just update UI
            document.getElementById('lessons-list-section').innerHTML = `<div class="bg-white p-6 rounded-lg shadow-md text-red-600">Failed to load lessons.</div>`;
        }
    };

    // Function to handle adding a new lesson
    const handleAddLesson = async (event) => {
        event.preventDefault(); // Prevent default form submission

        const form = event.target;
        const formData = new FormData(form);
        const lessonData = {};
        formData.forEach((value, key) => {
            lessonData[key] = value;
        });

        // Ensure subject_id and total_topics are numbers
        lessonData.subject_id = parseInt(lessonData.subject_id, 10);
        lessonData.total_topics = parseInt(lessonData.total_topics, 10);
        
        if (isNaN(lessonData.subject_id) || lessonData.subject_id <= 0) {
            window.showToast('Please select a valid Subject.', 'error');
            return;
        }
        if (isNaN(lessonData.total_topics)) {
            lessonData.total_topics = 0;
        }

        try {
            const response = await apiFetch('lessons', 'POST', lessonData);
            window.showToast(response.message, 'success');
            form.reset(); // Clear form
            await fetchLessons(); // Refresh the list
            // Optionally, refresh dashboard to see updated lesson counts
            // navigateTo('dashboard'); // If you want to force a dashboard refresh
        } catch (error) {
            // Error already shown by apiFetch
        }
    };

    return {
        loadLessonsPage: loadLessonsPage
    };
})();