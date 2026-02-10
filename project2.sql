
-- Project 2 SQL Export (schema + seed data)
-- Database: animal_adoption

DROP DATABASE IF EXISTS animal_adoption;
CREATE DATABASE animal_adoption;
USE animal_adoption;

/* =====================
   USERS (minimal)
===================== */
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username) VALUES ('demo');

/* =====================
   ANIMALS + IMAGES
===================== */
CREATE TABLE animals (
  animal_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  species VARCHAR(50) NOT NULL,
  breed VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(10) NOT NULL,
  temperament VARCHAR(255) NOT NULL,
  ideal_home VARCHAR(255) NOT NULL,
  lifestyle_needs VARCHAR(255) NOT NULL,
  vaccination_status VARCHAR(50) NOT NULL,
  health_issues VARCHAR(255) DEFAULT '',
  adoption_status VARCHAR(20) NOT NULL DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE animal_images (
  image_id INT AUTO_INCREMENT PRIMARY KEY,
  animal_id INT NOT NULL,
  image_type VARCHAR(20) NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_animal_image_type (animal_id, image_type),
  CONSTRAINT fk_animal_images_animal
    FOREIGN KEY (animal_id) REFERENCES animals(animal_id)
    ON DELETE CASCADE
);

INSERT INTO animals
(name, species, breed, date_of_birth, gender, temperament, ideal_home, lifestyle_needs, vaccination_status, health_issues, adoption_status)
VALUES
('Mochi','Cat','Domestic Shorthair','2023-04-12','Female','Playful','Quiet home','Indoor play and scratching post','Up to date','', 'Available'),
('Buddy','Dog','Golden Retriever','2022-01-20','Male','Friendly','Active home','Daily walks and training','Up to date','', 'Available');

INSERT INTO animal_images (animal_id, image_type, image_path) VALUES
(1,'front','93e2ae1c234e90c183e4790e489546af.png'),
(2,'front','four-dogs-and-a-parrot-on-a-wooden-table-photo.jpeg');

/* =====================
   LEARNING: COURSES / LESSONS / STEPS
===================== */
CREATE TABLE courses (
  course_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  course_image VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lessons (
  lesson_id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  summary TEXT,
  lesson_order INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lessons_course
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
    ON DELETE CASCADE
);

CREATE TABLE lesson_steps (
  step_id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT NOT NULL,
  step_order INT NOT NULL,
  step_text TEXT NOT NULL,
  step_type VARCHAR(30) DEFAULT 'text',
  media_link VARCHAR(255) DEFAULT NULL,
  question VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_steps_lesson
    FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id)
    ON DELETE CASCADE
);

/* =====================
   QUIZZES
===================== */
CREATE TABLE quizzes (
  quiz_id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT DEFAULT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  quiz_image VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_quizzes_course
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
    ON DELETE SET NULL
);

CREATE TABLE quiz_questions (
  question_id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  question_text TEXT NOT NULL,
  question_image VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_questions_quiz
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
    ON DELETE CASCADE
);

CREATE TABLE quiz_options (
  option_id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  option_text VARCHAR(255) NOT NULL,
  is_correct TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_options_question
    FOREIGN KEY (question_id) REFERENCES quiz_questions(question_id)
    ON DELETE CASCADE
);

CREATE TABLE quiz_attempts (
  attempt_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  quiz_id INT NOT NULL,
  score INT NOT NULL,
  passed TINYINT(1) NOT NULL,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attempts_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_attempts_quiz
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
    ON DELETE CASCADE
);

/* =====================
   BADGES
===================== */
CREATE TABLE badges (
  badge_id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  badge_image VARCHAR(255) NOT NULL,
  min_score INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_badges_quiz
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id)
    ON DELETE CASCADE
);

CREATE TABLE user_badges (
  user_id INT NOT NULL,
  badge_id INT NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, badge_id),
  CONSTRAINT fk_user_badges_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_badges_badge
    FOREIGN KEY (badge_id) REFERENCES badges(badge_id)
    ON DELETE CASCADE
);

/* =====================
   LESSON PROGRESS
===================== */
CREATE TABLE lesson_progress (
  progress_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  lesson_id INT NOT NULL,
  step_id INT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_progress (user_id, lesson_id, step_id),
  CONSTRAINT fk_progress_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_progress_lesson
    FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_progress_step
    FOREIGN KEY (step_id) REFERENCES lesson_steps(step_id)
    ON DELETE CASCADE
);

/* =====================
   SEED: COURSES, LESSONS, STEPS
===================== */
INSERT INTO courses (title, description, course_image) VALUES
('Adoption Readiness','Learn what it takes to responsibly adopt and care for a pet.','pngtree-business-people-looking-at-laptop-isolated-on-transparent-background-png-image_17358898.png'),
('Basic Pet Health','Understand vaccination, hygiene, and common health needs.','gratisography-326H-free-stock-photo-1170x780.jpg');

