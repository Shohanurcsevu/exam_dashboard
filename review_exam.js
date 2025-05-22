// js/review_exam.js
// File Version: 1.0.0 (Initial creation of Review Exam Module)
// App Version: 0.0.14 (Updating for correct data parsing)

const reviewExamModule = (() => {
    const contentArea = document.getElementById('content-area');

    /**
     * Loads the exam review page for a specific attempt.
     * @param {number} attemptId The ID of the exam attempt to review.
     */
    const loadReviewExamPage = async (attemptId) => {
        if (!attemptId) {
            window.showToast('No exam attempt ID provided for review.', 'error');
            contentArea.innerHTML = `<div class="text-red-600 text-center p-8">Invalid attempt ID. Please go back to Performance History.</div>`;
            return;
        }

        window.showToast(`Loading review for attempt ID: ${attemptId}...`, 'info');
        contentArea.innerHTML = `
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Review Exam Attempt</h2>
            <div id="review-exam-container" class="bg-white p-6 rounded-lg shadow-md">
                <p class="text-gray-600 text-lg">Loading exam details...</p>
            </div>
        `;

        try {
            // Fetch the exam review data from your new API endpoint
            const response = await apiFetch(`review_exam.php?id=${attemptId}`);
            const attempt = response.attempt;

            let reviewHtml = `
                <div class="mb-6 pb-4 border-b border-gray-200">
                    <h3 class="text-2xl font-semibold text-gray-800">${attempt.exam_title}</h3>
                    <p class="text-gray-600">Attempt ID: <span class="font-medium">${attempt.attempt_id}</span></p>
                    <p class="text-gray-600">Score: <span class="font-medium">${attempt.score} / ${attempt.total_questions || 'N/A'}</span></p>
                    <p class="text-gray-600">Percentage: <span class="font-medium">${parseFloat(attempt.total_percentage).toFixed(2)}%</span></p>
                    <p class="text-gray-600">Date: <span class="font-medium">${new Date(attempt.created_at).toLocaleString()}</span></p>
                </div>
            `;

            // Loop through each question to display it
            attempt.questions.forEach((question, index) => {
                reviewHtml += `
                    <div class="mb-8 p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                        <p class="text-lg font-semibold text-gray-900 mb-3">Question ${index + 1}: ${question.question_text}</p>
                        <div class="space-y-2">
                `;

                // Check if question.options exists and is an array before iterating
                if (question.options && Array.isArray(question.options) && question.options.length > 0) {
                    question.options.forEach(option => {
                        let optionClass = 'text-gray-700'; // Default text color
                        let iconHtml = '';

                        // CORRECTED LOGIC: Compare with user_answer and correct_answer
                        const isUserSelected = (question.user_answer === option.key); // User's selected option
                        const isCorrectOption = (question.correct_answer === option.key); // The actual correct option

                        if (isUserSelected) {
                            if (isCorrectOption) {
                                // User selected correctly
                                optionClass = 'bg-green-100 text-green-800 border-green-500';
                                iconHtml = '<i class="fas fa-check-circle text-green-500 mr-2"></i> Your Correct Answer';
                            } else {
                                // User selected incorrectly
                                optionClass = 'bg-red-100 text-red-800 border-red-500';
                                iconHtml = '<i class="fas fa-times-circle text-red-500 mr-2"></i> Your Incorrect Answer';
                            }
                        } else if (isCorrectOption) {
                            // Correct option, but user didn't select it
                            optionClass = 'bg-blue-100 text-blue-800 border-blue-500';
                            iconHtml = '<i class="fas fa-lightbulb text-blue-500 mr-2"></i> Correct Answer';
                        } else {
                            // Unselected and incorrect option
                            optionClass = 'bg-white text-gray-700 border-gray-300';
                            // No specific icon for unselected, incorrect options
                        }

                        reviewHtml += `
                            <div class="flex items-center p-3 rounded-md border ${optionClass}">
                                <span class="mr-3">${option.key}.</span>  <p class="flex-grow">${option.value}</p>  <div class="ml-auto text-sm font-medium">${iconHtml}</div>
                            </div>
                        `;
                    });
                } else {
                    // Fallback if no options are present (e.g., for short answer questions)
                    reviewHtml += `
                        <div class="p-3 text-gray-700">No options available for this question type.</div>
                    `;
                }


                reviewHtml += `
                        </div>
                        <div class="mt-4 pt-3 border-t border-gray-200">
                            <p class="text-sm text-gray-700">Your Answer: <span class="${question.is_correct ? 'font-medium text-green-700' : 'font-medium text-red-700'}">${question.user_answer || 'N/A'}</span></p>
                            <p class="text-sm text-gray-700">Correct Answer: <span class="font-medium text-green-700">${question.correct_answer || 'N/A'}</span></p>
                        </div>
                    </div>
                `;
            });

            document.getElementById('review-exam-container').innerHTML = reviewHtml;
            window.showToast('Exam review loaded successfully!', 'success', 3000);

        } catch (error) {
            console.error('Error loading exam review:', error);
            document.getElementById('review-exam-container').innerHTML = `
                <p class="text-red-600">Failed to load exam review. Please try again or check the console for details.</p>
            `;
            window.showToast('Failed to load exam review.', 'error');
        }
    };

    return {
        loadReviewExamPage: loadReviewExamPage,
    };
})();