const express = require("express");
const db = require("./db-connection");

const app = express();
app.use(express.static("public"));
app.use(express.json());

function handleDb(res, err) {
    if (!err) return false;
    res.status(500).json({ error: err.message });
    return true;
}

/* =====================
   TEST ROUTES
===================== */
app.get("/", (req, res) => {
    res.send("Animal Adoption API running");
});

/* =====================
   ANIMALS
===================== */

// GET all animals (main listing)
app.get("/api/animals", (req, res) => {
    const sql = `
        SELECT 
            a.animal_id,
            a.name,
            a.species,
            a.breed,
            TIMESTAMPDIFF(MONTH, a.date_of_birth, CURDATE()) AS age_months,
            a.gender,
            a.adoption_status,
            a.vaccination_status,
            a.temperament,
            img.image_path AS image
        FROM animals a
        LEFT JOIN animal_images img 
            ON a.animal_id = img.animal_id
            AND img.image_type = 'front'
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// GET single animal profile
app.get("/api/animals/:id", (req, res) => {
    const sqlAnimal = `
        SELECT *,
        TIMESTAMPDIFF(MONTH, date_of_birth, CURDATE()) AS age_months
        FROM animals
        WHERE animal_id = ?
    `;

    const sqlImages = `
        SELECT image_type, image_path
        FROM animal_images
        WHERE animal_id = ?
    `;

    db.query(sqlAnimal, [req.params.id], (err, animal) => {
        if (err) return res.status(500).json({ error: err.message });
        if (animal.length === 0) return res.status(404).json({ message: "Animal not found" });

        db.query(sqlImages, [req.params.id], (err, images) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
                ...animal[0],
                images
            });
        });
    });
});

// ADD animal
app.post("/api/animals", (req, res) => {
    const sql = `
        INSERT INTO animals
        (name, species, breed, date_of_birth, gender, temperament,
         ideal_home, lifestyle_needs, vaccination_status, health_issues, adoption_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        req.body.name,
        req.body.species,
        req.body.breed,
        req.body.date_of_birth,
        req.body.gender,
        req.body.temperament,
        req.body.ideal_home,
        req.body.lifestyle_needs,
        req.body.vaccination_status,
        req.body.health_issues,
        req.body.adoption_status
    ];

    db.query(sql, params, (err, result) => {
        if (handleDb(res, err)) return;

        const animalId = result.insertId;
        const imagePath = (req.body.image_path || "").trim();

        if (!imagePath) {
            return res.json({ message: "Animal added", animal_id: animalId });
        }

        db.query(
            "INSERT INTO animal_images (animal_id, image_type, image_path) VALUES (?, 'front', ?)",
            [animalId, imagePath],
            (err) => {
                if (handleDb(res, err)) return;
                res.json({ message: "Animal added", animal_id: animalId });
            }
        );
    });
});

// UPDATE animal
app.put("/api/animals/:id", (req, res) => {
    const sql = `
        UPDATE animals
        SET name=?, species=?, breed=?, date_of_birth=?, gender=?,
            temperament=?, ideal_home=?, lifestyle_needs=?,
            vaccination_status=?, health_issues=?, adoption_status=?
        WHERE animal_id=?
    `;

    const params = [
        req.body.name,
        req.body.species,
        req.body.breed,
        req.body.date_of_birth,
        req.body.gender,
        req.body.temperament,
        req.body.ideal_home,
        req.body.lifestyle_needs,
        req.body.vaccination_status,
        req.body.health_issues,
        req.body.adoption_status,
        req.params.id
    ];

    db.query(sql, params, (err, result) => {
        if (handleDb(res, err)) return;
        if (!result || result.affectedRows === 0) {
            return res.status(404).json({ message: "Animal not found" });
        }

        const imagePath = (req.body.image_path || "").trim();
        if (!imagePath) {
            return res.json({ message: "Animal updated" });
        }

        const upsert = `
            INSERT INTO animal_images (animal_id, image_type, image_path)
            VALUES (?, 'front', ?)
            ON DUPLICATE KEY UPDATE image_path = VALUES(image_path)
        `;
        db.query(upsert, [req.params.id, imagePath], (err) => {
            if (handleDb(res, err)) return;
            res.json({ message: "Animal updated" });
        });
    });
});

// DELETE animal
app.delete("/api/animals/:id", (req, res) => {
    db.query("DELETE FROM animal_images WHERE animal_id = ?", [req.params.id], (err) => {
        if (handleDb(res, err)) return;

        db.query(
            "DELETE FROM animals WHERE animal_id = ?",
            [req.params.id],
            (err, result) => {
                if (handleDb(res, err)) return;
                if (!result || result.affectedRows === 0) {
                    return res.status(404).json({ message: "Animal not found" });
                }
                res.json({ message: "Animal deleted" });
            }
        );
    });
});

