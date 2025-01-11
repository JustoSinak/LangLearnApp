require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const authRoutes = require('./routes/auth');
const vocabularyRoutes = require('./routes/vocabulary');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/vocabulary', vocabularyRoutes);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes (to be added)
app.get('/', (req, res) => {
  res.render('index');
});
app.get('/register', (req, res) => res.render('register'));
app.get('/login', (req, res) => res.render('login'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});