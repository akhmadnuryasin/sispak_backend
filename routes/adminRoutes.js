const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
    waitForConnections: true,
    insecureAuth: true
});

const saltRounds = 10;

// Fungsi untuk mengatur reconnect ke basis data
function handleDisconnect() {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to database:', err);
            setTimeout(handleDisconnect, 2000); // Coba reconnect setelah 2 detik
        } else {
            console.log('Connected to database!');
            connection.release();
        }
    });

    pool.on('error', (err) => {
        console.error('Database error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect(); // Reconnect jika koneksi terputus
        } else {
            throw err;
        }
    });
}

handleDisconnect();

router.get("/", (req, res) => {
    res.send("Sistem Pakar Backend App | Client");
});

router.post("/register", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            console.log(err);
            res.status(500).send({ error: "Internal Server Error" });
            return;
        }

        const data = {
            email: email,
            password: hash,
        };

        let sql = "SELECT * FROM users WHERE email = ?";
        pool.query(sql, [email], (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send({ error: "Internal Server Error" });
                return;
            }

            if (result.length > 0) {
                res.status(400).send({ error: "User Email Already Present" });
                return;
            }

            sql = "INSERT INTO users SET ?";
            pool.query(sql, data, (err, result) => {
                if (err) {
                    console.log(err);
                    res.status(500).send({ error: "Internal Server Error" });
                    return;
                }

                res.status(200).send(result);
            });
        });
    });
});

router.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    let sql = "SELECT * FROM users WHERE email = ?";
    pool.query(sql, [email], (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send({ error: "Internal Server Error" });
            return;
        }

        if (result.length === 0) {
            res.status(401).send({ error: "User Email Not Exists" });
            return;
        }

        bcrypt.compare(password, result[0].password, (err, response) => {
            if (err) {
                console.log(err);
                res.status(500).send({ error: "Internal Server Error" });
                return;
            }

            if (response) {
                req.session.user = result;
                res.status(200).send({ login: true, useremail: email });
            } else {
                res.status(401).send({ login: false, msg: "Wrong Password" });
            }
        });
    });
});

router.get("/login", (req, res) => {
    if (req.session.user) {
        res.status(200).send({ login: true, user: req.session.user });
    } else {
        res.status(200).send({ login: false });
    }
});

router.get("/logout", (req, res) => {
    if (req.session.user) {
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
                res.status(500).send({ logout: false, error: "Internal Server Error" });
            } else {
                res.clearCookie("userId");
                res.status(200).send({ logout: true });
            }
        });
    } else {
        res.status(200).send({ logout: false, msg: "User is not logged in" });
    }
});

// rute mengambil data gejala 
router.get('/symptom', async (req, res) => {
    const sql = `SELECT * FROM gejala`;
    pool.query(sql, (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (results.length === 0) {
            res.status(404).json({ message: 'No symptoms found' });
            return;
        }

        res.status(200).json(results);
    });
});

// rute mengambil data kerusakan 
router.get('/damage', async (req, res) => {
    const sql = `SELECT * FROM kerusakan`;
    pool.query(sql, (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (results.length === 0) {
            res.status(404).json({ message: 'No symptoms found' });
            return;
        }

        res.status(200).json(results);
    });
});

// rute mengambil data probabilitas 
router.get('/probability', async (req, res) => {
    const sql = `SELECT * FROM probabilitas`;
    pool.query(sql, (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (results.length === 0) {
            res.status(404).json({ message: 'No symptoms found' });
            return;
        }

        res.status(200).json(results);
    });
});


// rute mengambil data bobot gejala 
router.get('/symptomseverity', async (req, res) => {
    const sql = `SELECT * FROM basis_pengetahuan`;
    pool.query(sql, (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (results.length === 0) {
            res.status(404).json({ message: 'No symptoms found' });
            return;
        }

        res.status(200).json(results);
    });
});


// rute mengambil data rule 
router.get('/rule', async (req, res) => {
    const sql = `SELECT * FROM rule_aturan`;
    pool.query(sql, (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (results.length === 0) {
            res.status(404).json({ message: 'No symptoms found' });
            return;
        }

        res.status(200).json(results);
    });
});

// Rute diagnosa
router.get('/diagnose', async (req, res) => {
    const sql = `SELECT * FROM gejala`;
    pool.query(sql, (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (results.length === 0) {
            res.status(404).json({ message: 'No symptoms found' });
            return;
        }

        res.status(200).json(results);
    });
});

