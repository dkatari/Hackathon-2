const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();

// MySQL Connection Pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: 'mysql',
  database: 'Quick_ID'
});

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '2_HACKATHON PROJECT')));
app.set('view engine', 'ejs');

// Session middleware
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));

// Routes
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/index'); // Redirect to authenticated page
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  pool.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) throw err;
    if (results.length && bcrypt.compareSync(password, results[0].password)) {
      req.session.user = results[0];
      res.redirect('/index'); 
    } else {
      res.send('<h1> Incorrect email or password <h1>');
    }
  });
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  const { first_name, last_name, dob, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);

  pool.query('INSERT INTO users (first_name, last_name, dob, email, password) VALUES (?, ?, ?, ?, ?)',
    [first_name, last_name, dob, email, hashedPassword], (err, results) => {
      if (err) throw err;
      res.redirect('/login');
    });
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect('/login');
  });
});

// Authenticated route
app.get('/index', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('index', {
    title: 'General Elections 2024 - Voters\' Service Portal',
    stylesheets: ['styles.css'], // Link your custom CSS file
    user: req.session.user
  });
});


// Route to render step 1 form
app.get('/form6', (req, res) => {
  res.render('form6');
});

// Route to handle step 1 form submission
app.post('/submitindianvoterid', (req, res) => {
  console.log("Hi")
  console.log(req.body)
  const {
    first_name,
    middle_name,
    last_name,
    date_of_birth,
    gender,
    parent_guardian_name,
    address_house_number,
    address_street_area,
    address_city_town_village,
    address_district,
    address_state,
    address_pincode,
    mobile_number,
    email_address,
    aadhaar_number,
    declaration
  } = req.body;

  pool.query(
    'INSERT INTO IndianCitizens (first_name, middle_name, last_name, date_of_birth, gender, parent_guardian_name,address_house_number, address_street_area, address_city_town_village, address_district, address_state, address_pincode,mobile_number, email_address, aadhaar_number, declaration) VALUES (?, ?, ?, ?, ?, ? ,? ,? ,? ,? ,? ,? ,? ,? ,? ,? )',
    [first_name, middle_name, last_name, date_of_birth, gender, parent_guardian_name,address_house_number, address_street_area, address_city_town_village, address_district, address_state, address_pincode,mobile_number, email_address, aadhaar_number, declaration],
    (err, results) => {
      if (err) {
        console.error('Error inserting data into the database:', err);
        res.status(500).send('Internal Server Error');
      } else {
        // Store the last inserted id in session
        req.session.citizen_id = results.insertId;
        res.send(`<h1>Application submitted</h1>`)
      }
    }
  );
});



// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

