document.addEventListener('DOMContentLoaded', () => {
    const leftPanel = document.getElementById('left-panel');
    const openPanelBtn = document.getElementById('open-panel-btn');
    const closePanelBtn = document.getElementById('close-panel-btn');
    const contentArea = document.getElementById('content-area');
    const modalContainer = document.getElementById('modal-container');
    const toastContainer = document.getElementById('toast-container'); // This must exist in your index.html

    // --- Panel Toggle for Mobile ---
    openPanelBtn.addEventListener('click', () => {
        leftPanel.classList.remove('hidden');
        leftPanel.classList.add('fixed', 'inset-y-0', 'left-0', 'z-40');
    });

    closePanelBtn.addEventListener('click', () => {
        leftPanel.classList.add('hidden');
        leftPanel.classList.remove('fixed', 'inset-y-0', 'left-0', 'z-40');
    });

    // --- Submenu Toggle ---
    document.querySelectorAll('[data-menu]').forEach(menuItem => {
        menuItem.addEventListener('click', function() {
            const submenu = this.nextElementSibling;
            const chevronIcon = this.querySelector('.fa-chevron-down'); // Assumes FontAwesome chevron
            if (submenu && submenu.classList.contains('submenu')) {
                submenu.classList.toggle('hidden');
                // Rotate icon for visual feedback if it exists
                if (chevronIcon) {
                    chevronIcon.classList.toggle('rotate-180');
                }
            }
        });
    });

    // --- Utility Functions ---

    /**
     * Shows a toast notification.
     * @param {string} message The message to display.
     * @param {string} type 'success', 'error', 'info', or 'warning'.
     * @param {number} duration Duration in milliseconds (default: 3000).
     */
    window.showToast = (message, type = 'info', duration = 3000) => {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.classList.add('p-3', 'rounded-md', 'shadow-md', 'text-white', 'opacity-0', 'transform', 'translate-y-4', 'transition-all', 'duration-300', 'ease-out');

        switch (type) {
            case 'success':
                toast.classList.add('bg-green-500');
                break;
            case 'error':
                toast.classList.add('bg-red-500');
                break;
            case 'warning':
                toast.classList.add('bg-yellow-500');
                break;
            case 'info':
            default:
                toast.classList.add('bg-blue-500');
                break;
        }

        // Ensure toastContainer is available before appending
        if (toastContainer) {
            toastContainer.appendChild(toast);
        } else {
            console.error('Toast container (id="toast-container") not found in DOM.');
            return;
        }

        // Animate in
        setTimeout(() => {
            toast.classList.remove('opacity-0', 'translate-y-4');
            toast.classList.add('opacity-100', 'translate-y-0');
        }, 50); // Small delay to ensure transition applies

        // Animate out and remove
        setTimeout(() => {
            toast.classList.remove('opacity-100', 'translate-y-0');
            toast.classList.add('opacity-0', 'translate-y-4');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    };

    /**
     * Hides all currently visible toast notifications.
     */
    window.hideToast = () => {
        if (toastContainer) {
            // Get all toasts and apply fade-out animation before removal
            Array.from(toastContainer.children).forEach(toast => {
                toast.classList.remove('opacity-100', 'translate-y-0');
                toast.classList.add('opacity-0', 'translate-y-4');
                toast.addEventListener('transitionend', () => toast.remove(), { once: true }); // Remove after transition
            });
        }
    };

    /**
     * Generic function to make API calls.
     * @param {string} endpoint The API endpoint (e.g., 'subjects', 'exams?topic_id=3', or 'performance_history.php').
     * @param {string} method HTTP method (e.g., 'GET', 'POST', 'PUT', 'DELETE').
     * @param {object} [body=null] Request body for POST/PUT.
     * @returns {Promise<object>} JSON response from the API.
     */
    window.apiFetch = async (endpoint, method = 'GET', body = null) => {
        const API_BASE_URL = 'http://localhost/exam_dashboard/api/'; // Define your base URL here

        let url;
        // The .htaccess rules now handle routing from /api/resource/ID to /api/resource.php
        // So, we should *not* append .php here for clean resource URLs.
        // We still need to handle cases where the endpoint might already contain query parameters.
        if (endpoint.includes('?')) {
            url = `${API_BASE_URL}${endpoint}`;
        } else {
            // For simple resource names (e.g., 'subjects', 'subjects/6'), just concatenate.
            // The PHP backend scripts (e.g., subjects.php) are explicitly accessed by .htaccess rewrite.
            url = `${API_BASE_URL}${endpoint}`;
        }

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options); // Use the correctly constructed 'url'
            if (!response.ok) {
                // Attempt to parse JSON error message from server
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `API error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            // Use the global showToast (now defined in window)
            window.showToast(`Error: ${error.message}`, 'error');
            throw error; // Re-throw to allow calling functions to handle
        }
    };

    // --- Modal Handling ---

    /**
     * Shows a modal with the given content.
     * @param {string} contentHtml HTML string for the modal body.
     * @param {string} title The title of the modal.
     */
    window.showModal = (contentHtml, title = 'Modal') => {
        // Ensure modalContainer exists and is structured for the update
        if (modalContainer) {
            // Clear previous content to prevent listener duplication issues if you're not recreating
            modalContainer.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-xl w-11/12 md:w-1/2 lg:w-1/3 relative">
                    <h3 class="text-xl font-semibold mb-4 text-gray-800">${title}</h3>
                    <button class="modal-close-btn absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl">&times;</button>
                    <div class="modal-content">
                        ${contentHtml}
                    </div>
                </div>
            `;
            modalContainer.classList.remove('hidden');

            // Add event listener to close button
            modalContainer.querySelector('.modal-close-btn').addEventListener('click', window.hideModal);
            // Add event listener to click outside the modal
            modalContainer.addEventListener('click', (e) => {
                if (e.target === modalContainer) {
                    window.hideModal();
                }
            });
        } else {
            console.error('Modal container (id="modal-container") not found in DOM.');
        }
    };

    /**
     * Hides the currently open modal.
     */
    window.hideModal = () => {
        if (modalContainer) {
            modalContainer.classList.add('hidden');
            modalContainer.innerHTML = ''; // Clear content
        }
    };

    // --- Dynamic Content Loading (Initial Dashboard View) ---

    const renderDashboard = async () => {
        contentArea.innerHTML = `
            <h2 class="text-3xl font-bold mb-6 text-gray-800">Dashboard Overview</h2>
            <div id="dashboard-cards" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div class="bg-white p-4 shadow-md rounded-lg flex items-center justify-center h-32 animate-pulse">Loading Subjects...</div>
                <div class="bg-white p-4 shadow-md rounded-lg flex items-center justify-center h-32 animate-pulse">Loading Lessons...</div>
                <div class="bg-white p-4 shadow-md rounded-lg flex items-center justify-center h-32 animate-pulse">Loading Topics...</div>
                <div class="bg-white p-4 shadow-md rounded-lg flex items-center justify-center h-32 animate-pulse">Loading Exams...</div>
                <div class="bg-white p-4 shadow-md rounded-lg flex items-center justify-center h-32 animate-pulse">Loading Questions...</div>
            </div>
            <div id="exams-list-container">
                </div>
        `;

        try {
            const data = await window.apiFetch('dashboard');
            const dashboardCards = document.getElementById('dashboard-cards');
            dashboardCards.innerHTML = ''; // Clear loading states

            // Helper to create a progress bar (keep this as is)
            const createProgressBar = (current, total) => {
                const percentage = total > 0 ? ((current / total) * 100).toFixed(0) : 0;
                // Add a check for NaN or Infinity for percentage
                const displayPercentage = isNaN(percentage) || !isFinite(percentage) ? 0 : percentage;

                return `
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div class="bg-blue-500 h-2 rounded-full" style="width: ${displayPercentage}%;"></div>
                    </div>
                    <p class="text-gray-600 text-xs mt-1">${displayPercentage}% Complete</p>
                `;
            };

            // Card 1: Subjects
            dashboardCards.innerHTML += `
                <div class="bg-white p-4 shadow-md rounded-lg hover:shadow-lg transition duration-200">
                    <h4 class="font-bold text-2xl text-gray-800">${data.subjects.total || 0}</h4>
                    <p class="text-gray-600">Total Subjects</p>
                    <p class="text-gray-500 text-sm mt-2">Completion Progress: ${data.subjects.completion_progress ? data.subjects.completion_progress.toFixed(0) : 'N/A'}%</p>
                    <p class="text-gray-500 text-sm">Most Active: ${data.subjects.most_active || 'N/A'}</p>
                    ${createProgressBar(data.subjects.lessons_created || 0, data.subjects.total_lessons_specified || 0)}
                </div>
            `;

            // Card 2: Lessons
            dashboardCards.innerHTML += `
                <div class="bg-white p-4 shadow-md rounded-lg hover:shadow-lg transition duration-200">
                    <h4 class="font-bold text-2xl text-gray-800">${data.lessons.total || 0}</h4>
                    <p class="text-gray-600">Total Lessons</p>
                    <p class="text-gray-500 text-sm mt-2">Completion Progress: ${data.lessons.completion_progress ? data.lessons.completion_progress.toFixed(0) : 'N/A'}%</p>
                    <p class="text-gray-500 text-sm">Recently Added: ${data.lessons.recently_added || 'N/A'}</p>
                    ${createProgressBar(data.lessons.topics_created || 0, data.lessons.total_topics_specified || 0)}
                </div>
            `;

            // Card 3: Topics
            dashboardCards.innerHTML += `
                <div class="bg-white p-4 shadow-md rounded-lg hover:shadow-lg transition duration-200">
                    <h4 class="font-bold text-2xl text-gray-800">${data.topics.total || 0}</h4>
                    <p class="text-gray-600">Total Topics</p>
                    <p class="text-gray-500 text-sm mt-2">Completion Progress: ${data.topics.completion_progress ? data.topics.completion_progress.toFixed(0) : 'N/A'}%</p>
                    <p class="text-gray-500 text-sm">Most Questions: ${data.topics.most_questions || 'N/A'}</p>
                    ${createProgressBar(data.topics.exams_created || 0, data.topics.total_exams_specified || 0)}
                </div>
            `;

            // Card 4: Exams - ADDED PROGRESS BAR
            dashboardCards.innerHTML += `
                <div class="bg-white p-4 shadow-md rounded-lg hover:shadow-lg transition duration-200">
                    <h4 class="font-bold text-2xl text-gray-800">${data.exams.total || 0}</h4>
                    <p class="text-gray-600">Total Exams</p>
                    <p class="text-gray-500 text-sm mt-2">Exams Attempted: ${data.exams.attempted_count || 0}</p>
                    <p class="text-gray-500 text-sm">Avg Score: ${data.exams.average_score ? data.exams.average_score.toFixed(2) : 'N/A'}%</p>
                    ${createProgressBar(data.exams.attempted_count || 0, data.exams.total || 0)}
                </div>
            `;

            // Card 5: Questions - ADDED PROGRESS BAR
            dashboardCards.innerHTML += `
                <div class="bg-white p-4 shadow-md rounded-lg hover:shadow-lg transition duration-200">
                    <h4 class="font-bold text-2xl text-gray-800">${data.questions.total || 0}</h4>
                    <p class="text-gray-600">Total Questions</p>
                    <p class="text-gray-500 text-sm mt-2">Questions Attempted: ${data.questions.attempted_count || 0}</p>
                    <p class="text-gray-500 text-sm">Correct Rate: ${data.questions.correct_rate ? data.questions.correct_rate.toFixed(2) : 'N/A'}%</p>
                    ${createProgressBar(data.questions.attempted_count || 0, data.questions.total || 0)}
                </div>
            `;

            // Load Exam Cards below the summary
            if (typeof examCardsModule !== 'undefined' && examCardsModule.loadExamCardsIntoDashboard) {
                await examCardsModule.loadExamCardsIntoDashboard('exams-list-container');
            } else {
                console.error("examCardsModule not found or not correctly initialized.");
                document.getElementById('exams-list-container').innerHTML = `
                    <div class="mt-8 text-red-600">
                        <h3 class="text-2xl font-bold mb-4">Module Error</h3>
                        <p>Exam cards module could not be loaded.</p>
                    </div>
                `;
            }

        } catch (error) {
            // Error is already shown by apiFetch, just update content area
            contentArea.innerHTML = `<div class="text-red-600 text-center p-8">Failed to load dashboard data. Please check the server and API endpoint.</div>`;
        }
    };

    // --- Navigation Logic ---

    let currentActivePage = ''; // To keep track of the currently active page for hashchange
    let currentActiveId = null; // To keep track of the currently active ID for hashchange

    /**
     * Navigates to a specified page, optionally with an ID.
     * Updates the URL hash and loads content.
     * @param {string} page The name of the page to navigate to (e.g., 'dashboard', 'review-exam').
     * @param {number|string} [id=null] An optional ID to pass to the page module (e.g., attempt_id for review).
     */
    window.navigateTo = async (page, id = null) => { // Made navigateTo async
        window.hideToast(); // Clear any lingering toasts when navigating

        currentActivePage = page; // Update the current active page
        currentActiveId = id; // Update the current active ID

        // Update URL hash without causing a full page reload or
        // triggering another hashchange event listener prematurely.
        // This is important for browser history and direct linking.
        if (id !== null) {
            window.location.hash = `${page}?id=${id}`;
        } else {
            window.location.hash = page;
        }

        contentArea.innerHTML = `<div class="text-center p-8 text-gray-600">Loading ${page.replace(/-/g, ' ')} content...</div>`; // Show loading state

        // Close mobile panel if open
        if (!leftPanel.classList.contains('sm:flex') && leftPanel.classList.contains('fixed')) { // Check if it's visible in mobile
            closePanelBtn.click();
        }

        // Update active class for sidebar links (only for main navigation pages)
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('bg-gray-700'); // Remove active state
            // Also ensure parent submenus are closed/icons reset unless they are the current path
            const submenu = link.closest('.submenu');
            if (submenu && submenu.previousElementSibling) {
                const chevron = submenu.previousElementSibling.querySelector('.fa-chevron-down');
                if (chevron) {
                    chevron.classList.remove('rotate-180');
                }
                submenu.classList.add('hidden');
            }
        });

        // Activate the current nav link and open its submenu if necessary
        const activeLink = document.querySelector(`[data-page="${page}"]`);
        if (activeLink) {
            activeLink.classList.add('bg-gray-700');
            const parentSubmenu = activeLink.closest('.submenu');
            if (parentSubmenu) {
                parentSubmenu.classList.remove('hidden');
                const parentMenuToggle = parentSubmenu.previousElementSibling;
                if (parentMenuToggle) {
                    const chevron = parentMenuToggle.querySelector('.fa-chevron-down');
                    if (chevron) {
                        chevron.classList.add('rotate-180');
                    }
                }
            }
        }

        try {
            switch (page) {
                case 'dashboard':
                    if (typeof dashboardModule !== 'undefined' && dashboardModule.loadDashboardPage) {
                        await dashboardModule.loadDashboardPage();
                    } else {
                        await renderDashboard(); // Fallback if dashboardModule isn't defined
                    }
                    break;
                case 'view-subjects':
                    if (typeof subjectsModule !== 'undefined' && subjectsModule.loadSubjectsPage) {
                        await subjectsModule.loadSubjectsPage();
                    } else {
                        contentArea.innerHTML = `<div class="text-red-600 text-center p-8">Subjects module not loaded or initialized.</div>`;
                    }
                    break;
                case 'view-lessons':
                    if (typeof lessonsModule !== 'undefined' && lessonsModule.loadLessonsPage) {
                        await lessonsModule.loadLessonsPage();
                    } else {
                        contentArea.innerHTML = `<div class="text-red-600 text-center p-8">Lessons module not loaded or initialized.</div>`;
                    }
                    break;
                case 'view-topics':
                    if (typeof topicsModule !== 'undefined' && topicsModule.loadTopicsPage) {
                        await topicsModule.loadTopicsPage();
                    } else {
                        contentArea.innerHTML = `<div class="text-red-600 text-center p-8">Topics module not loaded or initialized.</div>`;
                    }
                    break;
                case 'create-exam':
                    if (typeof examsModule !== 'undefined' && examsModule.loadCreateExamPage) {
                        await examsModule.loadCreateExamPage();
                    } else {
                        contentArea.innerHTML = `<div class="text-red-600 text-center p-8">Exams module not loaded or initialized.</div>`;
                    }
                    break;
                case 'add-questions':
                    if (typeof questionsModule !== 'undefined' && questionsModule.loadQuestionsPage) {
                        await questionsModule.loadQuestionsPage();
                    } else {
                        contentArea.innerHTML = `<div class="text-red-600 text-center p-8">Questions module not loaded or initialized.</div>`;
                    }
                    break;
                case 'import-questions':
                    if (typeof questionImporterModule !== 'undefined' && questionImporterModule.loadQuestionImporterPage) {
                        await questionImporterModule.loadQuestionImporterPage();
                    } else {
                        contentArea.innerHTML = `<div class="text-red-600 text-center p-8">Question Importer module not loaded or initialized.</div>`;
                    }
                    break;
                case 'take-exam':
                    // take-exam needs an ID to know which exam to load
                    if (id === null) {
                        contentArea.innerHTML = `<div class="text-red-600 text-center p-8">Error: No exam ID provided to take.</div>`;
                        return; // Stop execution if no ID
                    }
                    if (typeof takeExamModule !== 'undefined' && takeExamModule.loadTakeExamPage) {
                        await takeExamModule.loadTakeExamPage(id); // Pass the ID to the module
                    } else {
                        contentArea.innerHTML = `<div class="text-red-600 text-center p-8">Take Exam module not loaded or initialized.</div>`;
                    }
                    break;
                case 'performance':
                    if (typeof performanceHistoryModule !== 'undefined' && performanceHistoryModule.loadPerformanceHistoryPage) {
                        await performanceHistoryModule.loadPerformanceHistoryPage();
                    } else {
                        contentArea.innerHTML = `<div class="text-red-600 text-center p-8">Performance History module not loaded or initialized.</div>`;
                    }
                    break;
                case 'review-exam':
                    if (typeof reviewExamModule !== 'undefined' && reviewExamModule.loadReviewExamPage) {
                        await reviewExamModule.loadReviewExamPage(id);
                    } else {
                        contentArea.innerHTML = `<div class="text-red-600 text-center p-8">Review Exam module not loaded or initialized.</div>`;
                    }
                    break;
                case 'custom-exam-exams':
                    if (typeof customExamsModule !== 'undefined' && customExamsModule.loadCustomExamExamsPage) {
                        await customExamsModule.loadCustomExamExamsPage();
                    } else {
                        contentArea.innerHTML = `<div class="text-red-600 text-center p-8">Custom Exam from Exams module not loaded or initialized.</div>`;
                    }
                    break;
                case 'custom-exam-topics':
                    if (typeof customExamTopicsModule !== 'undefined' && customExamTopicsModule.loadCustomExamTopicsPage) {
                        await customExamTopicsModule.loadCustomExamTopicsPage();
                    } else {
                        contentArea.innerHTML = `<div class="text-red-600 text-center p-8">Custom Exam from Topics module not loaded or initialized.</div>`;
                    }
                    break;
                // Corrected case to load the customExamLessonsModule form
                case 'custom-exam-lessons':
                    if (typeof customExamLessonsModule !== 'undefined' && customExamLessonsModule.renderCustomExamForm) {
                        await customExamLessonsModule.renderCustomExamForm('content-area');
                    } else {
                        contentArea.innerHTML = `<div class="text-red-600 text-center p-8">Custom Exam from Lessons module not loaded or initialized.</div>`;
                    }
                    break;
                case 'custom-exam-subjects':
                    contentArea.innerHTML = `<h2 class="text-3xl font-bold mb-6 text-gray-800">Custom Exam from Subjects (TBD)</h2><p>Custom exam content for Subjects is To Be Developed.</p>`;
                    break;
                // NEW CASE for 'take-model-test'
                case 'take-model-test':
                    if (typeof takeModelTestModule !== 'undefined' && takeModelTestModule.loadTakeModelTestPage) {
                        await takeModelTestModule.loadTakeModelTestPage();
                    } else {
                        contentArea.innerHTML = `<div class="text-red-600 text-center p-8">Take Model Test module not loaded or initialized.</div>`;
                    }
                    break;
                default:
                    contentArea.innerHTML = `<div class="text-red-600 text-center p-8">Page not found!</div>`;
                    break;
            }
        } catch (error) {
            console.error("Failed to load page:", page, error);
            contentArea.innerHTML = `<h2 class="text-3xl font-bold mb-6 text-red-700">Error Loading Page</h2><p>An error occurred while loading ${page.replace(/-/g, ' ')}. Please try again.</p>`;
            window.showToast(`Error loading ${page.replace(/-/g, ' ')} page.`, 'error');
        }
    };

    // Event listeners for navigation links using data-page attribute
    document.querySelectorAll('nav a[data-page]').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
            const page = event.target.closest('a').dataset.page;
            window.navigateTo(page); // Use window.navigateTo
        });
    });

    // MODIFIED: Initial page load based on URL hash or default to dashboard
    // This will now parse IDs from the hash if present
    const parseHash = () => {
        const hash = window.location.hash.substring(1);
        if (!hash) return { page: 'dashboard', id: null };

        const [pageName, queryString] = hash.split('?');
        let id = null;
        if (queryString) {
            const params = new URLSearchParams(queryString);
            id = params.get('id');
        }
        return { page: pageName, id: id };
    };

    const initialNav = parseHash();
    window.navigateTo(initialNav.page, initialNav.id);

    // Add event listener for hash changes (back/forward browser buttons)
    window.addEventListener('hashchange', () => {
        const navFromHash = parseHash();
        // Only navigate if the page or ID actually changed from the current state
        if (navFromHash.page !== currentActivePage || navFromHash.id !== currentActiveId) {
            window.navigateTo(navFromHash.page, navFromHash.id);
        }
    });
});