router.post('/diagnose', (req, res) => {
    const { symptoms } = req.body;

    const query1 = `
    SELECT k.kode_kerusakan, k.kerusakan, p.probabilitas
    FROM kerusakan k
    INNER JOIN probabilitas p ON k.kode_kerusakan = p.kode_kerusakan;
    `;

    const query2 = `
    SELECT * from basis_pengetahuan;
    `;

    const query3 = `
    SELECT * from rule_aturan;
    `;

    pool.query(query1, (err, result) => {
        if (err) {
            console.error('Error:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        let issues = [];

        result.forEach(row => {
            issues.push({
                code: row.kode_kerusakan,
                name: row.kerusakan,
                probability: row.probabilitas
            });
        });

        pool.query(query2, (err, result) => {
            if (err) {
                console.error('Error:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            let symptomsData = {};

            result.forEach(row => {
                const { kode_gejala, kode_kerusakan, bobot_gejala } = row;
                if (!symptomsData[kode_gejala]) {
                    symptomsData[kode_gejala] = {};
                }
                symptomsData[kode_gejala][kode_kerusakan] = bobot_gejala;
            });

            pool.query(query3, (err, result) => {
                if (err) {
                    console.error('Error:', err);
                    res.status(500).json({ error: 'Internal server error' });
                    return;
                }

                let rules = [];

                result.forEach(row => {
                    const conditions = row.rule_kondisi.split(',');
                    rules.push({
                        conditions: conditions,
                        result: row.hasil,
                    });
                });

                const uniqueIssues = [];
                const uniqueSymptoms = [...new Set(symptoms)];

                rules.forEach(rule => {
                    if (rule.conditions.every(condition => uniqueSymptoms.includes(condition))) {
                        uniqueIssues.push(rule.result);
                    }
                });

                uniqueSymptoms.forEach(symptom => {
                    if (symptomsData[symptom]) {
                        uniqueIssues.push(...Object.keys(symptomsData[symptom]));
                    }
                });

                const uniqueIssueCodes = Array.from(new Set(uniqueIssues));
                const response = [{ "Gejala": uniqueSymptoms }];

                const probabilities = {};
                issues.forEach(issue => {
                    probabilities[issue.code] = issue.probability;
                });
                response.push({ "Probabilitas Hipotesis/Kerusakan": probabilities });

                uniqueIssueCodes.forEach(issueCode => {
                    const issue = issues.find(issue => issue.code === issueCode);
                    const issueInfo = {
                        code: issue.code,
                        name: issue.name,
                        probability: issue.probability
                    };

                    const bayesValues = {};
                    let totalBayes = 0;

                    uniqueSymptoms.forEach(symptom => {
                        const weight = symptomsData[symptom]?.[issueCode] || 0;
                        const kIssue = issue.probability;
                        const kSymptom = weight;
                        const numerator = kSymptom * kIssue;
                        let denominator = 0;
                        issues.forEach(issue => {
                            const kSymptom_i = symptomsData[symptom]?.[issue.code] || 0;
                            denominator += kSymptom_i * issue.probability;
                        });
                        const bayes = numerator / denominator;
                        bayesValues[symptom] = parseFloat(bayes.toFixed(2));
                        totalBayes += bayes;
                    });

                    issueInfo["Nilai Bayes"] = bayesValues;
                    issueInfo["Total Nilai Bayes"] = parseFloat(totalBayes.toFixed(2));

                    response.push(issueInfo);
                });

                const totalBayesAllIssues = response.slice(2).reduce((total, issue) => total + issue["Total Nilai Bayes"], 0);
                const percentages = {};
                const presentaseNilaiPrediksi = {};

                response.slice(2).forEach(issueInfo => {
                    const percentage = (issueInfo["Total Nilai Bayes"] / totalBayesAllIssues) * 100;
                    percentages[issueInfo.code] = parseFloat(percentage.toFixed(2)) + "%";

                    const selectedObject = response.slice(2).find(obj => obj.code === issueInfo.code);
                    presentaseNilaiPrediksi[issueInfo.code] = {
                        kode: issueInfo.code,
                        persentasi: percentages[issueInfo.code],
                        nama_kerusakan: selectedObject ? selectedObject.name : ""
                    };
                });

                response.push({ "Presentase Nilai Prediksi Kerusakan": presentaseNilaiPrediksi });

                const largestIssue = response.slice(2).reduce((max, issue) => issue["Total Nilai Bayes"] > max["Total Nilai Bayes"] ? issue : max);
                const largestIssueName = largestIssue.name;
                const largestIssueCode = largestIssue.code;
                const largestIssueTotalNilaiBayes = largestIssue["Total Nilai Bayes"];
                const largestIssuePercentage = percentages[largestIssueCode];

                const dynamicResponse = `Berdasarkan proses penerapan Metode Naive Bayes yang telah dilakukan, berdasarkan gejala-gejala yang dialami maka kemungkinan sepeda motor matic ini terdiagnosa ${largestIssueName} (${largestIssueCode}) dengan persentase ${largestIssuePercentage}`;

                response.push({ "Hasil": dynamicResponse });

                res.status(200).json(response);
            });
        });
    });
});

module.exports = router;