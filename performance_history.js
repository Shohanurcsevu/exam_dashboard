// js/performance_history.js
// File Version: 1.0.3 (Re-checked and confirmed robust container handling for error states)
// App Version: 0.0.16

const performanceHistoryModule = (() => {
    // Get a reference to the main content area once when the module loads
    const contentArea = document.getElementById('content-area');

    // A variable to hold the reference to the specific performance history container
    // This will be assigned each time loadPerformanceHistoryPage is called
    let performanceContainer = null;

    /**
     * Loads the performance history page, fetching exam attempt data.
     */
    const loadPerformanceHistoryPage = async () => {
        window.showToast('Loading performance history...', 'info');

        // Step 1: Set the initial HTML structure for the performance history page.
        // This *creates* the div with id="performance-history-container" in the DOM.
        contentArea.innerHTML = `
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Performance History</h2>
            <div id="performance-history-container" class="bg-white p-6 rounded-lg shadow-md">
                <p class="text-gray-600 text-lg">Loading attempts...</p>
            </div>
        `;

        // Step 2: Immediately get a reference to the newly created container element.
        // At this point, it MUST exist in the DOM unless contentArea was null,
        // which would cause a different error.
        performanceContainer = document.getElementById('performance-history-container');

        // Add a safety check for performanceContainer (though if Step 1 works, this should too)
        if (!performanceContainer) {
            console.error('CRITICAL ERROR: performance-history-container was not found after initial render.');
            window.showToast('Failed to prepare performance history display area.', 'error');
            return; // Exit if the essential container is missing
        }

        try {
            const response = await apiFetch('performance_history.php');
            const attempts = response.attempts;

            if (attempts.length === 0) {
                // Use the stored performanceContainer reference
                performanceContainer.innerHTML = `
                    <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
                        <p class="font-bold">No Exam Attempts Found</p>
                        <p>It looks like you haven't taken any exams yet. Go to the "Take Exam" section to start one!</p>
                    </div>
                `;
                window.showToast('No exam attempts found.', 'info', 3000);
            } else {
                let tableHtml = `
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Title</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempt No.</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                `;

                attempts.forEach(attempt => {
                    const percentage = parseFloat(attempt.total_percentage).toFixed(2);
                    const date = new Date(attempt.created_at).toLocaleString(); // Format date nicely
                    tableHtml += `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${attempt.exam_title}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${attempt.score}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${percentage}%</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${attempt.attempt_no}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${date}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onclick="performanceHistoryModule.reviewAttempt(${attempt.attempt_id})"
                                                class="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 rounded-md py-1 px-2 border border-indigo-600">
                                            Review
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
                // Use the stored performanceContainer reference to update its content
                performanceContainer.innerHTML = tableHtml;
                window.showToast('Performance history loaded.', 'success', 3000);
            }

        } catch (error) {
            console.error('Error loading performance history:', error);
            // This is the line where the error was previously reported.
            // By now, performanceContainer should hold a valid reference.
            if (performanceContainer) {
                performanceContainer.innerHTML = `
                    <p class="text-red-600">Failed to load performance history. Please try again. (Details in console)</p>
                `;
            } else {
                // Fallback for an extremely rare scenario where performanceContainer somehow became null
                // after the initial check, or if contentArea itself is problematic.
                contentArea.innerHTML = `<p class="text-red-600 text-center p-8">Failed to load content and the display area is missing. Please refresh.</p>`;
            }
            window.showToast('Failed to load performance history.', 'error');
        }
    };

    /**
     * Navigates to the review exam page for a specific attempt.
     * @param {number} attemptId The ID of the exam attempt to review.
     */
    const reviewAttempt = (attemptId) => {
        window.navigateTo('review-exam', attemptId);
    };

    return {
        loadPerformanceHistoryPage: loadPerformanceHistoryPage,
        reviewAttempt: reviewAttempt
    };
})();