/* =====================
   COURSES
===================== */

app.get("/api/courses", (req, res) => {
    // Include derived lesson count so the frontend can show "X Lessons" without undefined.
    const sql = `
        SELECT c.*,
               (
                 SELECT COUNT(*)
                 FROM lessons l
                 WHERE l.course_id = c.course_id
               ) AS lessons_count
        FROM courses c
        ORDER BY c.course_id
    `;

    db.query(sql, (err, results) => {
        if (handleDb(res, err)) return;
        res.json(results);
    });
});

/* =====================
   LESSONS + STEPS
===================== */

// Lessons for a course
app.get("/api/courses/:courseId/lessons", (req, res) => {
    const sql = `
        SELECT lesson_id, title, summary, lesson_order
        FROM lessons
        WHERE course_id = ?
        ORDER BY lesson_order
    `;

    db.query(sql, [req.params.courseId], (err, results) => {
        if (handleDb(res, err)) return;
        res.json(results);
    });
});

// Steps for a lesson
app.get("/api/lessons/:lessonId/steps", (req, res) => {
    const sql = `
        SELECT step_id, step_order, step_text, step_type,
               media_link, question
        FROM lesson_steps
        WHERE lesson_id = ?
        ORDER BY step_order
    `;

    db.query(sql, [req.params.lessonId], (err, results) => {
        if (handleDb(res, err)) return;
        res.json(results);
    });
});

// Lesson meta (title, summary, course_id)
app.get("/api/lessons/:lessonId", (req, res) => {
    db.query(
        "SELECT lesson_id, course_id, title, summary, lesson_order FROM lessons WHERE lesson_id = ?",
        [req.params.lessonId],
        (err, results) => {
            if (handleDb(res, err)) return;
            if (!results || results.length === 0) return res.status(404).json({ message: "Lesson not found" });
            res.json(results[0]);
        }
    );
});

/* =====================
   LESSON PROGRESS
===================== */

// Mark a lesson step as completed (idempotent)
app.post("/api/lesson-progress", (req, res) => {
    const userId = req.body.user_id ?? 1;
    const lessonId = req.body.lesson_id;
    const stepId = req.body.step_id;

    if (!lessonId || !stepId) {
        return res.status(400).json({ message: "lesson_id and step_id are required" });
    }

    const sql = `
        INSERT INTO lesson_progress (user_id, lesson_id, step_id)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE completed_at = completed_at
    `;

    db.query(sql, [userId, lessonId, stepId], (err) => {
        if (handleDb(res, err)) return;
        res.json({ message: "Step completed" });
    });
});

/* =====================
   QUIZZES
===================== */

// Get a standalone "quick quiz" (course_id IS NULL). Used by learn.html.
app.get("/api/quizzes/standalone", (req, res) => {
    db.query(
        "SELECT * FROM quizzes WHERE course_id IS NULL ORDER BY quiz_id ASC LIMIT 1",
        (err, results) => {
            if (handleDb(res, err)) return;
            if (!results || results.length === 0) return res.status(404).json({ message: "Quiz not found" });
            res.json(results[0]);
        }
    );
});

// Get quiz by id (used by quiz.html + learn.html quick quiz)
app.get("/api/quizzes/:quizId", (req, res) => {
    db.query(
        "SELECT * FROM quizzes WHERE quiz_id = ?",
        [req.params.quizId],
        (err, results) => {
            if (handleDb(res, err)) return;
            if (!results || results.length === 0) return res.status(404).json({ message: "Quiz not found" });
            res.json(results[0]);
        }
    );
});

// Quiz for course
app.get("/api/courses/:courseId/quiz", (req, res) => {
    db.query(
        "SELECT * FROM quizzes WHERE course_id = ?",
        [req.params.courseId],
        (err, results) => {
            if (handleDb(res, err)) return;
            if (!results || results.length === 0) return res.status(404).json({ message: "Quiz not found" });
            res.json(results[0]);
        }
    );
});

// Quiz questions + options
app.get("/api/quizzes/:quizId/questions", (req, res) => {
    const sql = `
        SELECT 
            q.question_id,
            q.question_text,
            q.question_image,
            o.option_id,
            o.option_text
        FROM quiz_questions q
        JOIN quiz_options o ON q.question_id = o.question_id
        WHERE q.quiz_id = ?
    `;

    db.query(sql, [req.params.quizId], (err, results) => {
        if (handleDb(res, err)) return;

        const map = new Map();
        for (const row of results) {
            if (!map.has(row.question_id)) {
                map.set(row.question_id, {
                    question_id: row.question_id,
                    question_text: row.question_text,
                    question_image: row.question_image,
                    options: []
                });
            }
            map.get(row.question_id).options.push({
                option_id: row.option_id,
                option_text: row.option_text
            });
        }
        res.json([...map.values()]);
    });
});

