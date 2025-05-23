// exam_cards.js
// File Version: 1.0.1 (Corrected exam_description to exam_instructions and updated display text)
// App Version: 0.0.16

const examCardsModule = (() => {
    /**
     * Generates the HTML string for displaying a list of exam cards.
     * @param {Array<Object>} exams - An array of exam objects, typically fetched from the API.
     * @returns {string} The HTML string containing the exam cards.
     */
    const renderExamCards = (exams) => {
        let cardsHtml = '<div class="mt-8">'; // Outer container for spacing
        cardsHtml += '<h3 class="text-2xl font-bold mb-4 text-gray-800">Recent Exams</h3>';

        if (exams.length === 0) {
            cardsHtml += '<p class="text-gray-600">No exams created yet. <a href="#create-exam" class="text-blue-500 hover:underline">Create your first exam!</a></p>';
        } else {
            cardsHtml += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">'; // Grid for cards
            exams.forEach(exam => {
                // Format the creation date nicely
                const createdAt = new Date(exam.exam_created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });

                // Build HTML for each exam card
                cardsHtml += `
                    <div class="bg-white p-4 shadow-md rounded-lg flex flex-col hover:shadow-lg transition duration-200">
                        <h5 class="font-semibold text-lg text-gray-900 mb-2">${exam.exam_title}</h5>
                        <p class="text-gray-700 text-sm mb-2">${exam.exam_description || 'No instructions provided.'}</p>
                        <div class="text-gray-600 text-xs mb-1">
                            <strong>Topic:</strong> ${exam.topic_name || 'N/A'}
                        </div>
                        <div class="text-gray-600 text-xs mb-1">
                            <strong>Lesson:</strong> ${exam.lesson_title || 'N/A'}
                        </div>
                         <div class="text-gray-600 text-xs mb-1">
                            <strong>Subject:</strong> ${exam.subject_name || 'N/A'}
                        </div>
                        <div class="text-gray-600 text-xs mt-auto pt-2">
                            <strong>Questions:</strong> ${exam.exam_total_questions} |
                            <strong>Pass Marks:</strong> ${exam.exam_pass_percentage} |
                            <strong>Created:</strong> ${createdAt}
                        </div>
                        <div class="flex space-x-2 mt-4">
                            <button onclick="window.navigateTo('take-exam', ${exam.exam_id})"
                                class="bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded flex-1">
                                <i class="fas fa-play-circle mr-1"></i> Take Exam
                            </button>
                             <button onclick="window.showToast('Edit Exam functionality TBD', 'info')"
                                class="bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm py-2 px-3 rounded">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="window.showToast('Delete Exam functionality TBD', 'error')"
                                class="bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-3 rounded">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            cardsHtml += '</div>'; // Close grid
        }
        cardsHtml += '</div>'; // Close outer container
        return cardsHtml;
    };

    /**
     * Fetches exam data from the API and renders them as cards into a specified DOM element.
     * @param {string} targetElementId - The ID of the HTML element where the exam cards should be rendered.
     */
    const loadExamCardsIntoDashboard = async (targetElementId) => {
        const targetElement = document.getElementById(targetElementId);
        if (!targetElement) {
            console.error(`Target element with ID "${targetElementId}" not found for exam cards.`);
            return;
        }

        // Show a loading state while fetching data
        targetElement.innerHTML = `
            <div class="mt-8">
                <h3 class="text-2xl font-bold mb-4 text-gray-800">Recent Exams</h3>
                <p class="text-gray-600 animate-pulse">Loading exams...</p>
            </div>
        `;

        try {
            // Use the global apiFetch utility to get exam data from the new endpoint
            const exams = await window.apiFetch('exams_list.php');
            targetElement.innerHTML = renderExamCards(exams); // Render the fetched exams
        } catch (error) {
            console.error("Error loading exam cards:", error);
            // Display an error message if fetching fails
            targetElement.innerHTML = `
                <div class="mt-8 text-red-600">
                    <h3 class="text-2xl font-bold mb-4">Error Loading Exams</h3>
                    <p>Failed to load exam data. Please try again later.</p>
                </div>
            `;
            // Show a toast notification for the error
            window.showToast("Failed to load exam cards.", "error");
        }
    };

    // Expose the function to the global scope (window) or return it for module usage
    return {
        loadExamCardsIntoDashboard
    };
})();