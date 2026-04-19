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

// Endpoint
app.get('/consulta', (req, res) => {
    console.log("Get");

    pool.query('SELECT * FROM cards', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error en la consulta");
        }

        res.send(results);
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
});