// Attempt quiz: score answers + store attempt + award tiered badges
app.post("/api/quizzes/:quizId/attempt", (req, res) => {
    const quizId = Number(req.params.quizId);
    const userId = req.body.user_id ?? 1;
    const answers = req.body.answers || {};

    const sql = `
        SELECT q.question_id, o.option_id, o.is_correct
        FROM quiz_questions q
        JOIN quiz_options o ON q.question_id = o.question_id
        WHERE q.quiz_id = ?
    `;

    db.query(sql, [quizId], (err, rows) => {
        if (handleDb(res, err)) return;

        const correctByQuestion = new Map();
        for (const r of rows) {
            if (r.is_correct) correctByQuestion.set(String(r.question_id), String(r.option_id));
        }

        const total = correctByQuestion.size;
        if (total === 0) return res.status(400).json({ message: "Quiz has no answer key" });

        let correct = 0;
        for (const [qid, correctOpt] of correctByQuestion.entries()) {
            if (String(answers[qid]) === correctOpt) correct++;
        }

        const score = Math.round((correct / total) * 100);
        const passed = score >= 50;

        const insertAttempt = `
            INSERT INTO quiz_attempts (user_id, quiz_id, score, passed)
            VALUES (?, ?, ?, ?)
        `;

        db.query(insertAttempt, [userId, quizId, score, passed], (err) => {
            if (handleDb(res, err)) return;

            const badgeSql = `
                INSERT IGNORE INTO user_badges (user_id, badge_id)
                SELECT ?, badge_id
                FROM badges
                WHERE quiz_id = ?
                AND min_score <= ?
            `;

            db.query(badgeSql, [userId, quizId, score], (err) => {
                if (handleDb(res, err)) return;
                res.json({ score, passed });
            });
        });
    });
});

/* =====================
   PROGRESS DASHBOARD
===================== */

app.get("/api/progress/lessons/:userId", (req, res) => {
    const sql = `
        SELECT lp.lesson_id, lp.step_id, lp.completed_at, l.title AS lesson_title
        FROM lesson_progress lp
        JOIN lessons l ON lp.lesson_id = l.lesson_id
        WHERE lp.user_id = ?
        ORDER BY lp.completed_at DESC
    `;
    db.query(sql, [req.params.userId], (err, results) => {
        if (handleDb(res, err)) return;
        res.json(results);
    });
});

app.get("/api/progress/quizzes/:userId", (req, res) => {
    const sql = `
        SELECT qa.quiz_id, qa.score, qa.passed, qa.attempted_at, q.title AS quiz_title
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.quiz_id
        WHERE qa.user_id = ?
        ORDER BY qa.attempted_at DESC
    `;
    db.query(sql, [req.params.userId], (err, results) => {
        if (handleDb(res, err)) return;
        res.json(results);
    });
});

app.get("/api/progress/badges/:userId", (req, res) => {
    const sql = `
        SELECT b.badge_id, b.badge_name, b.badge_image, ub.earned_at
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.badge_id
        WHERE ub.user_id = ?
        ORDER BY ub.earned_at DESC
    `;
    db.query(sql, [req.params.userId], (err, results) => {
        if (handleDb(res, err)) return;
        res.json(results);
    });
});

/* =====================
   QUIZ SUBMISSION + BADGES (TIERED)
===================== */

app.post("/api/quizzes/:quizId/submit", (req, res) => {
    const { user_id, score } = req.body;

    const insertAttempt = `
        INSERT INTO quiz_attempts (user_id, quiz_id, score, passed)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        insertAttempt,
        [user_id, req.params.quizId, score, score >= 50],
        err => {
            if (err) return res.status(500).json({ error: err.message });

            const badgeSql = `
                INSERT IGNORE INTO user_badges (user_id, badge_id)
                SELECT ?, badge_id
                FROM badges
                WHERE quiz_id = ?
                AND min_score <= ?
            `;

            db.query(
                badgeSql,
                [user_id, req.params.quizId, score],
                err => {
                    if (err) return res.status(500).json({ error: err.message });

                    res.json({
                        message: "Quiz submitted",
                        score,
                        badges_awarded: true
                    });
                }
            );
        }
    );
});

/* =====================
   START SERVER
===================== */

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
