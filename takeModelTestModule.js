// js/takeModelTestModule.js

const takeModelTestModule = (() => {
    const contentArea = document.getElementById('content-area');

    /**
     * Loads the "Take Model Test" page, displaying a list of custom model exams.
     */
    const loadTakeModelTestPage = async () => {
        contentArea.innerHTML = `
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Take Model Test</h2>
            <div id="model-exams-list" class="bg-white p-6 rounded-lg shadow-md">
                <p class="text-gray-600">Loading model exams...</p>
            </div>
        `;

        try {
            // Fetch model exams from the new API endpoint
            const response = await window.apiFetch('model_exams', 'GET');

            if (response.success && response.data) {
                renderModelExamsTable(response.data);
            } else {
                contentArea.innerHTML = `<div class="text-red-600 text-center p-8">Failed to load model exams: ${response.message || 'Unknown error'}.</div>`;
            }
        } catch (error) {
            console.error('Error fetching model exams:', error);
            contentArea.innerHTML = `<div class="text-red-600 text-center p-8">An error occurred while fetching model exams.</div>`;
            window.showToast(`Error: ${error.message}`, 'error');
        }
    };

    /**
     * Renders the model exams in a table format.
     * @param {Array} exams - An array of exam objects.
     */
    const renderModelExamsTable = (exams) => {
        const examsListDiv = document.getElementById('model-exams-list');
        if (!examsListDiv) return;

        if (exams.length === 0) {
            examsListDiv.innerHTML = `<p class="text-gray-600">No model exams found.</p>`;
            return;
        }

        let tableHtml = `
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border border-gray-300 rounded-lg">
                    <thead>
                        <tr>
                            <th class="py-3 px-4 border-b text-left text-gray-700">No.</th>
                            <th class="py-3 px-4 border-b text-left text-gray-700">Model Exam Name</th>
                            <th class="py-3 px-4 border-b text-left text-gray-700">Total Questions</th>
                            <th class="py-3 px-4 border-b text-left text-gray-700">Total Marks</th>
                            <th class="py-3 px-4 border-b text-left text-gray-700">Duration (min)</th>
                            <th class="py-3 px-4 border-b text-left text-gray-700">Created At</th>
                            <th class="py-3 px-4 border-b text-left text-gray-700">Option</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        exams.forEach((exam, index) => {
            const createdAt = new Date(exam.created_at).toLocaleDateString() + ' ' + new Date(exam.created_at).toLocaleTimeString();
            tableHtml += `
                <tr class="hover:bg-gray-50">
                    <td class="py-2 px-4 border-b text-gray-800">${index + 1}</td>
                    <td class="py-2 px-4 border-b text-gray-800">${exam.title}</td>
                    <td class="py-2 px-4 border-b text-gray-800">${exam.total_questions || 0}</td>
                    <td class="py-2 px-4 border-b text-gray-800">${exam.total_marks || 0}</td>
                    <td class="py-2 px-4 border-b text-gray-800">${exam.duration_minutes}</td>
                    <td class="py-2 px-4 border-b text-gray-800">${createdAt}</td>
                    <td class="py-2 px-4 border-b">
                        <button class="take-exam-btn bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm" data-exam-id="${exam.id}">
                            Take Exam
                        </button>
                    </td>
                </tr>
            `;
        });

        tableHtml += `
                    </tbody>
                </table>
            </div>
        `;
        examsListDiv.innerHTML = tableHtml;

        // Add event listeners to "Take Exam" buttons
        examsListDiv.querySelectorAll('.take-exam-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const examId = event.target.dataset.examId;
                // Navigate to the take-exam page with the exam ID
                window.navigateTo('take-exam', examId);
            });
        });
    };

    return {
        loadTakeModelTestPage: loadTakeModelTestPage
    };
})();