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
            setTimeout(handleDisconnect, 2000); 
        } else {
            console.log('Connected to database!');
            connection.release();
        }
    });

    pool.on('error', (err) => {
        console.error('Database error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect(); 
        } else {
            throw err;
        }
    });
}

handleDisconnect();

router.get("/", (req, res) => {
    res.send("Sistem Pakar Backend App | Admin");
});


// Route untuk login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to database: ' + err.stack);
        return res.status(500).send('Error connecting to database');
      }
  
      
      const getUserQuery = 'SELECT * FROM users WHERE username = ?';
      connection.query(getUserQuery, [username], (error, results, fields) => {
        connection.release(); 
  
        if (error) {
          console.error('Error retrieving user: ' + error.stack);
          return res.status(500).send('Error retrieving user');
        }
  
        // Periksa apakah pengguna ditemukan
        if (results.length === 0) {
          return res.status(404).send('User not found');
        }
  
        const user = results[0];
  
        // Verifikasi password
        bcrypt.compare(password, user.password, (bcryptErr, bcryptRes) => {
          if (bcryptErr) {
            console.error('Error comparing passwords: ' + bcryptErr.stack);
            return res.status(500).send('Error comparing passwords');
          }
  
          if (!bcryptRes) {
            return res.status(401).send('Invalid password');
          }
  
          // Berhasil login
          req.session.user = {
            id: user.id,
            username: user.username
            // Tambahkan data lain dari user jika diperlukan
          };
  
          res.status(200).send('Login successful');
        });
      });
    });
  });
  

  // Route untuk logout
router.post('/logout', (req, res) => {
    // Hapus data sesi pengguna
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session: ' + err.stack);
        return res.status(500).send('Error destroying session');
      }
  
      // Berhasil logout
      res.status(200).send('Logout successful');
    });
  });
  
  module.exports = router;
  

router.post('/users', (req, res) => {
    const { username, password } = req.body;

    // Buat koneksi dari pool
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to database: ' + err.stack);
            return res.status(500).send('Error connecting to database');
        }

        // Hash password menggunakan bcrypt
        bcrypt.hash(password, 10, (bcryptErr, hashedPassword) => {
            if (bcryptErr) {
                console.error('Error hashing password: ' + bcryptErr.stack);
                return res.status(500).send('Error hashing password');
            }

            // Query untuk menambah pengguna dengan password yang sudah di-hash
            const addUserQuery = 'INSERT INTO users (username, password) VALUES (?, ?)';
            connection.query(addUserQuery, [username, hashedPassword], (error, results, fields) => {
                connection.release(); 

                if (error) {
                    console.error('Error inserting user: ' + error.stack);
                    return res.status(500).send('Error inserting user');
                }

                // Berhasil menambah pengguna
                res.status(200).send('User added successfully');
            });
        });
    });
}); 
  // Route untuk mengambil semua pengguna
router.get('/users', (req, res) => {
    // Buat koneksi dari pool
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to database: ' + err.stack);
        return res.status(500).send('Error connecting to database');
      }
  
      // Query untuk mengambil semua pengguna
      const getUsersQuery = 'SELECT * FROM users';
      connection.query(getUsersQuery, (error, results, fields) => {
        connection.release(); // Lepaskan koneksi
  
        if (error) {
          console.error('Error retrieving users: ' + error.stack);
          return res.status(500).send('Error retrieving users');
        }
  
        // Kirim data pengguna yang berhasil diambil
        res.status(200).json(results);
      });
    });
  });
  
  // Route untuk mengambil satu pengguna berdasarkan ID
  router.get('/users/:id', (req, res) => {
    const userId = req.params.id;
  
    // Buat koneksi dari pool
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to database: ' + err.stack);
        return res.status(500).send('Error connecting to database');
      }
  
      // Query untuk mengambil satu pengguna berdasarkan ID
      const getUserQuery = 'SELECT * FROM users WHERE id = ?';
      connection.query(getUserQuery, [userId], (error, results, fields) => {
        connection.release(); // Lepaskan koneksi
  
        if (error) {
          console.error('Error retrieving user: ' + error.stack);
          return res.status(500).send('Error retrieving user');
        }
  
        // Periksa apakah pengguna ditemukan
        if (results.length === 0) {
          return res.status(404).send('User not found');
        }
  
        // Kirim data pengguna yang berhasil diambil
        res.status(200).json(results[0]);
      });
    });
  });
  
  // Route untuk mengubah pengguna berdasarkan ID
