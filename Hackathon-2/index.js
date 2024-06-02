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
  connectionLimit: 10, // Adjust according to your needs
  host: 'localhost',
  user: 'root',
  password: 'Thathagaru@50',
  database: 'hackathon2'
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
    cb(null,' ${username}-${fileType}-${timestamp}${extension}');
  }
});

const upload = multer({ storage: storage });

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '2_HACKATHON PROJECT')));
app.set('view engine', 'ejs');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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
/*app.get('/form6', (req, res) => {
  res.render('form6');
});*/

app.get('/download/form6', (req, res) => {
  const filePath = path.join(__dirname, 'downloads', 'Form_6_English.pdf');

  res.download(filePath, 'Form_6_English.pdf', (err) => {
    if (err) {
      console.log(err);
      res.status(500).send('Could not download the file');
    }
  });
});
app.get('/download/form6g', (req, res) => {
  const filePath = path.join(__dirname, 'downloads', 'Form-6_guidlines.pdf');
  res.download(filePath, 'Form-6_guidlines.pdf', (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(500).send('Could not download the file');
    }
  });
});

app.get('/form6a', (req, res) => {
  res.render('form6a', {
    title: 'Form 6A - New Registration Form for Overseas Electors',
    stylesheets: ['styles.css'],
    logo: '/images/logo.png'
  });
});

app.get('/download/form6a', (req, res) => {
  const filePath = path.join(__dirname, 'downloads', 'Form_6A_English.pdf');
  res.download(filePath, 'Form_6A_English.pdf', (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(500).send('Could not download the file');
    }
  });
});

app.get('/download/form6ag', (req, res) => {
  const filePath = path.join(__dirname, 'downloads', 'Form-6a_guidlines.pdf');
  res.download(filePath, 'Form-6a_guidlines.pdf', (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(500).send('Could not download the file');
    }
  });
});
  

app.get('/form6', (req, res) => {
  res.render('form6', {
    title: 'Form 6 - New Registration Form for General Electors',
    stylesheets: ['styles.css'],
    logo: '/images/logo.png'
  });
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

app.get('/form6a', (req, res) => {
  res.render('form6a', {
    title: 'Form 6A - New Registration Form for Overseas Electors',
    stylesheets: ['styles.css'],
    logo: '/images/logo.png'
  });
});

// Route to handle form 6A submission
app.post('/submitOverseasVoterID', (req, res) => {
  const { 
    first_name, middle_name, last_name, date_of_birth, gender, parent_guardian_name,
    passport_number, passport_place_of_issue, passport_date_of_issue, passport_date_of_expiry,
    overseas_address_house_number, overseas_address_street, overseas_address_city,
    overseas_address_state, overseas_address_country, overseas_address_postal_code,
    mobile_number, email_address, declaration 
  } = req.body;

  const sql = `
    INSERT INTO OverseasCitizens (
      first_name, middle_name, last_name, date_of_birth, gender, parent_guardian_name,
      passport_number, passport_place_of_issue, passport_date_of_issue, passport_date_of_expiry,
      overseas_address_house_number, overseas_address_street, overseas_address_city,
      overseas_address_state, overseas_address_country, overseas_address_postal_code,
      mobile_number, email_address, declaration
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  pool.query(sql, [
    first_name, middle_name, last_name, date_of_birth, gender, parent_guardian_name,
    passport_number, passport_place_of_issue, passport_date_of_issue, passport_date_of_expiry,
    overseas_address_house_number, overseas_address_street, overseas_address_city,
    overseas_address_state, overseas_address_country, overseas_address_postal_code,
    mobile_number, email_address, declaration
  ], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).send('Error submitting form. Please try again later.');
    }
    res.redirect('/success');
  });
});

app.get('/pan_minor', (req, res) => {
  res.render('pan_minor', {
    title: 'Online PAN application for minor',
    stylesheets: ['styles.css'],
    logo: '/images/logo.png'
  });
});

app.post('/submitPanCardMinor', (req, res) => {
  const {
    minor_name, date_of_birth, gender, parent_name, parent_pan, address,
    city, district, state, pincode, mobile_number, email_address, aadhaar_number, declaration
  } = req.body;

  const sql = `
    INSERT INTO PanCardMinor (
      minor_name, date_of_birth, gender, parent_name, parent_pan, address,
      city, district, state, pincode, mobile_number, email_address, aadhaar_number, declaration
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  pool.query(sql, [
    minor_name, date_of_birth, gender, parent_name, parent_pan, address,
    city, district, state, pincode, mobile_number, email_address, aadhaar_number, declaration
  ], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).send('Error submitting form. Please try again later.');
    }
    console.log('Data inserted successfully.');
    res.redirect('/success');
  });
});


app.get('/pan_major', (req, res) => {
  res.render('pan_major', {
    title: 'Online PAN application',
    stylesheets: ['styles.css'],
    logo: '/images/logo.png'
  });
});

app.get('/download/Instructions', (req, res) => {
  const filePath = path.join(__dirname, 'downloads', 'Additional_Instructions_for_Corporate_applicants.pdf');
  res.download(filePath, 'Additional_Instructions_for_Corporate_applicants.pdf', (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(500).send('Could not download the file');
    }
  });
});
app.get('/download/form49', (req, res) => {
  const filePath = path.join(__dirname, 'downloads', 'Form_49A.pdf');
  res.download(filePath, 'Form_49A.pdf', (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(500).send('Could not download the file');
    }
  });
});

app.post('/submitPanCard', (req, res) => {
  const {
    first_name, middle_name, last_name, date_of_birth, gender, parent_first_name, parent_last_name,
    address_house_number, address_street_area, address_city_town_village, address_district, address_state,
    address_pincode, mobile_number, email_address, aadhaar_number, source_of_income, declaration
  } = req.body;

  const sql = `
    INSERT INTO PanCardMajor (
      first_name, middle_name, last_name, date_of_birth, gender, parent_first_name, parent_last_name,
      address_house_number, address_street_area, address_city_town_village, address_district, address_state,
      address_pincode, mobile_number, email_address, aadhaar_number, source_of_income, declaration
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  pool.query(sql, [
    first_name, middle_name, last_name, date_of_birth, gender, parent_first_name, parent_last_name,
    address_house_number, address_street_area, address_city_town_village, address_district, address_state,
    address_pincode, mobile_number, email_address, aadhaar_number, source_of_income, declaration
  ], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).send('Error submitting form. Please try again later.');
    }
    console.log('Data inserted successfully.');
    res.redirect('/success');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

