-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 24, 2025 at 11:39 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `exam_dashboard`
--

-- --------------------------------------------------------

--
-- Table structure for table `answers`
--

CREATE TABLE `answers` (
  `id` int(11) NOT NULL,
  `attempt_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `selected_option` text DEFAULT NULL,
  `answer_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`answer_details`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `answers`
--

INSERT INTO `answers` (`id`, `attempt_id`, `question_id`, `selected_option`, `answer_details`, `created_at`) VALUES
(79, 40, 577, 'A', '{\"question_id\":577,\"user_answer\":\"A\",\"correct_answer\":\"A\",\"status\":\"Correct\",\"marks_awarded\":1}', '2025-05-24 03:54:11'),
(80, 40, 605, 'B', '{\"question_id\":605,\"user_answer\":\"B\",\"correct_answer\":\"A\",\"status\":\"Incorrect\",\"marks_awarded\":-0}', '2025-05-24 03:54:11'),
(82, 42, 576, 'A', '{\"question_id\":576,\"user_answer\":\"A\",\"correct_answer\":\"B\",\"status\":\"Incorrect\",\"marks_awarded\":-0}', '2025-05-24 05:37:28'),
(83, 43, 586, 'B', '{\"question_id\":586,\"user_answer\":\"B\",\"correct_answer\":\"B\",\"status\":\"Correct\",\"marks_awarded\":1}', '2025-05-24 06:46:15'),
(84, 44, 612, 'A', '{\"question_id\":612,\"user_answer\":\"A\",\"correct_answer\":\"B\",\"status\":\"Incorrect\",\"marks_awarded\":-0.5}', '2025-05-24 08:53:05'),
(85, 44, 613, 'C', '{\"question_id\":613,\"user_answer\":\"C\",\"correct_answer\":\"B\",\"status\":\"Incorrect\",\"marks_awarded\":-0.5}', '2025-05-24 08:53:05');

-- --------------------------------------------------------

--
-- Table structure for table `attempts`
--

CREATE TABLE `attempts` (
  `id` int(11) NOT NULL,
  `exam_id` int(11) NOT NULL,
  `score` float NOT NULL,
  `total_percentage` float NOT NULL,
  `attempt_no` int(11) NOT NULL,
  `attempted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `correct_count` int(11) DEFAULT 0,
  `incorrect_count` int(11) DEFAULT 0,
  `unanswered_count` int(11) DEFAULT 0,
  `is_passed` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attempts`
--

INSERT INTO `attempts` (`id`, `exam_id`, `score`, `total_percentage`, `attempt_no`, `attempted_at`, `created_at`, `correct_count`, `incorrect_count`, `unanswered_count`, `is_passed`) VALUES
(40, 49, 1, 2.5, 1, '2025-05-24 03:54:11', '2025-05-24 03:54:11', 1, 1, 38, 0),
(42, 49, 0, 0, 2, '2025-05-24 05:37:28', '2025-05-24 05:37:28', 0, 1, 39, 0),
(43, 51, 1, 100, 1, '2025-05-24 06:46:15', '2025-05-24 06:46:15', 1, 0, 0, 1),
(44, 52, 0, 0, 1, '2025-05-24 08:53:05', '2025-05-24 08:53:05', 0, 2, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `exams`
--

CREATE TABLE `exams` (
  `id` int(11) NOT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `lesson_id` int(11) DEFAULT NULL,
  `topic_id` int(11) DEFAULT NULL,
  `title` varchar(100) NOT NULL,
  `duration_minutes` int(11) NOT NULL,
  `total_marks` float NOT NULL,
  `pass_marks` float NOT NULL,
  `instructions` text DEFAULT NULL,
  `total_questions` int(11) NOT NULL DEFAULT 0,
  `type` enum('General','Custom') NOT NULL DEFAULT 'General',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `negative_mark_value` decimal(4,2) DEFAULT 0.50
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `exams`
--

INSERT INTO `exams` (`id`, `subject_id`, `lesson_id`, `topic_id`, `title`, `duration_minutes`, `total_marks`, `pass_marks`, `instructions`, `total_questions`, `type`, `created_at`, `negative_mark_value`) VALUES
(49, 7, 10, 11, 'বিখ্যাত পত্রিকা ও সম্পাদক ১ - ২০ ', 40, 40, 40, '', 40, '', '2025-05-24 03:22:51', 0.00),
(51, NULL, NULL, NULL, 'Model  Test', 1, 1, 1, '', 1, 'Custom', '2025-05-24 06:44:46', 0.50),
(52, NULL, NULL, 11, 't', 2, 2, 2, 'This is a custom exam generated from selected existing exams.', 2, 'General', '2025-05-24 08:52:33', 0.50);

-- --------------------------------------------------------

--
-- Table structure for table `exam_questions`
--

CREATE TABLE `exam_questions` (
  `exam_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `order_in_exam` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `exam_questions`
--

INSERT INTO `exam_questions` (`exam_id`, `question_id`, `order_in_exam`) VALUES
(51, 586, 1);

-- --------------------------------------------------------

--
-- Table structure for table `lessons`
--

CREATE TABLE `lessons` (
  `id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `total_topics` int(11) NOT NULL DEFAULT 0,
  `page_no` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lessons`
--

INSERT INTO `lessons` (`id`, `subject_id`, `title`, `total_topics`, `page_no`, `description`, `created_at`) VALUES
(6, 7, 'প্রাচীন যুগ ', 4, '15', '', '2025-05-23 00:29:24'),
(7, 7, 'মধ্য যুগ ', 8, '22', '', '2025-05-23 00:41:18'),
(8, 7, 'আধুনিক যুগ ', 11, '52', '', '2025-05-23 00:42:14'),
(9, 7, 'আধুনিক যুগের উল্লেখযোগ্য সাহিত্যিক ও তাঁদের কর্ম ', 153, '65', '', '2025-05-23 00:43:48'),
(10, 7, 'অন্যান্য গুরুত্বপূর্ণ তথ্য ', 11, '232', '', '2025-05-23 00:45:16');

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE `questions` (
  `id` int(11) NOT NULL,
  `exam_id` int(11) NOT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `question_text` text NOT NULL,
  `question_type` enum('multiple_choice','true_false','short_answer') NOT NULL,
  `options_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options_json`)),
  `correct_answer` varchar(255) DEFAULT NULL,
  `marks` float NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `lesson_id` int(11) DEFAULT NULL,
  `topic_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `questions`
--

INSERT INTO `questions` (`id`, `exam_id`, `subject_id`, `question_text`, `question_type`, `options_json`, `correct_answer`, `marks`, `created_at`, `lesson_id`, `topic_id`) VALUES
(572, 49, 7, 'বাংলা ভাষার প্রথম সাময়িকপত্র কোনটি?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09b8\\u09ae\\u09be\\u099a\\u09be\\u09b0 \\u09a6\\u09b0\\u09cd\\u09aa\\u09a3\"},{\"key\":\"B\",\"value\":\"\\u09a6\\u09bf\\u0997\\u09cd\\u200c\\u09a6\\u09b0\\u09cd\\u09b6\\u09a8\"},{\"key\":\"C\",\"value\":\"\\u09ac\\u09c7\\u0999\\u09cd\\u0997\\u09b2 \\u0997\\u09c7\\u099c\\u09c7\\u099f\"},{\"key\":\"D\",\"value\":\"\\u09ac\\u09be\\u0999\\u09cd\\u0997\\u09be\\u09b2 \\u0997\\u09c7\\u099c\\u09c7\\u099f\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(573, 49, 7, 'দিগ্‌দর্শন পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u099c\\u09c7\\u09ae\\u09cd\\u09b8 \\u0985\\u0997\\u09be\\u09b8\\u09cd\\u099f\\u09be\\u09b8 \\u09b9\\u09bf\\u0995\\u09bf\"},{\"key\":\"B\",\"value\":\"\\u099c\\u09a8 \\u0995\\u09cd\\u09b2\\u09be\\u09b0\\u09cd\\u0995 \\u09ae\\u09be\\u09b0\\u09cd\\u09b6\\u09ae\\u09cd\\u09af\\u09be\\u09a8\"},{\"key\":\"C\",\"value\":\"\\u0997\\u0999\\u09cd\\u0997\\u09be\\u0995\\u09bf\\u09b6\\u09cb\\u09b0 \\u09ad\\u099f\\u09cd\\u099f\\u09be\\u099a\\u09be\\u09b0\\u09cd\\u09af\"},{\"key\":\"D\",\"value\":\"\\u09b0\\u09be\\u099c\\u09be \\u09b0\\u09be\\u09ae\\u09ae\\u09cb\\u09b9\\u09a8 \\u09b0\\u09be\\u09af\\u09bc\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(574, 49, 7, 'বাংলা ভাষায় প্রকাশিত প্রথম পত্রিকা কোনটি?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09a6\\u09bf\\u0997\\u09cd\\u200c\\u09a6\\u09b0\\u09cd\\u09b6\\u09a8\"},{\"key\":\"B\",\"value\":\"\\u09ac\\u09c7\\u0999\\u09cd\\u0997\\u09b2 \\u0997\\u09c7\\u099c\\u09c7\\u099f\"},{\"key\":\"C\",\"value\":\"\\u09b8\\u09ae\\u09be\\u099a\\u09be\\u09b0 \\u09a6\\u09b0\\u09cd\\u09aa\\u09a3\"},{\"key\":\"D\",\"value\":\"\\u09ac\\u09be\\u0999\\u09cd\\u0997\\u09be\\u09b2 \\u0997\\u09c7\\u099c\\u09c7\\u099f\"}]', 'C', 1, '2025-05-24 03:29:05', 10, 11),
(575, 49, 7, 'সমাচার দর্পণ পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u099c\\u09c7\\u09ae\\u09cd\\u09b8 \\u0985\\u0997\\u09be\\u09b8\\u09cd\\u099f\\u09be\\u09b8 \\u09b9\\u09bf\\u0995\\u09bf\"},{\"key\":\"B\",\"value\":\"\\u099c\\u09a8 \\u0995\\u09cd\\u09b2\\u09be\\u09b0\\u09cd\\u0995 \\u09ae\\u09be\\u09b0\\u09cd\\u09b6\\u09ae\\u09cd\\u09af\\u09be\\u09a8\"},{\"key\":\"C\",\"value\":\"\\u0997\\u0999\\u09cd\\u0997\\u09be\\u0995\\u09bf\\u09b6\\u09cb\\u09b0 \\u09ad\\u099f\\u09cd\\u099f\\u09be\\u099a\\u09be\\u09b0\\u09cd\\u09af\"},{\"key\":\"D\",\"value\":\"\\u09b0\\u09be\\u099c\\u09be \\u09b0\\u09be\\u09ae\\u09ae\\u09cb\\u09b9\\u09a8 \\u09b0\\u09be\\u09af\\u09bc\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(576, 49, 7, 'বেঙ্গল গেজেট কত সালে প্রকাশিত হয়?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09e7\\u09ee\\u09e7\\u09ee\"},{\"key\":\"B\",\"value\":\"\\u09e7\\u09ed\\u09ee\\u09e6\"},{\"key\":\"C\",\"value\":\"\\u09e7\\u09ee\\u09e8\\u09e7\"},{\"key\":\"D\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09ef\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(577, 49, 7, 'বেঙ্গল গেজেট পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u099c\\u09c7\\u09ae\\u09cd\\u09b8 \\u0985\\u0997\\u09be\\u09b8\\u09cd\\u099f\\u09be\\u09b8 \\u09b9\\u09bf\\u0995\\u09bf\"},{\"key\":\"B\",\"value\":\"\\u099c\\u09a8 \\u0995\\u09cd\\u09b2\\u09be\\u09b0\\u09cd\\u0995 \\u09ae\\u09be\\u09b0\\u09cd\\u09b6\\u09ae\\u09cd\\u09af\\u09be\\u09a8\"},{\"key\":\"C\",\"value\":\"\\u0997\\u0999\\u09cd\\u0997\\u09be\\u0995\\u09bf\\u09b6\\u09cb\\u09b0 \\u09ad\\u099f\\u09cd\\u099f\\u09be\\u099a\\u09be\\u09b0\\u09cd\\u09af\"},{\"key\":\"D\",\"value\":\"\\u0988\\u09b6\\u09cd\\u09ac\\u09b0\\u099a\\u09a8\\u09cd\\u09a6\\u09cd\\u09b0 \\u0997\\u09c1\\u09aa\\u09cd\\u09a4\"}]', 'A', 1, '2025-05-24 03:29:05', 10, 11),
(578, 49, 7, 'বাংলা ভাষার প্রথম সংবাদপত্র হিসেবে বিতর্কিত পত্রিকা কোনটি?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09b8\\u09ae\\u09be\\u099a\\u09be\\u09b0 \\u09a6\\u09b0\\u09cd\\u09aa\\u09a3\"},{\"key\":\"B\",\"value\":\"\\u09a6\\u09bf\\u0997\\u09cd\\u200c\\u09a6\\u09b0\\u09cd\\u09b6\\u09a8\"},{\"key\":\"C\",\"value\":\"\\u09ac\\u09be\\u0999\\u09cd\\u0997\\u09be\\u09b2 \\u0997\\u09c7\\u099c\\u09c7\\u099f\"},{\"key\":\"D\",\"value\":\"\\u09b8\\u0982\\u09ac\\u09be\\u09a6 \\u09aa\\u09cd\\u09b0\\u09ad\\u09be\\u0995\\u09b0\"}]', 'C', 1, '2025-05-24 03:29:05', 10, 11),
(579, 49, 7, 'বাঙ্গাল গেজেট পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u099c\\u09a8 \\u0995\\u09cd\\u09b2\\u09be\\u09b0\\u09cd\\u0995 \\u09ae\\u09be\\u09b0\\u09cd\\u09b6\\u09ae\\u09cd\\u09af\\u09be\\u09a8\"},{\"key\":\"B\",\"value\":\"\\u099c\\u09c7\\u09ae\\u09cd\\u09b8 \\u0985\\u0997\\u09be\\u09b8\\u09cd\\u099f\\u09be\\u09b8 \\u09b9\\u09bf\\u0995\\u09bf\"},{\"key\":\"C\",\"value\":\"\\u0997\\u0999\\u09cd\\u0997\\u09be\\u0995\\u09bf\\u09b6\\u09cb\\u09b0 \\u09ad\\u099f\\u09cd\\u099f\\u09be\\u099a\\u09be\\u09b0\\u09cd\\u09af\"},{\"key\":\"D\",\"value\":\"\\u09b0\\u09be\\u099c\\u09be \\u09b0\\u09be\\u09ae\\u09ae\\u09cb\\u09b9\\u09a8 \\u09b0\\u09be\\u09af\\u09bc\"}]', 'C', 1, '2025-05-24 03:29:05', 10, 11),
(580, 49, 7, 'ব্রাহ্মণসেবধি পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09ad\\u09ac\\u09be\\u09a8\\u09c0\\u099a\\u09b0\\u09a3 \\u09ac\\u09a8\\u09cd\\u09a6\\u09cd\\u09af\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"},{\"key\":\"B\",\"value\":\"\\u09b0\\u09be\\u099c\\u09be \\u09b0\\u09be\\u09ae\\u09ae\\u09cb\\u09b9\\u09a8 \\u09b0\\u09be\\u09af\\u09bc\"},{\"key\":\"C\",\"value\":\"\\u0988\\u09b6\\u09cd\\u09ac\\u09b0\\u099a\\u09a8\\u09cd\\u09a6\\u09cd\\u09b0 \\u0997\\u09c1\\u09aa\\u09cd\\u09a4\"},{\"key\":\"D\",\"value\":\"\\u09a6\\u0995\\u09cd\\u09b7\\u09bf\\u09a3\\u09be\\u09b0\\u099e\\u09cd\\u099c\\u09a8 \\u09ae\\u09c1\\u0996\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(581, 49, 7, 'ব্রাহ্মণসেবধি কত সালে প্রকাশিত হয়?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09e7\\u09ee\\u09e7\\u09ee\"},{\"key\":\"B\",\"value\":\"\\u09e7\\u09ee\\u09e8\\u09e7\"},{\"key\":\"C\",\"value\":\"\\u09e7\\u09ee\\u09e8\\u09e8\"},{\"key\":\"D\",\"value\":\"\\u09e7\\u09ee\\u09e8\\u09ef\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(582, 49, 7, 'সংবাদ কৌমুদী পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09ad\\u09ac\\u09be\\u09a8\\u09c0\\u099a\\u09b0\\u09a3 \\u09ac\\u09a8\\u09cd\\u09a6\\u09cd\\u09af\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"},{\"key\":\"B\",\"value\":\"\\u09b0\\u09be\\u099c\\u09be \\u09b0\\u09be\\u09ae\\u09ae\\u09cb\\u09b9\\u09a8 \\u09b0\\u09be\\u09af\\u09bc\"},{\"key\":\"C\",\"value\":\"\\u0988\\u09b6\\u09cd\\u09ac\\u09b0\\u099a\\u09a8\\u09cd\\u09a6\\u09cd\\u09b0 \\u0997\\u09c1\\u09aa\\u09cd\\u09a4\"},{\"key\":\"D\",\"value\":\"\\u09b6\\u09c7\\u0996 \\u0986\\u09b2\\u09c0\\u09ae\\u09c1\\u09b2\\u09cd\\u09b2\\u09be\\u09b9\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(583, 49, 7, 'সংবাদ কৌমুদী কত সালে প্রকাশিত হয়?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09e7\\u09ee\\u09e7\\u09ee\"},{\"key\":\"B\",\"value\":\"\\u09e7\\u09ee\\u09e8\\u09e7\"},{\"key\":\"C\",\"value\":\"\\u09e7\\u09ee\\u09e8\\u09e8\"},{\"key\":\"D\",\"value\":\"\\u09e7\\u09ee\\u09e8\\u09ef\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(584, 49, 7, 'ফার্সি ভাষায় প্রকাশিত রাজা রামমোহন রায়ের পত্রিকা কোনটি?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09b8\\u0982\\u09ac\\u09be\\u09a6 \\u0995\\u09cc\\u09ae\\u09c1\\u09a6\\u09c0\"},{\"key\":\"B\",\"value\":\"\\u09b8\\u09ae\\u09be\\u099a\\u09be\\u09b0 \\u099a\\u09a8\\u09cd\\u09a6\\u09cd\\u09b0\\u09bf\\u0995\\u09be\"},{\"key\":\"C\",\"value\":\"\\u09ae\\u09c0\\u09b0\\u09be\\u09a4\\u09c1\\u09b2 \\u0986\\u0996\\u09ac\\u09be\\u09b0\"},{\"key\":\"D\",\"value\":\"\\u09b8\\u0982\\u09ac\\u09be\\u09a6 \\u09aa\\u09cd\\u09b0\\u09ad\\u09be\\u0995\\u09b0\"}]', 'C', 1, '2025-05-24 03:29:05', 10, 11),
(585, 49, 7, 'মীরাতুল আখবার কত সালে প্রকাশিত হয়?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09e7\\u09ee\\u09e8\\u09e7\"},{\"key\":\"B\",\"value\":\"\\u09e7\\u09ee\\u09e8\\u09e8\"},{\"key\":\"C\",\"value\":\"\\u09e7\\u09ee\\u09e8\\u09ef\"},{\"key\":\"D\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09e7\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(586, 49, 7, 'সমাচার চন্দ্রিকা পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09b0\\u09be\\u099c\\u09be \\u09b0\\u09be\\u09ae\\u09ae\\u09cb\\u09b9\\u09a8 \\u09b0\\u09be\\u09af\\u09bc\"},{\"key\":\"B\",\"value\":\"\\u09ad\\u09ac\\u09be\\u09a8\\u09c0\\u099a\\u09b0\\u09a3 \\u09ac\\u09a8\\u09cd\\u09a6\\u09cd\\u09af\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"},{\"key\":\"C\",\"value\":\"\\u0988\\u09b6\\u09cd\\u09ac\\u09b0\\u099a\\u09a8\\u09cd\\u09a6\\u09cd\\u09b0 \\u0997\\u09c1\\u09aa\\u09cd\\u09a4\"},{\"key\":\"D\",\"value\":\"\\u09a6\\u0995\\u09cd\\u09b7\\u09bf\\u09a3\\u09be\\u09b0\\u099e\\u09cd\\u099c\\u09a8 \\u09ae\\u09c1\\u0996\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(587, 49, 7, 'সমাচার চন্দ্রিকা কত সালে প্রকাশিত হয়?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09e7\\u09ee\\u09e8\\u09e7\"},{\"key\":\"B\",\"value\":\"\\u09e7\\u09ee\\u09e8\\u09e8\"},{\"key\":\"C\",\"value\":\"\\u09e7\\u09ee\\u09e8\\u09ef\"},{\"key\":\"D\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09e7\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(588, 49, 7, 'বঙ্গদূত পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09b0\\u09be\\u099c\\u09be \\u09b0\\u09be\\u09ae\\u09ae\\u09cb\\u09b9\\u09a8 \\u09b0\\u09be\\u09af\\u09bc\"},{\"key\":\"B\",\"value\":\"\\u09ad\\u09ac\\u09be\\u09a8\\u09c0\\u099a\\u09b0\\u09a3 \\u09ac\\u09a8\\u09cd\\u09a6\\u09cd\\u09af\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"},{\"key\":\"C\",\"value\":\"\\u09b0\\u09be\\u099c\\u09be \\u09b0\\u09be\\u09ae\\u09ae\\u09cb\\u09b9\\u09a8 \\u09b0\\u09be\\u09af\\u09bc \\u0993 \\u09ad\\u09ac\\u09be\\u09a8\\u09c0\\u099a\\u09b0\\u09a3 \\u09ac\\u09a8\\u09cd\\u09a6\\u09cd\\u09af\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"},{\"key\":\"D\",\"value\":\"\\u0988\\u09b6\\u09cd\\u09ac\\u09b0\\u099a\\u09a8\\u09cd\\u09a6\\u09cd\\u09b0 \\u0997\\u09c1\\u09aa\\u09cd\\u09a4\"}]', 'C', 1, '2025-05-24 03:29:05', 10, 11),
(589, 49, 7, 'বঙ্গদূত কত সালে প্রকাশিত হয়?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09e7\\u09ee\\u09e8\\u09e8\"},{\"key\":\"B\",\"value\":\"\\u09e7\\u09ee\\u09e8\\u09ef\"},{\"key\":\"C\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09e7\"},{\"key\":\"D\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09ef\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(590, 49, 7, 'সাপ্তাহিক সংবাদ প্রভাকর পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09b0\\u09be\\u099c\\u09be \\u09b0\\u09be\\u09ae\\u09ae\\u09cb\\u09b9\\u09a8 \\u09b0\\u09be\\u09af\\u09bc\"},{\"key\":\"B\",\"value\":\"\\u09ad\\u09ac\\u09be\\u09a8\\u09c0\\u099a\\u09b0\\u09a3 \\u09ac\\u09a8\\u09cd\\u09a6\\u09cd\\u09af\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"},{\"key\":\"C\",\"value\":\"\\u0988\\u09b6\\u09cd\\u09ac\\u09b0\\u099a\\u09a8\\u09cd\\u09a6\\u09cd\\u09b0 \\u0997\\u09c1\\u09aa\\u09cd\\u09a4\"},{\"key\":\"D\",\"value\":\"\\u09a6\\u0995\\u09cd\\u09b7\\u09bf\\u09a3\\u09be\\u09b0\\u099e\\u09cd\\u099c\\u09a8 \\u09ae\\u09c1\\u0996\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"}]', 'C', 1, '2025-05-24 03:29:05', 10, 11),
(591, 49, 7, 'সাপ্তাহিক সংবাদ প্রভাকর কত সালে প্রকাশিত হয়?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09e7\\u09ee\\u09e8\\u09ef\"},{\"key\":\"B\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09e7\"},{\"key\":\"C\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09e8\"},{\"key\":\"D\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09ef\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(592, 49, 7, 'জ্ঞানান্বেষণ পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u0988\\u09b6\\u09cd\\u09ac\\u09b0\\u099a\\u09a8\\u09cd\\u09a6\\u09cd\\u09b0 \\u0997\\u09c1\\u09aa\\u09cd\\u09a4\"},{\"key\":\"B\",\"value\":\"\\u09a6\\u0995\\u09cd\\u09b7\\u09bf\\u09a3\\u09be\\u09b0\\u099e\\u09cd\\u099c\\u09a8 \\u09ae\\u09c1\\u0996\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"},{\"key\":\"C\",\"value\":\"\\u09b6\\u09c7\\u0996 \\u0986\\u09b2\\u09c0\\u09ae\\u09c1\\u09b2\\u09cd\\u09b2\\u09be\\u09b9\"},{\"key\":\"D\",\"value\":\"\\u0985\\u0995\\u09cd\\u09b7\\u09af\\u09bc\\u0995\\u09c1\\u09ae\\u09be\\u09b0 \\u09a6\\u09a4\\u09cd\\u09a4\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(593, 49, 7, 'জ্ঞানান্বেষণ কত সালে প্রকাশিত হয়?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09e7\\u09ee\\u09e8\\u09ef\"},{\"key\":\"B\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09e7\"},{\"key\":\"C\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09e8\"},{\"key\":\"D\",\"value\":\"\\u09e7\\u09ee\\u09ea\\u09e9\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(594, 49, 7, 'সমাচার সভারাজেন্দ্র পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09a6\\u0995\\u09cd\\u09b7\\u09bf\\u09a3\\u09be\\u09b0\\u099e\\u09cd\\u099c\\u09a8 \\u09ae\\u09c1\\u0996\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"},{\"key\":\"B\",\"value\":\"\\u09b6\\u09c7\\u0996 \\u0986\\u09b2\\u09c0\\u09ae\\u09c1\\u09b2\\u09cd\\u09b2\\u09be\\u09b9\"},{\"key\":\"C\",\"value\":\"\\u0988\\u09b6\\u09cd\\u09ac\\u09b0\\u099a\\u09a8\\u09cd\\u09a6\\u09cd\\u09b0 \\u0997\\u09c1\\u09aa\\u09cd\\u09a4\"},{\"key\":\"D\",\"value\":\"\\u09b0\\u0999\\u09cd\\u0997\\u09b2\\u09be\\u09b2 \\u09ac\\u09a8\\u09cd\\u09a6\\u09cd\\u09af\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(595, 49, 7, 'সমাচার সভারাজেন্দ্র কত সালে প্রকাশিত হয়?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09e7\"},{\"key\":\"B\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09e8\"},{\"key\":\"C\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09ef\"},{\"key\":\"D\",\"value\":\"\\u09e7\\u09ee\\u09ea\\u09e9\"}]', 'A', 1, '2025-05-24 03:29:05', 10, 11),
(596, 49, 7, 'সংবাদ রত্নাবলী পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09b6\\u09c7\\u0996 \\u0986\\u09b2\\u09c0\\u09ae\\u09c1\\u09b2\\u09cd\\u09b2\\u09be\\u09b9\"},{\"key\":\"B\",\"value\":\"\\u0988\\u09b6\\u09cd\\u09ac\\u09b0\\u099a\\u09a8\\u09cd\\u09a6\\u09cd\\u09b0 \\u0997\\u09c1\\u09aa\\u09cd\\u09a4\"},{\"key\":\"C\",\"value\":\"\\u0985\\u0995\\u09cd\\u09b7\\u09af\\u09bc\\u0995\\u09c1\\u09ae\\u09be\\u09b0 \\u09a6\\u09a4\\u09cd\\u09a4\"},{\"key\":\"D\",\"value\":\"\\u09b0\\u0999\\u09cd\\u0997\\u09b2\\u09be\\u09b2 \\u09ac\\u09a8\\u09cd\\u09a6\\u09cd\\u09af\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(597, 49, 7, 'সংবাদ রত্নাবলী কত সালে প্রকাশিত হয়?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09e7\"},{\"key\":\"B\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09e8\"},{\"key\":\"C\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09ef\"},{\"key\":\"D\",\"value\":\"\\u09e7\\u09ee\\u09ea\\u09e9\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(598, 49, 7, 'বাংলা ভাষায় রচিত প্রথম দৈনিক পত্রিকা কোনটি?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09b8\\u0982\\u09ac\\u09be\\u09a6 \\u0995\\u09cc\\u09ae\\u09c1\\u09a6\\u09c0\"},{\"key\":\"B\",\"value\":\"\\u09b8\\u0982\\u09ac\\u09be\\u09a6 \\u09b0\\u09a4\\u09cd\\u09a8\\u09be\\u09ac\\u09b2\\u09c0\"},{\"key\":\"C\",\"value\":\"\\u09b8\\u0982\\u09ac\\u09be\\u09a6 \\u09aa\\u09cd\\u09b0\\u09ad\\u09be\\u0995\\u09b0 (\\u09a6\\u09c8\\u09a8\\u09bf\\u0995)\"},{\"key\":\"D\",\"value\":\"\\u09a4\\u09a4\\u09cd\\u09a4\\u09cd\\u09ac\\u09ac\\u09cb\\u09a7\\u09bf\\u09a8\\u09c0\"}]', 'C', 1, '2025-05-24 03:29:05', 10, 11),
(599, 49, 7, 'দৈনিক সংবাদ প্রভাকর পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09b0\\u09be\\u099c\\u09be \\u09b0\\u09be\\u09ae\\u09ae\\u09cb\\u09b9\\u09a8 \\u09b0\\u09be\\u09af\\u09bc\"},{\"key\":\"B\",\"value\":\"\\u0988\\u09b6\\u09cd\\u09ac\\u09b0\\u099a\\u09a8\\u09cd\\u09a6\\u09cd\\u09b0 \\u0997\\u09c1\\u09aa\\u09cd\\u09a4\"},{\"key\":\"C\",\"value\":\"\\u0985\\u0995\\u09cd\\u09b7\\u09af\\u09bc\\u0995\\u09c1\\u09ae\\u09be\\u09b0 \\u09a6\\u09a4\\u09cd\\u09a4\"},{\"key\":\"D\",\"value\":\"\\u0997\\u09c1\\u09b0\\u09c1\\u099a\\u09b0\\u09a3 \\u09b6\\u09b0\\u09cd\\u09ae\\u09be \\u09b0\\u09be\\u09af\\u09bc\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(600, 49, 7, 'তত্ত্ববোধিনী পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u0988\\u09b6\\u09cd\\u09ac\\u09b0\\u099a\\u09a8\\u09cd\\u09a6\\u09cd\\u09b0 \\u0997\\u09c1\\u09aa\\u09cd\\u09a4\"},{\"key\":\"B\",\"value\":\"\\u0985\\u0995\\u09cd\\u09b7\\u09af\\u09bc\\u0995\\u09c1\\u09ae\\u09be\\u09b0 \\u09a6\\u09a4\\u09cd\\u09a4\"},{\"key\":\"C\",\"value\":\"\\u09b0\\u0999\\u09cd\\u0997\\u09b2\\u09be\\u09b2 \\u09ac\\u09a8\\u09cd\\u09a6\\u09cd\\u09af\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"},{\"key\":\"D\",\"value\":\"\\u0997\\u09c1\\u09b0\\u09c1\\u099a\\u09b0\\u09a3 \\u09b6\\u09b0\\u09cd\\u09ae\\u09be \\u09b0\\u09be\\u09af\\u09bc\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(601, 49, 7, 'তত্ত্ববোধিনী কত সালে প্রকাশিত হয়?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09ef\"},{\"key\":\"B\",\"value\":\"\\u09e7\\u09ee\\u09ea\\u09e9\"},{\"key\":\"C\",\"value\":\"\\u09e7\\u09ee\\u09ea\\u09ec\"},{\"key\":\"D\",\"value\":\"\\u09e7\\u09ee\\u09ea\\u09ed\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(602, 49, 7, 'সাপ্তাহিক পাষণ্ড পীড়ন পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u0985\\u0995\\u09cd\\u09b7\\u09af\\u09bc\\u0995\\u09c1\\u09ae\\u09be\\u09b0 \\u09a6\\u09a4\\u09cd\\u09a4\"},{\"key\":\"B\",\"value\":\"\\u0988\\u09b6\\u09cd\\u09ac\\u09b0\\u099a\\u09a8\\u09cd\\u09a6\\u09cd\\u09b0 \\u0997\\u09c1\\u09aa\\u09cd\\u09a4\"},{\"key\":\"C\",\"value\":\"\\u09b0\\u0999\\u09cd\\u0997\\u09b2\\u09be\\u09b2 \\u09ac\\u09a8\\u09cd\\u09a6\\u09cd\\u09af\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"},{\"key\":\"D\",\"value\":\"\\u0997\\u09c1\\u09b0\\u09c1\\u099a\\u09b0\\u09a3 \\u09b6\\u09b0\\u09cd\\u09ae\\u09be \\u09b0\\u09be\\u09af\\u09bc\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(603, 49, 7, 'পাষণ্ড পীড়ন কত সালে প্রকাশিত হয়?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09e7\\u09ee\\u09ea\\u09e9\"},{\"key\":\"B\",\"value\":\"\\u09e7\\u09ee\\u09ea\\u09ec\"},{\"key\":\"C\",\"value\":\"\\u09e7\\u09ee\\u09ea\\u09ed\"},{\"key\":\"D\",\"value\":\"\\u09e7\\u09ee\\u09eb\\u09e6\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(604, 49, 7, 'এডুকেশন গেজেট পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u0988\\u09b6\\u09cd\\u09ac\\u09b0\\u099a\\u09a8\\u09cd\\u09a6\\u09cd\\u09b0 \\u0997\\u09c1\\u09aa\\u09cd\\u09a4\"},{\"key\":\"B\",\"value\":\"\\u09b0\\u0999\\u09cd\\u0997\\u09b2\\u09be\\u09b2 \\u09ac\\u09a8\\u09cd\\u09a6\\u09cd\\u09af\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"},{\"key\":\"C\",\"value\":\"\\u0997\\u09c1\\u09b0\\u09c1\\u099a\\u09b0\\u09a3 \\u09b6\\u09b0\\u09cd\\u09ae\\u09be \\u09b0\\u09be\\u09af\\u09bc\"},{\"key\":\"D\",\"value\":\"\\u0986\\u09ac\\u09c1\\u09b2 \\u0995\\u09be\\u09b2\\u09be\\u09ae \\u09b6\\u09be\\u09ae\\u09b8\\u09c1\\u09a6\\u09cd\\u09a6\\u09c0\\u09a8\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(605, 49, 7, 'এডুকেশন গেজেট কত সালে প্রকাশিত হয়?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09e7\\u09ee\\u09ea\\u09ec\"},{\"key\":\"B\",\"value\":\"\\u09e7\\u09ee\\u09ea\\u09ed\"},{\"key\":\"C\",\"value\":\"\\u09e7\\u09ee\\u09eb\\u09e6\"},{\"key\":\"D\",\"value\":\"\\u09e7\\u09ee\\u09eb\\u09ed\"}]', 'A', 1, '2025-05-24 03:29:05', 10, 11),
(606, 49, 7, 'সংবাদ সাধুরঞ্জন পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09b0\\u0999\\u09cd\\u0997\\u09b2\\u09be\\u09b2 \\u09ac\\u09a8\\u09cd\\u09a6\\u09cd\\u09af\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"},{\"key\":\"B\",\"value\":\"\\u0997\\u09c1\\u09b0\\u09c1\\u099a\\u09b0\\u09a3 \\u09b6\\u09b0\\u09cd\\u09ae\\u09be \\u09b0\\u09be\\u09af\\u09bc\"},{\"key\":\"C\",\"value\":\"\\u0988\\u09b6\\u09cd\\u09ac\\u09b0\\u099a\\u09a8\\u09cd\\u09a6\\u09cd\\u09b0 \\u0997\\u09c1\\u09aa\\u09cd\\u09a4\"},{\"key\":\"D\",\"value\":\"\\u0986\\u09ac\\u09c1\\u09b2 \\u0995\\u09be\\u09b2\\u09be\\u09ae \\u09b6\\u09be\\u09ae\\u09b8\\u09c1\\u09a6\\u09cd\\u09a6\\u09c0\\u09a8\"}]', 'C', 1, '2025-05-24 03:29:05', 10, 11),
(607, 49, 7, 'সংবাদ সাধুরঞ্জন কত সালে প্রকাশিত হয়?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09e7\\u09ee\\u09ea\\u09ec\"},{\"key\":\"B\",\"value\":\"\\u09e7\\u09ee\\u09ea\\u09ed\"},{\"key\":\"C\",\"value\":\"\\u09e7\\u09ee\\u09eb\\u09e6\"},{\"key\":\"D\",\"value\":\"\\u09e7\\u09ee\\u09ec\\u09e9\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(608, 49, 7, 'বাংলাদেশ ভূখণ্ড থেকে প্রকাশিত প্রথম পত্রিকা কোনটি?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09b8\\u0982\\u09ac\\u09be\\u09a6 \\u09b8\\u09be\\u09a7\\u09c1\\u09b0\\u099e\\u09cd\\u099c\\u09a8\"},{\"key\":\"B\",\"value\":\"\\u09b0\\u0982\\u09aa\\u09c1\\u09b0 \\u09ac\\u09be\\u09b0\\u09cd\\u09a4\\u09be\\u09ac\\u09b9\"},{\"key\":\"C\",\"value\":\"\\u09b8\\u0982\\u09ac\\u09be\\u09a6 \\u09b0\\u09b8\\u09b8\\u09be\\u0997\\u09b0\"},{\"key\":\"D\",\"value\":\"\\u09b8\\u09be\\u09aa\\u09cd\\u09a4\\u09be\\u09b9\\u09bf\\u0995 \\u09ae\\u09c1\\u09b8\\u09b2\\u09bf\\u09ae \\u099c\\u0997\\u09ce\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(609, 49, 7, 'রংপুর বার্তাবহ পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u0988\\u09b6\\u09cd\\u09ac\\u09b0\\u099a\\u09a8\\u09cd\\u09a6\\u09cd\\u09b0 \\u0997\\u09c1\\u09aa\\u09cd\\u09a4\"},{\"key\":\"B\",\"value\":\"\\u09b0\\u0999\\u09cd\\u0997\\u09b2\\u09be\\u09b2 \\u09ac\\u09a8\\u09cd\\u09a6\\u09cd\\u09af\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"},{\"key\":\"C\",\"value\":\"\\u0997\\u09c1\\u09b0\\u09c1\\u099a\\u09b0\\u09a3 \\u09b6\\u09b0\\u09cd\\u09ae\\u09be \\u09b0\\u09be\\u09af\\u09bc\"},{\"key\":\"D\",\"value\":\"\\u0986\\u09ac\\u09c1\\u09b2 \\u0995\\u09be\\u09b2\\u09be\\u09ae \\u09b6\\u09be\\u09ae\\u09b8\\u09c1\\u09a6\\u09cd\\u09a6\\u09c0\\u09a8\"}]', 'C', 1, '2025-05-24 03:29:05', 10, 11),
(610, 49, 7, 'সংবাদ রসসাগর পত্রিকার সম্পাদক কে ছিলেন?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u0997\\u09c1\\u09b0\\u09c1\\u099a\\u09b0\\u09a3 \\u09b6\\u09b0\\u09cd\\u09ae\\u09be \\u09b0\\u09be\\u09af\\u09bc\"},{\"key\":\"B\",\"value\":\"\\u09b0\\u0999\\u09cd\\u0997\\u09b2\\u09be\\u09b2 \\u09ac\\u09a8\\u09cd\\u09a6\\u09cd\\u09af\\u09cb\\u09aa\\u09be\\u09a7\\u09cd\\u09af\\u09be\\u09af\\u09bc\"},{\"key\":\"C\",\"value\":\"\\u0986\\u09ac\\u09c1\\u09b2 \\u0995\\u09be\\u09b2\\u09be\\u09ae \\u09b6\\u09be\\u09ae\\u09b8\\u09c1\\u09a6\\u09cd\\u09a6\\u09c0\\u09a8\"},{\"key\":\"D\",\"value\":\"\\u09b8\\u09cd\\u09ac\\u09b0\\u09cd\\u09a3\\u0995\\u09c1\\u09ae\\u09be\\u09b0\\u09c0 \\u09a6\\u09c7\\u09ac\\u09c0\"}]', 'B', 1, '2025-05-24 03:29:05', 10, 11),
(611, 49, 7, 'সংবাদ রসসাগর কত সালে প্রকাশিত হয়?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09e7\\u09ee\\u09ea\\u09ec\"},{\"key\":\"B\",\"value\":\"\\u09e7\\u09ee\\u09ea\\u09ed\"},{\"key\":\"C\",\"value\":\"\\u09e7\\u09ee\\u09eb\\u09e6\"},{\"key\":\"D\",\"value\":\"\\u09e7\\u09ee\\u09ed\\u09ee\"}]', 'C', 1, '2025-05-24 03:29:05', 10, 11),
(612, 52, NULL, 'সংবাদ রত্নাবলী কত সালে প্রকাশিত হয়?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09e7\"},{\"key\":\"B\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09e8\"},{\"key\":\"C\",\"value\":\"\\u09e7\\u09ee\\u09e9\\u09ef\"},{\"key\":\"D\",\"value\":\"\\u09e7\\u09ee\\u09ea\\u09e9\"}]', 'B', 1, '2025-05-24 08:52:33', NULL, NULL),
(613, 52, NULL, 'বাংলা ভাষার প্রথম সাময়িকপত্র কোনটি?', 'multiple_choice', '[{\"key\":\"A\",\"value\":\"\\u09b8\\u09ae\\u09be\\u099a\\u09be\\u09b0 \\u09a6\\u09b0\\u09cd\\u09aa\\u09a3\"},{\"key\":\"B\",\"value\":\"\\u09a6\\u09bf\\u0997\\u09cd\\u200c\\u09a6\\u09b0\\u09cd\\u09b6\\u09a8\"},{\"key\":\"C\",\"value\":\"\\u09ac\\u09c7\\u0999\\u09cd\\u0997\\u09b2 \\u0997\\u09c7\\u099c\\u09c7\\u099f\"},{\"key\":\"D\",\"value\":\"\\u09ac\\u09be\\u0999\\u09cd\\u0997\\u09be\\u09b2 \\u0997\\u09c7\\u099c\\u09c7\\u099f\"}]', 'B', 1, '2025-05-24 08:52:33', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `subject_code` varchar(50) NOT NULL,
  `total_lessons` int(11) NOT NULL DEFAULT 0,
  `book_name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `name`, `subject_code`, `total_lessons`, `book_name`, `description`, `created_at`) VALUES
(7, 'বাংলা সাহিত্য - ২০', '101', 10, '৪৫ তম বিসিএস প্রিলি প্রিপারেশন বুক ', '', '2025-05-23 00:28:23'),
(8, 'বাংলা ব্যাকরণ - ১৫', '102', 33, '৪৫ তম বিসিএস প্রিলি প্রিপারেশন বুক বাংলা ভাষা  , ATM , অভিযাত্রী ', '', '2025-05-23 04:50:28'),
(9, 'English Literature - 15', '201', 15, '45th BCS Preli Preparation Book', '', '2025-05-23 04:52:12'),
(10, 'English Grammar - 20', '202', 59, 'MASTER', '', '2025-05-23 04:52:56'),
(11, 'বাংলাদেশ বিষয়াবলী - ৩০', '301', 14, '৪৫ তম BCS প্রিলি প্রিপারেশন বুক বাংলাদেশ বিষয়াবলী', '', '2025-05-23 05:00:23'),
(12, 'আন্তর্জাতিক বিষয়াবলী - ২০', '302', 22, '৪৫ তম BCS প্রিলি প্রিপারেশন বুক আন্তর্জাতিক বিষয়াবলী ', '', '2025-05-23 05:02:11'),
(13, 'ভূগোল ( বাংলাদেশ ও বিশ্ব ) , পরিবেশ ও দুর্যোগ ব্যাবস্থাপনা - ১০', '401', 7, '৪৫ তম BCS প্রিলি প্রিপারেশন বুক ভূগোল ( বাংলাদেশ ও বিশ্ব ) , পরিবেশ ও দুর্যোগ ব্যাবস্থাপনা', '', '2025-05-23 05:03:11'),
(14, 'সাধারণ বিজ্ঞান - ১৫', '402', 19, '৪৫ তম BCS প্রিলি প্রিপারেশন বুক সাধারণ বিজ্ঞান - ১৫', '', '2025-05-23 05:04:31'),
(15, 'কম্পিউটার ও তথ্য প্রযুক্তি - ১৫', '403', 9, '৪৫ তম BCS প্রিলি প্রিপারেশন বুক কম্পিউটার ও তথ্য প্রযুক্তি ', '', '2025-05-23 05:05:51'),
(16, 'গাণিতিক যুক্তি - ১৫', '404', 47, 'Basic Math', '', '2025-05-23 05:07:10'),
(17, 'মানসিক দক্ষতা -১৫', '405', 6, '৪৫ তম BCS প্রিলি প্রিপারেশন বুক মানসিক দক্ষতা', '', '2025-05-23 05:08:12'),
(18, 'নৈতিকতা , মূল্যবোধ ও সুশাসন - ১০', '406', 8, '৪৫ তম BCS প্রিলি প্রিপারেশন বুক মানসিক দক্ষতা', '', '2025-05-23 05:09:01'),
(19, 'IT', '501', 17, 'Cloud IT Solution', '', '2025-05-23 05:14:40'),
(20, 'Job Solution', '601', 3, 'Professor&#039;s Job Soltuion', '', '2025-05-23 05:15:52'),
(21, 'Bank', '701', 2, 'Professor&#039;s Bank Job', '', '2025-05-23 05:16:43');

-- --------------------------------------------------------

--
-- Table structure for table `topics`
--

CREATE TABLE `topics` (
  `id` int(11) NOT NULL,
  `lesson_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `total_exams` int(11) NOT NULL DEFAULT 0,
  `chapter_no` varchar(50) DEFAULT NULL,
  `page_no` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `topics`
--

INSERT INTO `topics` (`id`, `lesson_id`, `name`, `total_exams`, `chapter_no`, `page_no`, `description`, `created_at`) VALUES
(9, 6, 'বাংলা সাহিত্যের যুগবিভাগ ', 3, '1', NULL, '', '2025-05-23 00:30:33'),
(10, 6, 'চর্যাপদ ', 7, '2', NULL, '', '2025-05-23 00:31:23'),
(11, 10, 'বিখ্যাত পত্রিকা ও সম্পাদক ', 9, '1', NULL, '', '2025-05-23 00:47:16'),
(12, 9, 'রবীন্দ্রনাথ ঠাকুর ', 11, '1', NULL, '', '2025-05-23 05:38:37');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `answers`
--
ALTER TABLE `answers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `attempt_id` (`attempt_id`),
  ADD KEY `question_id` (`question_id`);

--
-- Indexes for table `attempts`
--
ALTER TABLE `attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `exam_id` (`exam_id`);

--
-- Indexes for table `exams`
--
ALTER TABLE `exams`
  ADD PRIMARY KEY (`id`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `lesson_id` (`lesson_id`),
  ADD KEY `topic_id` (`topic_id`);

--
-- Indexes for table `exam_questions`
--
ALTER TABLE `exam_questions`
  ADD PRIMARY KEY (`exam_id`,`question_id`),
  ADD KEY `fk_exam_questions_question_id` (`question_id`);

--
-- Indexes for table `lessons`
--
ALTER TABLE `lessons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `subject_id` (`subject_id`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `exam_id` (`exam_id`),
  ADD KEY `fk_question_lesson` (`lesson_id`),
  ADD KEY `fk_question_topic` (`topic_id`),
  ADD KEY `fk_question_subject` (`subject_id`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `subject_code` (`subject_code`);

--
-- Indexes for table `topics`
--
ALTER TABLE `topics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lesson_id` (`lesson_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `answers`
--
ALTER TABLE `answers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=86;

--
-- AUTO_INCREMENT for table `attempts`
--
ALTER TABLE `attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `exams`
--
ALTER TABLE `exams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `lessons`
--
ALTER TABLE `lessons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=614;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `topics`
--
ALTER TABLE `topics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `answers`
--
ALTER TABLE `answers`
  ADD CONSTRAINT `answers_ibfk_1` FOREIGN KEY (`attempt_id`) REFERENCES `attempts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `answers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `attempts`
--
ALTER TABLE `attempts`
  ADD CONSTRAINT `attempts_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `exams`
--
ALTER TABLE `exams`
  ADD CONSTRAINT `exams_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `exams_ibfk_2` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `exams_ibfk_3` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `exam_questions`
--
ALTER TABLE `exam_questions`
  ADD CONSTRAINT `fk_exam_questions_exam_id` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_exam_questions_question_id` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `lessons`
--
ALTER TABLE `lessons`
  ADD CONSTRAINT `lessons_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `questions`
--
ALTER TABLE `questions`
  ADD CONSTRAINT `fk_question_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_question_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_question_topic` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `topics`
--
ALTER TABLE `topics`
  ADD CONSTRAINT `topics_ibfk_1` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