router.put('/users/:id', (req, res) => {
    const userId = req.params.id;
    const { username, password } = req.body;
  
    // Buat koneksi dari pool
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to database: ' + err.stack);
        return res.status(500).send('Error connecting to database');
      }
  
      // Query untuk mengubah pengguna
      const updateUserQuery = 'UPDATE users SET username = ?, password = ? WHERE id = ?';
      connection.query(updateUserQuery, [username, password, userId], (error, results, fields) => {
        connection.release(); // Lepaskan koneksi
  
        if (error) {
          console.error('Error updating user: ' + error.stack);
          return res.status(500).send('Error updating user');
        }
  
        // Periksa apakah pengguna berhasil diubah
        if (results.affectedRows === 0) {
          return res.status(404).send('User not found');
        }
  
        // Berhasil mengubah pengguna
        res.status(200).send('User updated successfully');
      });
    });
  });
  
  // Route untuk menghapus pengguna berdasarkan ID
router.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
  
    // Buat koneksi dari pool
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to database: ' + err.stack);
        return res.status(500).send('Error connecting to database');
      }
  
      // Query untuk menghapus pengguna
      const deleteUserQuery = 'DELETE FROM users WHERE id = ?';
      connection.query(deleteUserQuery, [userId], (error, results, fields) => {
        connection.release(); // Lepaskan koneksi
  
        if (error) {
          console.error('Error deleting user: ' + error.stack);
          return res.status(500).send('Error deleting user');
        }
  
        // Periksa apakah pengguna berhasil dihapus
        if (results.affectedRows === 0) {
          return res.status(404).send('User not found');
        }
  
        // Berhasil menghapus pengguna
        res.status(200).send('User deleted successfully');
      });
    });
  });

  

