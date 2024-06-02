const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');

const app = express();

// MySQL Connection Pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: 'mysql',
  database: 'Quick_ID'
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    const username = req.session.user.email; // Assuming email is unique and used as username
    const fileType = file.fieldname;
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `${username}-${fileType}-${timestamp}${extension}`);
  }
});

const upload = multer({ storage: storage });

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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
    res.redirect('/index');
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

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect('/login');
  });
});

app.get('/index', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('index', {
    title: 'General Elections 2024 - Voters\' Service Portal',
    stylesheets: ['styles.css'],
    user: req.session.user
  });
});

app.get('/form6', (req, res) => {
  res.render('form6');
});

app.post('/submitindianvoterid', (req, res) => {
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
    'INSERT INTO IndianCitizens (first_name, middle_name, last_name, date_of_birth, gender, parent_guardian_name, address_house_number, address_street_area, address_city_town_village, address_district, address_state, address_pincode, mobile_number, email_address, aadhaar_number, declaration, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [first_name, middle_name, last_name, date_of_birth, gender, parent_guardian_name, address_house_number, address_street_area, address_city_town_village, address_district, address_state, address_pincode, mobile_number, email_address, aadhaar_number, declaration, req.session.user.id],
    (err, results) => {
      if (err) {
        console.error('Error inserting data into the database:', err);
        res.status(500).send('Internal Server Error');
      } else {
        req.session.citizen_id = results.insertId;
        res.redirect('/submitindianvoterid-upload');
      }
    }
  );
});

app.get('/submitindianvoterid-upload', (req, res) => {
  res.render('form6u');
});

app.post('/submitindianvoterid-upload', upload.fields([
  { name: 'passport_photo', maxCount: 1 },
  { name: 'aadhar_photo', maxCount: 1 },
  { name: 'signature_photo', maxCount: 1 }
]), (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const citizen_id = req.session.citizen_id;
  const passportPhotoFilename = req.files['passport_photo'][0].filename;
  const aadharPhotoFilename = req.files['aadhar_photo'][0].filename;
  const signaturePhotoFilename = req.files['signature_photo'][0].filename;

  pool.query(
    'UPDATE IndianCitizens SET passport_photo_filename = ?, aadhar_photo_filename = ?, signature_photo_filename = ? WHERE id = ?',
    [passportPhotoFilename, aadharPhotoFilename, signaturePhotoFilename, citizen_id],
    (err, results) => {
      if (err) {
        console.error('Error updating filenames in the database:', err);
        res.status(500).send('Internal Server Error');
      } else {
        res.redirect('/success');
      }
    }
  );
});

app.get('/success', (req, res) => {
  res.render('success');
});

app.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const userId = req.session.user.id;

  pool.query('SELECT * FROM IndianCitizens WHERE user_id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Error fetching data from the database:', err);
      res.status(500).send('Internal Server Error');
    } else {
      const citizen = results[0];
      res.render('profile', {
        title: 'User Profile',
        citizen,
        stylesheets: ['styles.css']
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
