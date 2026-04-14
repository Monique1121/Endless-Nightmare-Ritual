const express = require('express')
const cors = require('cors')
const mysql = require('mysql2');
const app = express()
const port = 3000

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors())


// Create a connection to the database
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'nctdream123',
    database: 'endless',
    port: '3305'
});

// Connect to the database
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Database!');


    // Close the connection
    connection.end();
});



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});