// rute dashboard
router.get('/dashboard', (req, res) => {
    const queries = [
        { table: 'gejala', name: 'Gejala', icon: 'IconVirusSearch', sql: 'SELECT COUNT(*) AS count FROM gejala' },
        { table: 'kerusakan', name: 'Kerusakan', icon: 'IconCarCrash', sql: 'SELECT COUNT(*) AS count FROM kerusakan' },
        { table: 'probabilitas', name: 'Probabilitas', icon: 'IconAbacus', sql: 'SELECT COUNT(*) AS count FROM probabilitas' },
        { table: 'basis_pengetahuan', name: 'Bobot Gejala', icon: 'IconScale', sql: 'SELECT COUNT(*) AS count FROM basis_pengetahuan' },
        { table: 'rule_aturan', name: 'Rule', icon: 'IconRulerMeasure', sql: 'SELECT COUNT(*) AS count FROM rule_aturan' },
        { table: 'users', name: 'Pengguna', icon: 'IconUsersGroup', sql: 'SELECT COUNT(*) AS count FROM users' }
    ];

    const dashboardData = {};

    // Execute queries sequentially
    executeQueriesSequentially(queries)
        .then(results => {
            // Format results into dashboardData object
            results.forEach((result, index) => {
                const query = queries[index];
                dashboardData[query.table] = {
                    name: query.name,
                    icon: query.icon,
                    count: result[0].count
                };
            });

            // Send response with dashboardData
            res.status(200).json(dashboardData);
        })
        .catch(error => {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});

// Function to execute queries sequentially
function executeQueriesSequentially(queries) {
    const promises = [];
    queries.forEach(query => {
        promises.push(new Promise((resolve, reject) => {
            pool.query(query.sql, (error, results) => {
                if (error) {
                    console.error(`Error retrieving ${query.name} count:`, error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        }));
    });
    return Promise.all(promises);
}


// Function to execute queries sequentially
function executeQueriesSequentially(queries) {
    const promises = [];
    queries.forEach(query => {
        promises.push(new Promise((resolve, reject) => {
            pool.query(query.sql, (error, results) => {
                if (error) {
                    console.error(`Error retrieving ${query.name} count:`, error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        }));
    });
    return Promise.all(promises);
}



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

// rute menambahkan gejala
router.post('/symptom', async (req, res) => {
    const { gejala } = req.body;

    // Ambil kode gejala terakhir
    const getLastCodeSql = 'SELECT kode_gejala FROM gejala ORDER BY kode_gejala DESC LIMIT 1';
    pool.query(getLastCodeSql, (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        let newKodeGejala;
        if (results.length === 0) {
            newKodeGejala = 'G01'; 
        } else {
            const lastKodeGejala = results[0].kode_gejala;
            const lastNumber = parseInt(lastKodeGejala.slice(1), 10); 
            const newNumber = lastNumber + 1;
            newKodeGejala = 'G' + newNumber.toString().padStart(2, '0');
        }

        const insertSql = 'INSERT INTO gejala (kode_gejala, gejala) VALUES (?, ?)';
        pool.query(insertSql, [newKodeGejala, gejala], (error, results) => {
            if (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }
            res.status(201).json({ message: 'Gejala berhasil ditambahkan', id: results.insertId });
        });
    });
});

// rute untuk mengedit data gejala
router.put('/symptom/:id', async (req, res) => {
    const { id } = req.params;
    const { gejala } = req.body;
    
    // Mengambil kode_gejala dari database untuk mempertahankan nilainya
    const getKodeGejalaSql = 'SELECT kode_gejala FROM gejala WHERE id = ?';
    pool.query(getKodeGejalaSql, [id], (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ message: 'Gejala tidak ditemukan' });
            return;
        }
        
        const { kode_gejala } = results[0];
        
        // Memperbarui gejala saja, kode_gejala tetap sama
        const updateSql = 'UPDATE gejala SET gejala = ? WHERE id = ?';
        pool.query(updateSql, [gejala, id], (error, results) => {
            if (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }
            
            res.status(200).json({ message: 'Gejala berhasil diubah' });
        });
    });
});


// rute untuk menghapus data gejala

router.delete('/symptom/:id', async (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM gejala WHERE id = ?';
    pool.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        if (results.affectedRows === 0) {
            res.status(404).json({ message: 'Gejala tidak ditemukan' });
            return;
        }
        res.status(200).json({ message: 'Gejala berhasil dihapus' });
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

// rute menambahkan kerusakan
router.post('/damage', async (req, res) => {
    const { kerusakan } = req.body;

    // Ambil kode gejala terakhir
    const getLastCodeSql = 'SELECT kode_kerusakan FROM kerusakan ORDER BY kode_kerusakan DESC LIMIT 1';
    pool.query(getLastCodeSql, (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        let newKodeKerusakan;
        if (results.length === 0) {
            newKodeKerusakan = 'K01'; 
        } else {
            const lastKodeKerusakan = results[0].kode_kerusakan;
            const lastNumber = parseInt(lastKodeKerusakan.slice(1), 10); 
            const newNumber = lastNumber + 1;
            newKodeKerusakan = 'K' + newNumber.toString().padStart(2, '0');
        }

        const insertSql = 'INSERT INTO kerusakan (kode_kerusakan, kerusakan) VALUES (?, ?)';
        pool.query(insertSql, [newKodeKerusakan, kerusakan], (error, results) => {
            if (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }
            res.status(201).json({ message: 'Kerusakan berhasil ditambahkan', id: results.insertId });
        });
    });
});


// rute untuk mengedit data kerusakan
router.put('/damage/:id', async (req, res) => {
    const { id } = req.params;
    const { kerusakan } = req.body;
    
    // Mengambil kode_gejala dari database untuk mempertahankan nilainya
    const getKodeKerusakanSql = 'SELECT kode_kerusakan FROM kerusakan WHERE id = ?';
    pool.query(getKodeKerusakanSql, [id], (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ message: 'Kerusakan tidak ditemukan' });
            return;
        }
        
        const { kode_kerusakan } = results[0];
        
        // Memperbarui gejala saja, kode_gejala tetap sama
        const updateSql = 'UPDATE kerusakan SET kerusakan = ? WHERE id = ?';
        pool.query(updateSql, [kerusakan, id], (error, results) => {
            if (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }
            
            res.status(200).json({ message: 'Kerusakan berhasil diubah' });
        });
    });
});


// rute untuk menghapus data gejala

router.delete('/damage/:id', async (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM kerusakan WHERE id = ?';
    pool.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        if (results.affectedRows === 0) {
            res.status(404).json({ message: 'Kerusakan tidak ditemukan' });
            return;
        }
        res.status(200).json({ message: 'Kerusakan berhasil dihapus' });
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


// rute untuk menambahkan data probabilitas
router.post('/probability', async (req, res) => {
    const { kode_kerusakan, probabilitas } = req.body;

    // Cek apakah kode_kerusakan ada di tabel kerusakan
    const checkSql = 'SELECT * FROM kerusakan WHERE kode_kerusakan = ?';
    pool.query(checkSql, [kode_kerusakan], (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (results.length === 0) {
            res.status(400).json({ message: 'Kode kerusakan tidak ditemukan di tabel kerusakan' });
            return;
        }

        // Cek apakah kode_kerusakan sudah ada di tabel probabilitas
        const checkExistenceSql = 'SELECT * FROM probabilitas WHERE kode_kerusakan = ?';
        pool.query(checkExistenceSql, [kode_kerusakan], (error, results) => {
            if (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            if (results.length > 0) {
                res.status(400).json({ message: 'Kode kerusakan sudah ada di tabel probabilitas' });
                return;
            }

            // Tambahkan data ke tabel probabilitas
            const insertSql = 'INSERT INTO probabilitas (kode_kerusakan, probabilitas) VALUES (?, ?)';
            pool.query(insertSql, [kode_kerusakan, probabilitas], (error, results) => {
                if (error) {
                    console.error('Error:', error);
                    res.status(500).json({ error: 'Internal server error' });
                    return;
                }
                res.status(201).json({ message: 'Data probabilitas berhasil ditambahkan' });
            });
        });
    });
});

// rute untuk mengedit data probabilitas
router.put('/probability/:id', async (req, res) => {
    const { id } = req.params;
    const { kode_kerusakan, probabilitas } = req.body;

    // Cek apakah kode_kerusakan ada di tabel kerusakan
    const checkSql = 'SELECT * FROM kerusakan WHERE kode_kerusakan = ?';
    pool.query(checkSql, [kode_kerusakan], (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (results.length === 0) {
            res.status(400).json({ message: 'Kode kerusakan tidak ditemukan di tabel kerusakan' });
            return;
        }

        // Update data di tabel probabilitas
        const updateSql = 'UPDATE probabilitas SET kode_kerusakan = ?, probabilitas = ? WHERE id = ?';
        pool.query(updateSql, [kode_kerusakan, probabilitas, id], (error, results) => {
            if (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }
            if (results.affectedRows === 0) {
                res.status(404).json({ message: 'Data probabilitas tidak ditemukan' });
                return;
            }
            res.status(200).json({ message: 'Data probabilitas berhasil diperbarui' });
        });
    });
});


// rute untuk menghapus data probabilitas
router.delete('/probability/:id', async (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM probabilitas WHERE id = ?';
    pool.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        if (results.affectedRows === 0) {
            res.status(404).json({ message: 'Kerusakan tidak ditemukan' });
            return;
        }
        res.status(200).json({ message: 'Kerusakan berhasil dihapus' });
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

// rute untuk menambah bobot gejala
router.post('/symptomseverity', async (req, res) => {
    const { kode_gejala, kode_kerusakan, bobot_gejala } = req.body;

    // Check if kode_kerusakan exists in kerusakan table
    const checkKerusakanSql = 'SELECT * FROM kerusakan WHERE kode_kerusakan = ?';
    pool.query(checkKerusakanSql, [kode_kerusakan], (error, kerusakanResults) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (kerusakanResults.length === 0) {
            res.status(404).json({ message: 'Kode kerusakan tidak ditemukan' });
            return;
        }

        // Check if kode_gejala exists in gejala table
        const checkGejalaSql = 'SELECT * FROM gejala WHERE kode_gejala = ?';
        pool.query(checkGejalaSql, [kode_gejala], (error, gejalaResults) => {
            if (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            if (gejalaResults.length === 0) {
                res.status(404).json({ message: 'Kode gejala tidak ditemukan' });
                return;
            }

            // Check if combination of kode_gejala and kode_kerusakan already exists in basis_pengetahuan table
            const checkBasisPengetahuanSql = 'SELECT * FROM basis_pengetahuan WHERE kode_gejala = ? AND kode_kerusakan = ?';
            pool.query(checkBasisPengetahuanSql, [kode_gejala, kode_kerusakan], (error, basisPengetahuanResults) => {
                if (error) {
                    console.error('Error:', error);
                    res.status(500).json({ error: 'Internal server error' });
                    return;
                }

                if (basisPengetahuanResults.length > 0) {
                    res.status(409).json({ message: 'Combination of kode gejala and kode kerusakan already exists' });
                    return;
                }

                // Insert new symptom severity
                const insertSql = 'INSERT INTO basis_pengetahuan (kode_gejala, kode_kerusakan, bobot_gejala) VALUES (?, ?, ?)';
                pool.query(insertSql, [kode_gejala, kode_kerusakan, bobot_gejala], (error, results) => {
                    if (error) {
                        console.error('Error:', error);
                        res.status(500).json({ error: 'Internal server error' });
                        return;
                    }

                    res.status(201).json({ message: 'Symptom severity created successfully', id: results.insertId });
                });
            });
        });
    });
});

// rute untuk mengedit bobot gejala
router.put('/symptomseverity/:id', async (req, res) => {
    const { id } = req.params;
    const { kode_gejala, kode_kerusakan, bobot_gejala } = req.body;
    const sql = 'UPDATE basis_pengetahuan SET kode_gejala = ?, kode_kerusakan = ?, bobot_gejala = ? WHERE id = ?';
    pool.query(sql, [kode_gejala, kode_kerusakan, bobot_gejala, id], (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (results.affectedRows === 0) {
            res.status(404).json({ message: 'Symptom severity not found' });
            return;
        }

        res.status(200).json({ message: 'Symptom severity updated successfully' });
    });
});

// rute untuk menghapus data bobot gejala
router.delete('/symptomseverity/:id', async (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM basis_pengetahuan WHERE id = ?';
    pool.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        if (results.affectedRows === 0) {
            res.status(404).json({ message: 'bobot gejala tidak ditemukan' });
            return;
        }
        res.status(200).json({ message: 'bobot gejala berhasil dihapus' });
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

/// Endpoint untuk menambah data baru ke tabel rule_aturan
router.post('/rule', async (req, res) => {
    const { rule_kondisi, hasil } = req.body;

    // Periksa apakah rule_kondisi sudah ada
    const checkDuplicateSql = 'SELECT COUNT(*) AS count FROM rule_aturan WHERE rule_kondisi = ?';
    pool.query(checkDuplicateSql, [rule_kondisi], (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (results[0].count > 0) {
            res.status(400).json({ error: 'rule_kondisi sudah ada, tidak bisa menambahkan data baru' });
            return;
        }

        // Jika rule_kondisi belum ada, tambahkan data baru
        const insertSql = 'INSERT INTO rule_aturan (rule_kondisi, hasil) VALUES (?, ?)';
        pool.query(insertSql, [rule_kondisi, hasil], (error, results) => {
            if (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }
            res.status(201).json({ message: 'Data berhasil ditambahkan', id: results.insertId });
        });
    });
});

// Rute untuk mengedit data pada rule_aturan berdasarkan ID
router.put('/rule/:id', async (req, res) => {
    const { id } = req.params;
    const { rule_kondisi, hasil } = req.body;
    const sql = 'UPDATE rule_aturan SET rule_kondisi = ?, hasil = ? WHERE id = ?';
    pool.query(sql, [rule_kondisi, hasil, id], (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        if (results.affectedRows === 0) {
            res.status(404).json({ message: 'Rule tidak ditemukan' });
            return;
        }
        res.status(200).json({ id, rule_kondisi, hasil });
    });
});


// rute untuk menghapus data bobot gejala
router.delete('/rule/:id', async (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM rule_aturan WHERE id = ?';
    pool.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        if (results.affectedRows === 0) {
            res.status(404).json({ message: 'rule tidak ditemukan' });
            return;
        }
        res.status(200).json({ message: 'rule berhasil dihapus' });
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
