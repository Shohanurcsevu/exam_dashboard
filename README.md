1.	Lest create Personal Exam Admin Dashboard Design ,
keep every files separate like index.html, index.js , subject.php api , subject.index , lesson.php lesson.js , topics.api , topics.js ,exams.api. exams.js  like that 
and after every update of each file give me a each  file version number and app version umber  so that later I can say update the file from this version 


Personal Exam Admin Dashboard Design
2.	Web Scenario
3.	Purpose: A web-based dashboard for managing personal exam preparation by organizing subjects, lessons, topics, and exams, attempting exams, checking answers, and tracking performance/growth, accessible without authentication.
4.	Target Users: Individuals preparing for exams, needing to structure study materials and monitor progress without user accounts.
5.	Platform: Web-based, accessible via browsers on desktop or mobile, running locally on XAMPP server.
6.	Technology Stack:
6.1.	Frontend: HTML, JavaScript, Tailwind CSS (via CDN for styling)
6.2.	Backend: PHP with RESTful API approach
6.3.	Database: MySQL, hosted on XAMPP server, with UTF-8 encoding (utf8mb4) for all tables to support Bengali text
7.	Key Features:
7.1.	Manage subjects, lessons, topics, and exams (CRUD operations)
7.2.	Attempt exams with multiple-choice questions, including random shuffling and timer
7.3.	View correct answers post-attempt
7.4.	Track performance and growth metrics (e.g., score trends, subject/lesson/topic-wise progress) using tables
7.5.	Responsive design with a left panel navigation menu and a right-side area for dynamic content
8.	API Endpoints:
8.1.	GET /api/subjects: List all subjects with counts of lessons, topics, exams, and questions
8.2.	POST /api/subjects: Create a new subject
8.3.	PUT /api/subjects/{id}: Update a subject
8.4.	DELETE /api/subjects/{id}: Delete a subject
8.5.	GET /api/subjects/{subject_id}/lessons: List lessons for a subject with counts of topics, exams, and questions
8.6.	POST /api/lessons: Create a lesson
8.7.	PUT /api/lessons/{id}: Update a lesson
8.8.	DELETE /api/lessons/{id}: Delete a lesson
8.9.	GET /api/lessons/{lesson_id}/topics: List topics for a lesson with counts of exams and questions
8.10.	POST /api/topics: Create a topic
8.11.	PUT /api/topics/{id}: Update a topic
8.12.	DELETE /api/topics/{id}: Delete a topic
8.13.	GET /api/topics/{topic_id}/exams: List exams for a topic
8.14.	POST /api/exams: Create an exam with questions in JSON format
8.15.	PUT /api/exams/{id}: Update an exam
8.16.	DELETE /api/exams/{id}: Delete an exam
8.17.	GET /api/exams: List exams with filters (subject_id, lesson_id, topic_id, type)
8.18.	POST /api/exams/{exam_id}/attempt: Submit exam attempt with answers and custom duration
8.19.	GET /api/exams/{exam_id}/results: View exam results and correct answers
8.20.	GET /api/performance: Retrieve performance metrics (subject, lesson, topic, exam)
8.21.	GET /api/dashboard: Retrieve summary metrics for homepage cards (subjects, lessons, topics, exams, questions)
9.	User Interaction
10.	Homepage:
10.1.	Directly display the dashboard with a responsive layout.
10.2.	Layout: Fixed left panel with navigation menus, main content area (right side) for dynamic content, and a header with the app title ("Exam Admin Dashboard").
10.3.	Right-Side Main Area:
10.3.1.	Cards Section:
10.3.1.1.	Fetch summary metrics via GET /api/dashboard.
10.3.1.2.	Display: Grid of five cards (2 columns on mobile, 5 columns on desktop with grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4).
10.3.1.3.	Card 1: Subjects:
10.3.1.3.1.	Total Subjects Created: Count of subjects in the Subjects table (font-bold text-2xl text-gray-800).
10.3.1.3.2.	Additional Info:
10.3.1.3.2.1.	Completion Progress: Percentage of lessons created vs. total lessons specified across all subjects (e.g., if 10 subjects have a total of 100 lessons specified and 60 are created, show 60%).
10.3.1.3.2.2.	Most Active Subject: Name of the subject with the most exams or questions created.
10.3.1.3.3.	UI: Card styled with bg-white, p-4, shadow-md, rounded-lg, hover effect (hover:shadow-lg). Progress shown as a Tailwind CSS progress bar (bg-blue-500, h-2, rounded).
10.3.1.4.	Card 2: Lessons:
10.3.1.4.1.	Total Lessons Created: Count of lessons in the Lessons table (font-bold text-2xl text-gray-800).
10.3.1.4.2.	Additional Info:
10.3.1.4.2.1.	Completion Progress: Percentage of topics created vs. total topics specified across all lessons.
10.3.1.4.2.2.	Recently Added Lesson: Name and creation date of the most recently created lesson.
10.3.1.4.3.	UI: Card styled with bg-white, p-4, shadow-md, rounded-lg, hover effect (hover:shadow-lg). Progress shown as a progress bar.
10.3.1.5.	Card 3: Topics:
10.3.1.5.1.	Total Topics Created: Count of topics in the Topics table (font-bold text-2xl text-gray-800).
10.3.1.5.2.	Additional Info:
10.3.1.5.2.1.	Completion Progress: Percentage of exams created vs. total exams specified across all topics.
10.3.1.5.2.2.	Topic with Most Questions: Name of the topic with the most questions in its exams.
10.3.1.5.3.	UI: Card styled with bg-white, p-4, shadow-md, rounded-lg, hover effect (hover:shadow-lg). Progress shown as a progress bar.
10.3.1.6.	Card 4: Exams:
10.3.1.6.1.	Total Exams Created: Count of exams in the Exams table (font-bold text-2xl text-gray-800).
10.3.1.6.2.	Additional Info:
10.3.1.6.2.1.	Exams Attempted: Count of exams with at least one attempt (from Attempts table).
10.3.1.6.2.2.	Average Exam Score: Average total_percentage across all attempts (from Attempts table).
10.3.1.6.3.	UI: Card styled with bg-white, p-4, shadow-md, rounded-lg, hover effect (hover:shadow-lg).
10.3.1.7.	Card 5: Questions:
10.3.1.7.1.	Total Questions Created: Count of questions in the Questions table (font-bold text-2xl text-gray-800).
10.3.1.7.2.	Additional Info:
10.3.1.7.2.1.	Questions Attempted: Count of questions with at least one answer (from Answers table).
10.3.1.7.2.2.	Correct Answer Rate: Percentage of correct answers across all attempts (from Answers table, using answer_details JSON).
10.3.1.7.3.	UI: Card styled with bg-white, p-4, shadow-md, rounded-lg, hover effect (hover:shadow-lg).
10.3.1.8.	Responsive: Cards stack vertically on mobile (grid-cols-1), 2 columns on small screens (sm:grid-cols-2), 5 columns on large screens (lg:grid-cols-5).
10.3.1.9.	Empty State: If no data exists for a card, display "0" for counts and "N/A" for additional info (text-gray-500).
11.	Left Panel Navigation Menu:
11.1.	Subject:
11.1.1.	Submenu (expands on click):
11.1.1.1.	View Subject: Displays subject cards in the right-side area with a "Create a Subject" button.
11.1.2.	Clicking "Subject" does not trigger any action (serves as a menu header).
11.2.	Lesson:
11.2.1.	Submenu (expands on click):
11.2.1.1.	View Lessons: Displays lesson cards in the right-side area with a subject selector filter and a "Create New Lesson" button.
11.2.2.	Clicking "Lesson" does not trigger any action (serves as a menu header).
11.3.	Topics:
11.3.1.	Submenu (expands on click):
11.3.1.1.	View All Topics: Displays topic cards in the right-side area with subject and lesson selector filters and an "Add New Topic" button.
11.3.2.	Clicking "Topics" does not trigger any action (serves as a menu header).
11.4.	Add Exams:
11.4.1.	Submenu (expands on click):
11.4.1.1.	Create Exam: Triggers a modal for adding a new exam.
11.4.1.2.	Create Custom Exam from Exams: Placeholder (action to be defined later).
11.4.1.3.	Create Custom Exam from Topics: Placeholder (action to be defined later).
11.4.1.4.	Create Custom Exam from Lessons: Placeholder (action to be defined later).
11.4.1.5.	Create Custom Exam from Subjects: Placeholder (action to be defined later).
11.4.2.	Clicking "Add Exams" displays exam cards with filters in the right-side area.
11.5.	Performance: Link to a page displaying performance metrics in a table.
11.6.	Check Answers: Link to a page listing past exam attempts with options to view results and correct answers.
11.7.	UI Design:
11.7.1.	Fixed left panel (collapsible on mobile with hamburger menu, using Tailwind CSS sm:hidden and toggle classes).
11.7.2.	Styling: Menu items with hover:bg-gray-200, p-4, text-gray-700; submenu indented with pl-8.
11.7.3.	Icons: Font Awesome via CDN (e.g., eye for "View Subject", "View Lessons", and "View All Topics"; file for "Create Exam").
11.7.4.	Responsive: Collapses to hamburger menu on mobile (sm: breakpoints).
12.	Subject (Right-Side Area):
12.1.	Trigger: Clicking "View Subject" submenu displays subject cards.
12.2.	Create a Subject Button:
12.2.1.	Location: Top-right corner of the right-side area (flex justify-end p-4).
12.2.2.	Action: Opens the create subject modal.
12.2.3.	UI: Button styled with Tailwind CSS (bg-blue-500, hover:bg-blue-600, text-white, px-4 py-2, rounded-md).
12.3.	Create Subject Modal:
12.3.1.	Action: Triggered by clicking "Create a Subject" button.
12.3.2.	Modal Fields:
12.3.2.1.	Subject Name: Text input, required (input, border-gray-300, rounded-md).
12.3.2.2.	Subject Code: Text input, required, unique (e.g., "MATH101").
12.3.2.3.	Total Number of Lessons: Integer input, required, minimum 0.
12.3.2.4.	Book Name: Text input, optional.
12.3.2.5.	Submit Button: Sends data to POST /api/subjects (bg-blue-500, hover:bg-blue-600, text-white, rounded-md).
12.3.2.6.	Cancel Button: Closes modal (bg-gray-300, hover:bg-gray-400).
12.3.2.7.	Validation: Client-side (JavaScript) and server-side (PHP) checks for non-empty name/code, unique code, valid number for lessons.
12.3.2.8.	Success: Close modal, show toast ("Subject created successfully", bg-green-500, text-white), refresh subject cards.
12.3.2.9.	Error: Show toast (e.g., "Subject code already exists", bg-red-500, text-white).
12.3.2.10.	UI: Modal styled with Tailwind CSS (bg-white, p-6, shadow-xl, rounded-lg, centered with fixed inset-0).
12.4.	Subject Cards Section:
12.4.1.	Fetch subjects via GET /api/subjects (includes counts for lessons, topics, exams, questions, and performance metrics).
12.4.2.	Display: Grid of cards (4 columns on desktop with grid grid-cols-1 md:grid-cols-4 gap-4).
12.4.3.	Each Card:
12.4.3.1.	Subject Name: Bold title (font-bold text-lg text-gray-800).
12.4.3.2.	Total Lessons Created: Count of lessons under the subject (text-gray-600 text-sm).
12.4.3.3.	Total Topics Created: Count of topics under the subject’s lessons (text-gray-600 text-sm).
12.4.3.4.	Total Exams Created: Count of exams linked to the subject, its lessons, or topics (text-gray-600 text-sm).
12.4.3.5.	Total Questions Created: Total questions in exams linked to the subject (text-gray-600 text-sm).
12.4.3.6.	Progress Bar:
12.4.3.6.1.	Logic: (Total Lessons Created / Total Number of Lessons specified for the subject) * 100.
12.4.3.6.2.	Example: If Total Number of Lessons is 10 and 4 are created, progress is 40%.
12.4.3.6.3.	UI: Tailwind CSS progress bar (bg-blue-500 for filled, bg-gray-200 for background, h-2 rounded), with percentage label (text-gray-600 text-xs).
12.4.3.7.	Actions:
12.4.3.7.1.	Edit: Button (bg-yellow-500, hover:bg-yellow-600, text-white, px-2 py-1 rounded) opens a modal with pre-filled fields, submits to PUT /api/subjects/{id}.
12.4.3.7.2.	Delete: Button (bg-red-500, hover:bg-red-600, text-white, px-2 py-1 rounded) triggers confirmation prompt, submits to DELETE /api/subjects/{id}.
12.4.3.8.	UI: Card styled with bg-white, p-4, shadow-md, rounded-lg, hover effect (hover:shadow-lg).
12.4.4.	Responsive: Cards stack vertically on mobile (grid-cols-1).
12.4.5.	Empty State: Display "No subjects added yet" (text-gray-500 text-center p-6).
13.	Lesson (Right-Side Area):
13.1.	Trigger: Clicking "View Lessons" submenu displays a subject selector filter, a "Create New Lesson" button, and lesson cards.
13.2.	Filter (Subject Selector):
13.2.1.	Location: Top-left of the right-side area, horizontally aligned with the "Create New Lesson" button.
13.2.2.	Action: Dropdown populated with subjects from GET /api/subjects, with an "All Subjects" option (select, border-gray-300, rounded-md, w-48 sm:w-64).
13.2.3.	Behavior:
13.2.3.1.	Default: "All Subjects" shows all lessons via GET /api/lessons (or equivalent aggregated endpoint).
13.2.3.2.	Selecting a subject filters lessons via GET /api/subjects/{subject_id}/lessons.
13.2.3.3.	Updates lesson cards dynamically without page reload (using JavaScript fetch).
13.2.4.	UI: Styled with Tailwind CSS (bg-white, border-gray-300, rounded-md, p-2).
13.3.	Create New Lesson Button:
13.3.1.	Location: Top-right corner of the right-side area, horizontally aligned with the subject selector (flex justify-end).
13.3.2.	Action: Opens the create lesson modal.
13.3.3.	UI: Button styled with Tailwind CSS (bg-blue-500, hover:bg-blue-600, text-white, px-4 py-2, rounded-md).
13.4.	Layout:
13.4.1.	Filter and button are in a horizontal row (flex justify-between items-center p-4 bg-white shadow-md rounded-lg).
13.4.2.	Lesson cards appear below the row (mt-4).
13.4.3.	Responsive: On mobile, the filter and button stack vertically (flex-col gap-4) for better usability.
13.5.	Create Lesson Modal:
13.5.1.	Action: Triggered by clicking "Create New Lesson" button.
13.5.2.	Modal Fields:
13.5.2.1.	Subject Selector: Dropdown populated with subjects from GET /api/subjects (select, border-gray-300, rounded-md).
13.5.2.2.	Lesson Name: Text input, required.
13.5.2.3.	Total Number of Topics: Integer input, required, minimum 0.
13.5.2.4.	Page No: Text input, optional (e.g., "45-60").
13.5.2.5.	Submit Button: Sends data to POST /api/lessons (bg-blue-500, hover:bg-blue-600, text-white, rounded-md).
13.5.2.6.	Cancel Button: Closes modal (bg-gray-300, hover:bg-gray-400).
13.5.2.7.	Validation: Client-side (JavaScript) and server-side (PHP) checks for non-empty name, valid subject selection, valid number for topics.
13.5.2.8.	Success: Close modal, show toast ("Lesson created successfully", bg-green-500, text-white), refresh lesson cards based on current filter.
13.5.2.9.	Error: Show toast (e.g., "Failed to create lesson", bg-red-500, text-white).
13.5.2.10.	UI: Modal styled with Tailwind CSS (bg-white, p-6, shadow-xl, rounded-lg, centered with fixed inset-0).
13.6.	Lesson Cards Section:
13.6.1.	Fetch lessons via GET /api/subjects/{subject_id}/lessons (or GET /api/lessons for "All Subjects") including counts for topics, exams, questions, and performance metrics.
13.6.2.	Display: Grid of cards (4 columns on desktop with grid grid-cols-1 md:grid-cols-4 gap-4).
13.6.3.	Each Card:
13.6.3.1.	Lesson Name: Bold title (font-bold text-lg text-gray-800).
13.6.3.2.	Total Topics Created: Count of topics under the lesson (text-gray-600 text-sm).
13.6.3.3.	Total Exams Created: Count of exams linked to the lesson or its topics (text-gray-600 text-sm).
13.6.3.4.	Total Questions Created: Total questions in exams linked to the lesson (text-gray-600 text-sm).
13.6.3.5.	Progress Bar:
13.6.3.5.1.	Logic: (Total Topics Created / Total Number of Topics specified for the lesson) * 100.
13.6.3.5.2.	Example: If Total Number of Topics is 5 and 2 are created, progress is 40%.
13.6.3.5.3.	UI: Tailwind CSS progress bar (bg-blue-500 for filled, bg-gray-200 for background, h-2 rounded), with percentage label (text-gray-600 text-xs).
13.6.3.6.	Actions:
13.6.3.6.1.	Edit: Button (bg-yellow-500, hover:bg-yellow-600, text-white, px-2 py-1 rounded) opens a modal with pre-filled fields, submits to PUT /api/lessons/{id}.
13.6.3.6.2.	Delete: Button (bg-red-500, hover:bg-red-600, text-white, px-2 py-1 rounded) triggers confirmation prompt, submits to DELETE /api/lessons/{id}.
13.6.3.7.	UI: Card styled with bg-white, p-4, shadow-md, rounded-lg, hover effect (hover:shadow-lg).
13.6.4.	Responsive: Cards stack vertically on mobile (grid-cols-1).
13.6.5.	Empty State: Display "No lessons added yet for the selected subject" (text-gray-500 text-center p-6).
14.	Topics (Right-Side Area):
14.1.	Trigger: Clicking "View All Topics" submenu displays subject and lesson selector filters, an "Add New Topic" button, and topic cards.
14.2.	Filters:
14.2.1.	Subject Selector:
14.2.1.1.	Location: Top-left of the right-side area, horizontally aligned with the lesson selector and button.
14.2.1.2.	Action: Dropdown populated with subjects from GET /api/subjects, with an "All Subjects" option (select, border-gray-300, rounded-md, w-48 sm:w-64).
14.2.1.3.	Behavior:
14.2.1.3.1.	Default: "All Subjects" shows all topics (via GET /api/topics or aggregated endpoint).
14.2.1.3.2.	Selecting a subject filters lessons for the lesson selector and topics based on the subject.
14.2.1.4.	UI: Styled with Tailwind CSS (bg-white, border-gray-300, rounded-md, p-2).
14.2.2.	Lesson Selector:
14.2.2.1.	Location: Next to the subject selector, horizontally aligned.
14.2.2.2.	Action: Dropdown dynamically populated with lessons for the selected subject via GET /api/subjects/{subject_id}/lessons, with an "All Lessons" option (select, border-gray-300, rounded-md, w-48 sm:w-64).
14.2.2.3.	Behavior:
14.2.2.3.1.	Default: "All Lessons" shows all topics for the selected subject (or all topics if "All Subjects" is selected).
14.2.2.3.2.	Selecting a lesson filters topics via GET /api/lessons/{lesson_id}/topics.
14.2.2.3.3.	Updates dynamically without page reload (using JavaScript fetch).
14.2.2.4.	UI: Styled with Tailwind CSS (bg-white, border-gray-300, rounded-md, p-2).
14.3.	Add New Topic Button:
14.3.1.	Location: Top-right corner of the right-side area, horizontally aligned with the filters (flex justify-end).
14.3.2.	Action: Opens the create topic modal.
14.3.3.	UI: Button styled with Tailwind CSS (bg-blue-500, hover:bg-blue-600, text-white, px-4 py-2, rounded-md).
14.4.	Layout:
14.4.1.	Filters and button are in a horizontal row (flex flex-wrap justify-between items-center p-4 bg-white shadow-md rounded-lg).
14.4.2.	Topic cards appear below the row (mt-4).
14.4.3.	Responsive: On mobile, filters and button stack vertically (flex-col gap-4) for better usability.
14.5.	Create Topic Modal:
14.5.1.	Action: Triggered by clicking "Add New Topic" button.
14.5.2.	Modal Fields:
14.5.2.1.	Subject Selector: Dropdown populated with subjects from GET /api/subjects (select, border-gray-300, rounded-md).
14.5.2.2.	Lesson Selector: Dropdown dynamically populated with lessons for the selected subject via GET /api/subjects/{subject_id}/lessons (select, border-gray-300, rounded-md).
14.5.2.3.	Topic Name: Text input, required.
14.5.2.4.	Total Number of Exams: Integer input, required, minimum 0.
14.5.2.5.	Page No: Text input, optional (e.g., "45-60").
14.5.2.6.	Submit Button: Sends data to POST /api/topics (bg-blue-500, hover:bg-blue-600, text-white, rounded-md).
14.5.2.7.	Cancel Button: Closes modal (bg-gray-300, liberi::300, rounded-md).
14.5.2.8.	Validation: Client-side (JavaScript) and server-side (PHP) checks for non-empty name, valid subject and lesson selection, valid number for exams.
14.5.2.9.	Success: Close modal, show toast ("Topic created successfully", bg-green-500, text-white), refresh topic cards based on current filters.
14.5.2.10.	Error: Show toast (e.g., "Failed to create topic", bg-red-500, text-white).
14.5.2.11.	UI: Modal styled with Tailwind CSS (bg-white, p-6, shadow-xl, rounded-lg, centered with fixed inset-0).
14.6.	Topic Cards Section:
14.6.1.	Fetch topics via GET /api/lessons/{lesson_id}/topics for a specific lesson, or aggregate topics for a subject or all topics (via GET /api/topics or equivalent) based on filters.
14.6.2.	Display: Grid of cards (4 columns on desktop with grid grid-cols-1 md:grid-cols-4 gap-4).
14.6.3.	Each Card:
14.6.3.1.	Topic Name: Bold title (font-bold text-lg text-gray-800).
14.6.3.2.	Total Exams Created: Count of exams linked to the topic (text-gray-600 text-sm).
14.6.3.3.	Total Questions Created: Total questions in exams linked to the topic (text-gray-600 text-sm).
14.6.3.4.	Progress Bar:
14.6.3.4.1.	Logic: (Total Exams Created / Total Number of Exams specified for the topic) * 100.
14.6.3.4.2.	Example: If Total Number of Exams is 5 and 2 are created, progress is 40%.
14.6.3.4.3.	UI: Tailwind CSS progress bar (bg-blue-500 for filled, bg-gray-200 for background, h-2 rounded), with percentage label (text-gray-600 text-xs).
14.6.3.5.	Actions:
14.6.3.5.1.	Edit: Button (bg-yellow-500, hover:bg-yellow-600, text-white, px-2 py-1 rounded) opens a modal with pre-filled fields, submits to PUT /api/topics/{id}.
14.6.3.5.2.	Delete: Button (bg-red-500, hover:bg-red-600, text-white, px-2 py-1 rounded) triggers confirmation prompt, submits to DELETE /api/topics/{id}.
14.6.3.6.	UI: Card styled with bg-white, p-4, shadow-md, rounded-lg, hover effect (hover:shadow-lg).
14.6.4.	Responsive: Cards stack vertically on mobile (grid-cols-1).
14.6.5.	Empty State: Display "No topics added yet for the selected subject/lesson" (text-gray-500 text-center p-6).
15.	Add Exams (Right-Side Area):
15.1.	Trigger: Clicking "Add Exams" menu displays a filter row and exam cards.
15.2.	Global Filter Row:
15.2.1.	Fields:
15.2.1.1.	Subject Selector: Dropdown populated with subjects from GET /api/subjects (select, border-gray-300, rounded-md).
15.2.1.2.	Lesson Selector: Dropdown dynamically populated with lessons for the selected subject via GET /api/subjects/{subject_id}/lessons (select, border-gray-300, rounded-md).
15.2.1.3.	Topic Selector: Dropdown dynamically populated with topics for the selected lesson via GET /api/lessons/{lesson_id}/topics (select, border-gray-300, rounded-md).
15.2.1.4.	Type Selector: Dropdown with options "General" and "Custom" (select, border-gray-300, rounded-md).
15.2.2.	Behavior: Filters update exam cards dynamically via GET /api/exams with query parameters (subject_id, lesson_id, topic_id, type).
15.2.3.	UI: Filter row styled with Tailwind CSS (flex flex-col sm:flex-row gap-4, p-4, bg-white, shadow-md, rounded-lg).
15.3.	Create Exam (Submenu):
15.3.1.	Action: Clicking "Create Exam" opens a modal.
15.3.2.	Modal Fields:
15.3.2.1.	Subject Selector: Dropdown populated with subjects from GET /api/subjects (select, border-gray-300, rounded-md).
15.3.2.2.	Lesson Selector: Dropdown dynamically populated with lessons for the selected subject via GET /api/subjects/{subject_id}/lessons (select, border-gray-300, rounded-md).
15.3.2.3.	Topic Selector: Dropdown dynamically populated with topics for the selected lesson via GET /api/lessons/{lesson_id}/topics (select, border-gray-300, rounded-md).
15.3.2.4.	Exam Name: Text input, required.
15.3.2.5.	Time Duration: Text input, required (e.g., "30 minutes").
15.3.2.6.	Questions (JSON): Textarea for raw JSON input, required, following the format:
15.3.2.7.	[
15.3.2.8.	  {
15.3.2.9.	    "question": "হরপ্রসাদ শাস্ত্রীসহ বেশিরভাগ বিশেষজ্ঞের মতে চর্যাপদের আদি কবি কে?",
15.3.2.10.	    "options": {
15.3.2.11.	      "A": "শবরপা",
15.3.2.12.	      "B": "কাহ্নপা",
15.3.2.13.	      "C": "লুইপা",
15.3.2.14.	      "D": "ভুসুকুপা"
15.3.2.15.	    },
15.3.2.16.	    "answer": "C"
15.3.2.17.	  }
15.3.2.18.	]
15.3.2.19.	Submit Button: Sends data to POST /api/exams, saving exam details in the Exams table and questions in the Questions table (bg-blue-500, hover:bg-blue-600, text-white, rounded-md).
15.3.2.20.	Cancel Button: Closes modal (bg-gray-300, hover:bg-gray-400).
15.3.2.21.	Validation:
15.3.2.21.1.	Client-side (JavaScript): Validate non-empty name, valid subject/lesson/topic selection, valid JSON format, non-empty time duration.
15.3.2.21.2.	Server-side (PHP): Validate JSON structure, ensure question fields are present, verify UTF-8 encoding for Bengali text.
15.3.2.22.	Success: Close modal, show toast ("Exam created successfully", bg-green-500, text-white), refresh exam cards.
15.3.2.23.	Error: Show toast (e.g., "Invalid JSON format", bg-red-500, text-white).
15.3.2.24.	UI: Modal styled with Tailwind CSS (bg-white, p-6, shadow-xl, rounded-lg, centered with fixed inset-0). Textarea styled with font-mono for JSON readability.
15.4.	Other Submenu Options:
15.4.1.	Create Custom Exam from Exams: Placeholder (action to be defined later).
15.4.2.	Create Custom Exam from Topics: Placeholder (action to be defined later).
15.4.3.	Create Custom Exam from Lessons: Placeholder (action to be defined later).
15.4.4.	Create Custom Exam from Subjects: Placeholder (action to be defined later).
15.4.5.	UI: Submenu items styled with text-gray-700, pl-8, hover:bg-gray-200.
15.5.	Exam Cards Section:
15.5.1.	Fetch exams via GET /api/exams with filters (subject_id, lesson_id, topic_id, type).
15.5.2.	Display: Grid of cards (4 columns on desktop with grid grid-cols-1 md:grid-cols-4 gap-4).
15.5.3.	Each Card:
15.5.3.1.	Exam Name: Bold title (font-bold text-lg text-gray-800).
15.5.3.2.	Subject Name: Name of the associated subject (text-gray-600 text-sm).
15.5.3.3.	Lesson Name: Name of the associated lesson, if applicable (text-gray-600 text-sm).
15.5.3.4.	Topic Name: Name of the associated topic, if applicable (text-gray-600 text-sm).
15.5.3.5.	Number of Questions: Count of questions in the exam (text-gray-600 text-sm).
15.5.3.6.	Time Duration: Duration specified for the exam (e.g., "30 minutes") (text-gray-600 text-sm).
15.5.3.7.	Progress Bar:
15.5.3.7.1.	Logic: (Number of Questions Attempted / Total Number of Questions) * 100, based on data from Attempts and Answers tables.
15.5.3.7.2.	Example: If an exam has 10 questions and 6 have been attempted, progress is 60%.
15.5.3.7.3.	UI: Tailwind CSS progress bar (bg-blue-500 for filled, bg-gray-200 for background, h-2 rounded), with percentage label (text-gray-600 text-xs).
15.5.3.8.	Actions:
15.5.3.8.1.	Start Exam: Button (bg-green-500, hover:bg-green-600, text-white, px-2 py-1 rounded) opens a modal to configure the exam attempt.
15.5.3.8.2.	Manage Questions: Button (bg-blue-500, hover:bg-blue-600, text-white, px-2 py-1 rounded) links to a page for editing questions (to be defined later).
15.5.3.8.3.	Edit: Button (bg-yellow-500, hover:bg-yellow-600, text-white, px-2 py-1 rounded) opens a modal with pre-filled fields, submits to PUT /api/exams/{id}.
15.5.3.8.4.	Delete: Button (bg-red-500, hover:bg-red-600, text-white, px-2 py-1 rounded) triggers confirmation prompt, submits to DELETE /api/exams/{id}.
15.5.3.9.	UI: Card styled with bg-white, p-4, shadow-md, rounded-lg, hover effect (hover:shadow-lg).
15.5.4.	Responsive: Cards stack vertically on mobile (grid-cols-1).
15.5.5.	Empty State: Display "No exams found for the selected filters" (text-gray-500 text-center p-6).
15.6.	Start Exam Functionality:
15.6.1.	Trigger: Clicking "Start Exam" on an exam card opens a modal.
15.6.2.	Modal Fields:
15.6.2.1.	Number of Questions: Readonly input displaying the total questions in the exam (input, border-gray-300, rounded-md, bg-gray-100).
15.6.2.2.	Enter Number of Questions to Attempt: Integer input, required, minimum 1, maximum equal to total questions (input, border-gray-300, rounded-md).
15.6.2.3.	Enter Duration: Integer input for minutes, required, minimum 1 (input, border-gray-300, rounded-md).
15.6.2.4.	Start Button: Initiates the exam in the right-side main area (bg-green-500, hover:bg-green-600, text-white, rounded-md).
15.6.2.5.	Cancel Button: Closes modal (bg-gray-300, hover:bg-gray-400).
15.6.2.6.	Validation: Client-side (JavaScript) checks for valid number of questions (not exceeding total) and positive duration.
15.6.2.7.	UI: Modal styled with Tailwind CSS (bg-white, p-6, shadow-xl, rounded-lg, centered with fixed inset-0).
15.6.3.	Exam Display:
15.6.3.1.	Fetch questions via GET /api/exams/{exam_id} (randomly select the specified number of questions).
15.6.3.2.	Layout: 4-column grid (grid grid-cols-1 md:grid-cols-4 gap-4) resembling an OMR sheet, displayed in the right-side main area.
15.6.3.3.	Each Question:
15.6.3.3.1.	Question Number: e.g., "1" (font-bold text-gray-800).
15.6.3.3.2.	Question Text: Displays the question, supporting Bengali text (text-gray-700).
15.6.3.3.3.	Options: Radio buttons for options (A, B, C, D), shuffled randomly (radio, border-gray-300). Correct answer is mapped to the shuffled options.
15.6.3.3.4.	Selected Option Highlighting: Chosen option highlighted (bg-blue-100), unchangeable after selection.
15.6.3.4.	Timer: Displays countdown based on user-specified duration (bg-gray-100, p-2, text-gray-800, fixed at top-right).
15.6.3.5.	Submit Exam Button: Submits answers manually (bg-blue-500, hover:bg-blue-600, text-white, rounded-md).
15.6.3.6.	Warning Popup: Appears 1 minute before timer expiry (bg-yellow-100, p-4, shadow-md, rounded-lg, centered).
15.6.3.7.	Auto-Submission: Submits answers when timer expires.
15.6.3.8.	Shuffling: Questions and options are shuffled randomly for each attempt using JavaScript.
15.6.3.9.	UI: Styled with Tailwind CSS (bg-white, p-6, shadow-md, rounded-lg), responsive for mobile (single-column).
15.6.4.	Scoring Logic:
15.6.4.1.	Correct Answer: +1 point.
15.6.4.2.	Incorrect Answer: -0.5 points.
15.6.4.3.	Unanswered: 0 points.
15.6.4.4.	Calculated server-side via POST /api/exams/{exam_id}/attempt.
15.6.5.	Post-Submission:
15.6.5.1.	Save to Database:
15.6.5.1.1.	Exams Table: Update with attempt details if needed.
15.6.5.1.2.	Attempts Table: Store exam_id, score, total_percentage, attempt_no (incremented per exam), attempted_at.
15.6.5.1.3.	Answers Table: Store attempt_id, question_id, selected_option, and answer_details as JSON:
15.6.5.1.4.	{
15.6.5.1.5.	  "question_id": 1,
15.6.5.1.6.	  "user_answer": "A",
15.6.5.1.7.	  "correct_answer": "C",
15.6.5.1.8.	  "status": "Incorrect"
15.6.5.1.9.	}
15.6.5.2.	Display: Popup with score, total_percentage, and "Return to Home" button (bg-white, p-6, shadow-xl, rounded-lg, centered).
15.6.5.3.	Redirect: Clicking "Return to Home" redirects to the dashboard homepage.
15.6.5.4.	Success: Show toast ("Exam submitted successfully", bg-green-500, text-white).
15.6.5.5.	Error: Show toast (e.g., "Failed to submit exam", bg-red-500, text-white).
16.	Performance Tracking:
16.1.	Access via "Performance" menu.
16.2.	Fetch metrics via GET /api/performance.
16.3.	Display: Table listing performance metrics with columns:
16.3.1.	Subject: Name of the subject.
16.3.2.	Lesson: Name of the lesson (if applicable).
16.3.3.	Topic: Name of the topic (if applicable).
16.3.4.	Exam: Name of the exam (if applicable).
16.3.5.	Average Score: Average total_percentage from Attempts table.
16.3.6.	Questions Attempted: Count of questions attempted (from Answers table).
16.3.7.	Correct Answer Rate: Percentage of correct answers (from Answers table, using answer_details JSON).
16.4.	Filters: Dropdowns for subject, lesson, topic, date range (styled with select, border-gray-300).
16.5.	UI: Responsive table with Tailwind CSS (bg-white, p-6, shadow-md, rounded-lg, border border-gray-200).
16.6.	Empty State: Display "No performance data available" (text-gray-500 text-center p-6).
17.	Check Answers:
17.1.	Access via "Check Answers" menu.
17.2.	List past attempts with columns (Exam Title, Date, Score, Total Percentage, Attempt No, View Results).
17.3.	View results via GET /api/exams/{exam_id}/results: Show questions, user’s answers, correct answers, answer_details (from JSON), score.
17.4.	UI: Table with green/red indicators for correct/incorrect answers (text-green-500, text-red-500).
18.	UI Enhancements:
18.1.	Consistency: Unified color scheme (blue primary: bg-blue-500), rounded buttons (rounded-md), shadow effects (shadow-md).
18.2.	Feedback: Toast notifications for actions (e.g., "Exam submitted", bg-green-500, text-white).
18.3.	Accessibility: ARIA labels for navigation, forms, cards, and tables; keyboard navigation support.
18.4.	Responsiveness: Tailwind’s responsive classes (sm:, md:, lg:) for mobile and desktop usability.
18.5.	Bengali Support: All text inputs and displays use UTF-8 (utf8mb4) to support Bengali characters.
19.	Database Schema
20.	Notes:
20.1.	All tables use UTF-8 encoding (utf8mb4 character set, utf8mb4_unicode_ci collation) to support Bengali text.
20.2.	No changes to the schema are required, as the updates affect only the UI and navigation.
21.	Subjects Table:
21.1.	id: Integer, Primary Key, Auto-increment
21.2.	name: Varchar(100), Not Null, CHARACTER SET utf8mb4
21.3.	subject_code: Varchar(50), Unique, Not Null, CHARACTER SET utf8mb4
21.4.	total_lessons: Integer, Not Null, Default 0
21.5.	book_name: Varchar(255), Nullable, CHARACTER SET utf8mb4
21.6.	description: Text, Nullable, CHARACTER SET utf8mb4
21.7.	created_at: Timestamp, Default CURRENT_TIMESTAMP
22.	Lessons Table:
22.1.	id: Integer, Primary Key, Auto-increment
22.2.	subject_id: Integer, Foreign Key (references Subjects.id), Not Null
22.3.	title: Varchar(100), Not Null, CHARACTER SET utf8mb4
22.4.	total_topics: Integer, Not Null, Default 0
22.5.	page_no: Varchar(50), Nullable, CHARACTER SET utf8mb4
22.6.	description: Text, Nullable, CHARACTER SET utf8mb4
22.7.	created_at: Timestamp, Default CURRENT_TIMESTAMP
23.	Topics Table:
23.1.	id: Integer, Primary Key, Auto-increment
23.2.	lesson_id: Integer, Foreign Key (references Lessons.id), Not Null
23.3.	name: Varchar(100), Not Null, CHARACTER SET utf8mb4
23.4.	total_exams: Integer, Not Null, Default 0
23.5.	page_no: Varchar(50), Nullable, CHARACTER SET utf8mb4
23.6.	description: Text, Nullable, CHARACTER SET utf8mb4
23.7.	created_at: Timestamp, Default CURRENT_TIMESTAMP
24.	Exams Table:
24.1.	id: Integer, Primary Key, Auto-increment
24.2.	subject_id: Integer, Foreign Key (references Subjects.id), Nullable
24.3.	lesson_id: Integer, Foreign Key (references Lessons.id), Nullable
24.4.	topic_id: Integer, Foreign Key (references Topics.id), Nullable
24.5.	title: Varchar(100), Not Null, CHARACTER SET utf8mb4
24.6.	time_duration: Varchar(50), Not Null, CHARACTER SET utf8mb4
24.7.	type: Enum('General', 'Custom'), Not Null, Default 'General'
24.8.	created_at: Timestamp, Default CURRENT_TIMESTAMP
25.	Questions Table:
25.1.	id: Integer, Primary Key, Auto-increment
25.2.	exam_id: Integer, Foreign Key (references Exams.id), Not Null
25.3.	question_text: Text, Not Null, CHARACTER SET utf8mb4
25.4.	option_a: Varchar(255), Not Null, CHARACTER SET utf8mb4
25.5.	option_b: Varchar(255), Not Null, CHARACTER SET utf8mb4
25.6.	option_c: Varchar(255), Not Null, CHARACTER SET utf8mb4
25.7.	option_d: Varchar(255), Not Null, CHARACTER SET utf8mb4
25.8.	correct_option: Enum('A', 'B', 'C', 'D'), Not Null
26.	Attempts Table:
26.1.	id: Integer, Primary Key, Auto-increment
26.2.	exam_id: Integer, Foreign Key (references Exams.id), Not Null
26.3.	score: Float, Not Null
26.4.	total_percentage: Float, Not Null
26.5.	attempt_no: Integer, Not Null
26.6.	attempted_at: Timestamp, Default CURRENT_TIMESTAMP
27.	Answers Table:
27.1.	id: Integer, Primary Key, Auto-increment
27.2.	attempt_id: Integer, Foreign Key (references Attempts.id), Not Null
27.3.	question_id: Integer, Foreign Key (references Questions.id), Not Null
27.4.	selected_option: Enum('A', 'B', 'C', 'D'), Nullable
27.5.	answer_details: JSON, Not Null (stores question_id, user_answer, correct_answer, status)

28.	This is complete scenario , don’t code first , we will break the app in part by part implement that part and continue to next part 

first give me the parts of this app implementation  then I will say continue x part then you will continue to code 

