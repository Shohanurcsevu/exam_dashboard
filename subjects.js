// subjects.js
// File Version: 1.0.0
// App Version: 0.0.5

const subjectsModule = (() => {
    const contentArea = document.getElementById('content-area');

    // Function to render the add subject form
    const renderAddSubjectForm = () => {
        return `
            <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 class="text-2xl font-semibold mb-4 text-gray-800">Add New Subject</h3>
                <form id="add-subject-form">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label for="subject-name" class="block text-gray-700 text-sm font-bold mb-2">Subject Name:</label>
                            <input type="text" id="subject-name" name="name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                        </div>
                        <div>
                            <label for="subject-code" class="block text-gray-700 text-sm font-bold mb-2">Subject Code:</label>
                            <input type="text" id="subject-code" name="subject_code" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label for="total-lessons" class="block text-gray-700 text-sm font-bold mb-2">Total Lessons (Expected):</label>
                            <input type="number" id="total-lessons" name="total_lessons" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value="0" min="0" required>
                        </div>
                        <div>
                            <label for="book-name" class="block text-gray-700 text-sm font-bold mb-2">Book Name (Optional):</label>
                            <input type="text" id="book-name" name="book_name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                        </div>
                    </div>
                    <div class="mb-6">
                        <label for="description" class="block text-gray-700 text-sm font-bold mb-2">Description (Optional):</label>
                        <textarea id="description" name="description" rows="3" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                    </div>
                    <div class="flex items-center justify-end">
                        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Add Subject
                        </button>
                    </div>
                </form>
            </div>
        `;
    };

    // Function to render the subjects list
    const renderSubjectsList = (subjects) => {
        let subjectsHtml = `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-2xl font-semibold mb-4 text-gray-800">Existing Subjects</h3>
                ${subjects.length === 0 ? '<p class="text-gray-600">No subjects added yet. Add one above!</p>' : ''}
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lessons</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${subjects.map(subject => `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${subject.id}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${subject.name}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${subject.subject_code}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${subject.total_lessons}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${subject.book_name || 'N/A'}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Date(subject.created_at).toLocaleDateString()}</td>
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
        return subjectsHtml;
    };

    // Main function to load subjects page
    const loadSubjectsPage = async () => {
        contentArea.innerHTML = `
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Subject Management</h2>
            <div id="add-subject-section">
                ${renderAddSubjectForm()}
            </div>
            <div id="subjects-list-section" class="mt-6">
                <div class="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-48">Loading subjects...</div>
            </div>
        `;

        // Attach form submission listener
        document.getElementById('add-subject-form').addEventListener('submit', handleAddSubject);

        // Fetch and display subjects
        await fetchSubjects();
    };

    // Function to fetch subjects from API
    const fetchSubjects = async () => {
        try {
            const subjects = await apiFetch('subjects'); // Call the /api/subjects endpoint
            document.getElementById('subjects-list-section').innerHTML = renderSubjectsList(subjects);
        } catch (error) {
            // Error handling is already in apiFetch, just update UI
            document.getElementById('subjects-list-section').innerHTML = `<div class="bg-white p-6 rounded-lg shadow-md text-red-600">Failed to load subjects.</div>`;
        }
    };

    // Function to handle adding a new subject
    const handleAddSubject = async (event) => {
        event.preventDefault(); // Prevent default form submission

        const form = event.target;
        const formData = new FormData(form);
        const subjectData = {};
        formData.forEach((value, key) => {
            subjectData[key] = value;
        });

        // Ensure total_lessons is a number
        subjectData.total_lessons = parseInt(subjectData.total_lessons, 10);
        if (isNaN(subjectData.total_lessons)) {
            subjectData.total_lessons = 0;
        }

        try {
            const response = await apiFetch('subjects', 'POST', subjectData);
            showToast(response.message, 'success');
            form.reset(); // Clear form
            await fetchSubjects(); // Refresh the list
        } catch (error) {
            // Error already shown by apiFetch
        }
    };

    return {
        loadSubjectsPage: loadSubjectsPage
    };
})();