const express = require('express')
const cors = require('cors')
const mysql = require('mysql2');

const app = express()
const port = 3000

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors())

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'nctdream123',
    database: 'endless',
    port: '3305'
});

// Endpoint 1: login del usuario
app.get('/login', (req, res) => {
    const { username, password } = req.body;

    pool.query('SELECT * FROM users WHERE Username = ? AND Password_hash = ?',
    [username, password],(err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error en la consulta");
        }

        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(401).send("Credenciales incorrectas");
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
});