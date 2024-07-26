const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const path = require("path");

// initiate app
const app = express();

// setting up the middleware
app.use(express.json());
app.use(cors());
dotenv.config();

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, "..")));

// creating a connection to the database server
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// check if connection to the database server works
db.connect((err) => {
  if (err) return console.log("Error connecting to MySQL");

  // connection works
  console.log("Connected to MYSQL as id: ", db.threadId);

  // Create a database if it does not exist
  db.query(`CREATE DATABASE IF NOT EXISTS expense_tracker`, (err, result) => {
    // error creating db
    if (err) return console.log("error creating db");

    // if no error creating db
    console.log("Database expense_tracker checked/created successfully");

    // select the created database (expense_tracker)
    db.changeUser({ database: "expense_tracker" }, (err, result) => {
      // if err changing db
      if (err) return console.log("error changing db");

      // if no err changing db
      console.log("Switched to expense_tracker database");

      // Create users table if it does not exist
      const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(100) NOT NULL UNIQUE,
          username VARCHAR(50) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL
      )
  `;
      db.query(createUsersTable, (err, result) => {
        // if error creating table
        if (err) return console.log("error creating table");

        // if no error creating table
        console.log("Users table checked/created successfully");
      });
    });
  });
});

// User registration route
app.post("/api/register", async (req, res) => {
  try {
    // check if user email exists
    const user = `SELECT * FROM users WHERE email = ?`;

    db.query(user, [req.body.email], (err, data) => {
      // if email exists in database
      if (data.length > 0)
        return res.status(409).json({ message: "User already exists!" });

      // if no email exists in database
      // password hashing (encryption)
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(req.body.password, salt);

      // create new user
      const newUser = `INSERT INTO users(email, username, password) VALUES (?) `;
      value = [req.body.email, req.body.username, hashedPassword];

      // adding the new user to the database
      db.query(newUser, [value], (err, data) => {
        // if insert user fail
        if (err) return res.status(500).json("Something went wrong!");

        // insert user works
        return res.status(200).json("User created successfully!");
      });
    });
  } catch (err) {
    res.status(500).json("Something went wrong, Internal Server Error");
  }
});

// User login
app.post("/api/login", async (req, res) => {
  try {
    const user = `SELECT * FROM users WHERE email = ?`;

    db.query(user, [req.body.email], (err, data) => {
      // if user not found
      if (data.length === 0) return res.status(404).json("User not found!");

      // if user exist
      const isPasswordValid = bcrypt.compareSync(
        req.body.password,
        data[0].password
      );

      if (!isPasswordValid)
        return res.status(400).json("Invalid email or password");

      return res.status(200).json("Login successful");
    });
  } catch (err) {
    res.status(500).json("Internal Server Error");
  }
});

// running the server
app.listen(3000, () => {
  console.log("server is running on PORT 3000...");
});

// Learnt in class
// run with (nodemon server.js)
// run on CLI (mysql -u root -p) :-
// After entering the correct password, you will be granted access to
// the MySQL shell where you can execute SQL queries and commands.
//
// In the context of RESTful APIs (Representational State Transfer),
// the standard HTTP methods used for CRUD (Create, Retrieve, Update, Delete)
// operations are:
//
// C R U D :::
// Create - POST request
// Retrieve - GET request
// Update - PUT request
// Delete - DELETE request
