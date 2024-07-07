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


// Rute diagnosa
router.post('/diagnose', (req, res) => {
    const { symptoms } = req.body;

    // Menghapus duplikat gejala dan hanya menyimpan gejala unik
    const uniqueSymptoms = [...new Set(symptoms)];

    // Query untuk mengambil semua aturan dari tabel rule_aturan
    const ruleQuery = `SELECT * FROM rule_aturan`;

    pool.query(ruleQuery, (err, ruleResults) => {
        if (err) {
            console.error('Error querying rule_aturan:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        // Mengubah hasil query menjadi array of objects yang masing-masing
        // memiliki conditions (kondisi) dan result (hasil)
        const rules = ruleResults.map(row => ({
            conditions: row.rule_kondisi.split(','), // Memisahkan kondisi berdasarkan koma
            result: row.hasil,
        }));

        // Query untuk mengambil nilai_gejala dari basis_pengetahuan berdasarkan kode_gejala
        const basisPengetahuanQuery = `
            SELECT kode_gejala, nilai_gejala
            FROM basis_pengetahuan
            WHERE kode_gejala IN (?)
        `;

        pool.query(basisPengetahuanQuery, [uniqueSymptoms], (err, bpResults) => {
            if (err) {
                console.error('Error querying basis_pengetahuan:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            // Membuat object untuk memetakan kode_gejala ke nilai_gejala
            const gejalaMap = {};
            bpResults.forEach(row => {
                gejalaMap[row.kode_gejala] = row.nilai_gejala;
            });

            // Query untuk mengambil probabilitas dari tabel probabilitas beserta nama kerusakan dari tabel kerusakan
            const probabilitasQuery = `
                SELECT p.kode_kerusakan, k.kerusakan, p.probabilitas
                FROM probabilitas p
                LEFT JOIN kerusakan k ON p.kode_kerusakan = k.kode_kerusakan
            `;

            pool.query(probabilitasQuery, (err, probResults) => {
                if (err) {
                    console.error('Error querying probabilitas:', err);
                    res.status(500).json({ error: 'Internal server error' });
                    return;
                }

                // Membuat object untuk memetakan kode_kerusakan ke objek {nama_kerusakan, probabilitas}
                const probMap = {};
                probResults.forEach(row => {
                    probMap[row.kode_kerusakan] = {
                        kerusakan: row.kerusakan,
                        probabilitas: row.probabilitas
                    };
                });

                // Membuat array gejala_user dengan format yang diinginkan
                const gejalaUser = uniqueSymptoms.map(symptom => `${symptom}: ${gejalaMap[symptom] || 'not found'}`);

                let nilaiRuleKerusakan = {};
                let gejalaRulesYangTerjadi = [];
                let hitunganMasingMasingPenyakit = [];
                let hitunganMasingMasingKerusakan = [];
                let totalProbabilitas = 0;

                // Memeriksa setiap aturan untuk mencocokkan gejala yang diterima
                rules.forEach(rule => {
                    rule.conditions.forEach(condition => {
                        const trimmedCondition = condition.trim();
                        if (uniqueSymptoms.includes(trimmedCondition)) {
                            gejalaRulesYangTerjadi.push(`${trimmedCondition} pada ${rule.result}`);
                            const hasilKali = (gejalaMap[trimmedCondition] || 0) * (probMap[rule.result].probabilitas || 0);
                            hitunganMasingMasingPenyakit.push(`${trimmedCondition}_${rule.result}: ${hasilKali.toFixed(2)}`);
                            totalProbabilitas += hasilKali;
                            if (!nilaiRuleKerusakan[rule.result]) {
                                nilaiRuleKerusakan[rule.result] = probMap[rule.result].kerusakan || 'not found';
                            }
                        }
                    });
                });

                // Konversi nilaiRuleKerusakan menjadi array untuk respons
                const nilaiRuleKerusakanArray = Object.keys(nilaiRuleKerusakan).map(kodeKerusakan => `${kodeKerusakan}: ${nilaiRuleKerusakan[kodeKerusakan]}`);

                // Membuat array hitungan_masing_masing_kerusakan dengan format yang diinginkan
                hitunganMasingMasingKerusakan = hitunganMasingMasingPenyakit.map(hitungan => {
                    const [key, value] = hitungan.split(': ');
                    const hasilBagi = parseFloat(value) / totalProbabilitas;
                    return `${key} : ${hasilBagi.toFixed(2)}`;
                });

                const hasil = Object.keys(nilaiRuleKerusakan).map(kodeKerusakan => {
                    const totalKerusakan = hitunganMasingMasingKerusakan
                        .filter(hitungan => hitungan.includes(kodeKerusakan))
                        .reduce((acc, hitungan) => acc + parseFloat(hitungan.split(': ')[1]), 0);
                    return {
                        nama: nilaiRuleKerusakan[kodeKerusakan],
                        persentase: Math.floor(totalKerusakan * 100)
                    };
                });

                // Menghitung selisih untuk memastikan total 100%
                const totalPersen = hasil.reduce((acc, curr) => acc + curr.persentase, 0);
                const selisih = 100 - totalPersen;

                if (selisih > 0) {
                    // Menambahkan selisih ke entri dengan persentase terbesar
                    hasil.sort((a, b) => b.persentase - a.persentase);
                    hasil[0].persentase += selisih;
                }

                const hasilFormatted = hasil.map(item => `${item.nama} : ${item.persentase}%`);

                res.status(200).json({
                    gejala_user: gejalaUser,
                    nilai_rule_kerusakan: nilaiRuleKerusakanArray,
                    gejala_rules_yang_terjadi: gejalaRulesYangTerjadi,
                    hitungan_masing_masing_penyakit: hitunganMasingMasingPenyakit,
                    nilai_total_probabilitas: totalProbabilitas.toFixed(2),
                    hitungan_masing_masing_kerusakan: hitunganMasingMasingKerusakan,
                    hasil: hasilFormatted,
                });
            });
        });
    });
});



module.exports = router;
