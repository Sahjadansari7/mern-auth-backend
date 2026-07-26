// const express = require('express');
// const mongoose = require('mongoose');

// const app = express();
// app.use(express.json()); // JSON body parse karne ke liye — ye bahut zaroori hai!

// // ===== MongoDB Connect =====
// mongoose.connect('mongodb://localhost:27017/LearningDB')
//   .then(() => console.log('MongoDB Connected! ✅'))
//   .catch((err) => console.log('Error:', err));

// // ===== Schema & Model =====
// const studentSchema = new mongoose.Schema({
//   name: String,
//   age: Number,
//   class: Number
// });

// const Student = mongoose.model('Student', studentSchema);

// // ===== CRUD Routes =====

// // CREATE - Naya student add karo
// app.post('/students', async (req, res) => {
//   try {
//     const newStudent = new Student(req.body);
//     await newStudent.save();
//     res.status(201).json(newStudent);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// // READ - Sab students dekho
// app.get('/students', async (req, res) => {
//   const students = await Student.find();
//   res.json(students);
// });

// // READ - Ek specific student dekho (by ID)
// app.get('/students/:id', async (req, res) => {
//   const student = await Student.findById(req.params.id);
//   if (!student) return res.status(404).json({ error: 'Student not found' });
//   res.json(student);
// });

// // UPDATE - Student ki details update karo
// app.put('/students/:id', async (req, res) => {
//   const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
//   if (!student) return res.status(404).json({ error: 'Student not found' });
//   res.json(student);
// });

// // DELETE - Student delete karo
// app.delete('/students/:id', async (req, res) => {
//   const student = await Student.findByIdAndDelete(req.params.id);
//   if (!student) return res.status(404).json({ error: 'Student not found' });
//   res.json({ message: 'Student deleted successfully ✅' });
// });

// // ===== Server Start =====
// app.listen(3000, () => console.log('Server running on http://localhost:3000 🚀'));


   ///Express + Mongoose connect

require('dotenv').config();
   const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
 const jwt = require('jsonwebtoken');
 const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json());

//mongodb connection

// mongoose.connect('mongodb://localhost:27017/LearningDB')
  mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected! ✅'))
  .catch((err) => console.log('Error:', err));

///schema creation ek khali form

  const studentSchema = new mongoose.Schema({
  name: String,
  age: Number,
  class: Number
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);



///schema mai ek form fill kar k model banana

const Student = mongoose.model('Student', studentSchema);


// ===== Middleware to verify JWT token =====
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization']; // header se token nikala

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' }); // token hi nahi diya
  }

  const token = authHeader.split(' ')[1]; // "Bearer <token>" mein se sirf token nikala

  // jwt.verify(token, 'mySecretKey123', (err, decoded) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' }); // token galat/expire ho gaya
    }
    req.user = decoded; // decoded data (id, email) ko req.user mein daala
    next(); // sab theek hai, aage jaane do
  });
}

///post karna

app.post('/students',async (req, res) => {
  try {
    const newStudent = new Student(req.body);
    await newStudent.save();
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

///get karna all data
   ///verify token
app.get('/students',async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


///get one data

app.get('/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//update karna

app.put('/students/:id' ,async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(updatedStudent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

///delete karna

app.delete('/students/:id', verifyToken, async (req, res) => {
  try {
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);
    if (!deletedStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully', deletedStudent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/profile', verifyToken, async (req, res) => {
 try {
    const userProfile = await User.findById(req.user.id);
    if (!userProfile) {
      return res.status(404).json({ error: 'profile not found' });
    }
    res.json(userProfile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})  ;

///sign up route create bcrypt

app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


///login route 

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // const token = jwt.sign(
    //   { id: user._id, email: user.email },
    //   'mySecretKey123',
    //   { expiresIn: '1d' }
    // );

    const token = jwt.sign(
  { id: user._id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);

    res.json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

///post pe chalana
// app.listen(3000, () => console.log('Server running on port 3000 🚀'));
app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));