-- Course 1 lessons
INSERT INTO lessons (course_id, title, summary, lesson_order) VALUES
(1,'Understanding Commitment','Adopting a pet is a long-term responsibility.','1'),
(1,'Home & Lifestyle Fit','Match your schedule and home to your pet.','2');

-- Course 2 lessons
INSERT INTO lessons (course_id, title, summary, lesson_order) VALUES
(2,'Vaccination Basics','Why vaccines matter and what to expect.','1'),
(2,'Nutrition & Routine Care','Food, grooming, and daily checks.','2');

-- Steps for lessons
INSERT INTO lesson_steps (lesson_id, step_order, step_text) VALUES
(1,1,'Adopting a pet is a long-term commitment that can last over a decade.'),
(1,2,'Pets require daily care, attention, and time for bonding.'),
(1,3,'Budget for food, vet visits, grooming, and emergency care.'),

(2,1,'Consider your housing rules, space, and noise tolerance.'),
(2,2,'Dogs typically need daily walks; cats need enrichment and safe spaces.'),
(2,3,'Plan who will care for the pet when you are busy or away.'),

(3,1,'Vaccinations reduce the risk of serious infectious diseases.'),
(3,2,'Follow a vet-recommended schedule for core vaccines.'),
(3,3,'Keep records and update boosters as needed.'),

(4,1,'Choose appropriate food for the pet’s age and health needs.'),
(4,2,'Regular grooming helps prevent skin issues and parasites.'),
(4,3,'Watch for appetite, energy, and behavior changes and consult a vet early.');

/* =====================
   SEED: QUIZZES + QUESTIONS + OPTIONS
===================== */
-- One quiz per course
INSERT INTO quizzes (course_id, title, description, quiz_image) VALUES
(1,'Adoption Readiness Quiz','Check your understanding of responsible adoption.','bobq.png'),
(2,'Pet Health Quiz','Test your knowledge of basic pet health and vaccination.','0ih.png');

-- Standalone quick quiz (id will become 3)
INSERT INTO quizzes (course_id, title, description, quiz_image) VALUES
(NULL,'Quick Pet Care Quiz','A short quiz covering basic pet care concepts.','jshbhjas.png');

-- Questions for Quiz 1 (quiz_id=1)
INSERT INTO quiz_questions (quiz_id, question_text) VALUES
(1,'Which is a key part of responsible adoption?'),
(1,'What should you consider before adopting a dog?');

-- Options for question 1 (question_id=1)
INSERT INTO quiz_options (question_id, option_text, is_correct) VALUES
(1,'A long-term time and financial commitment',1),
(1,'Only buying toys',0),
(1,'Ignoring vet visits',0);

-- Options for question 2 (question_id=2)
INSERT INTO quiz_options (question_id, option_text, is_correct) VALUES
(2,'Daily walks and training time',1),
(2,'Never needing attention',0),
(2,'No need for space',0);

-- Questions for Quiz 2 (quiz_id=2)
INSERT INTO quiz_questions (quiz_id, question_text) VALUES
(2,'Why are vaccines important?'),
(2,'What is a good daily care habit?');

-- Options (question_id=3)
INSERT INTO quiz_options (question_id, option_text, is_correct) VALUES
(3,'They help prevent infectious diseases',1),
(3,'They guarantee no illness ever',0),
(3,'They replace vet checkups',0);

-- Options (question_id=4)
INSERT INTO quiz_options (question_id, option_text, is_correct) VALUES
(4,'Monitor appetite and energy changes',1),
(4,'Skip hygiene routines',0),
(4,'Feed random leftovers daily',0);

-- Questions for Quiz 3 (quiz_id=3)
INSERT INTO quiz_questions (quiz_id, question_text) VALUES
(3,'Which of these is a safe enrichment for indoor cats?');

-- Options (question_id=5)
INSERT INTO quiz_options (question_id, option_text, is_correct) VALUES
(5,'Scratching post and interactive play',1),
(5,'Leaving harmful chemicals accessible',0),
(5,'No stimulation at all',0);

/* =====================
   SEED: BADGES (tiered)
===================== */
INSERT INTO badges (quiz_id, badge_name, badge_image, min_score) VALUES
(1,'Bronze Adopter','7b3bd96d1a589fb8f07f59e4dd783dca.png',50),
(1,'Silver Adopter','7b3bd96d1a589fb8f07f59e4dd783dca.png',80),
(1,'Gold Adopter','7b3bd96d1a589fb8f07f59e4dd783dca.png',100),
(2,'Bronze Healer','93e2ae1c234e90c183e4790e489546af.png',50),
(2,'Silver Healer','93e2ae1c234e90c183e4790e489546af.png',80),
(2,'Gold Healer','93e2ae1c234e90c183e4790e489546af.png',100),
(3,'Quick Learner','0ih.png',50),
(3,'Quick Master','0ih.png',100);

