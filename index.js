require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const authRoutes = require('./routes/auth');
const vocabularyRoutes = require('./routes/vocabulary');
const quizRoutes = require('./routes/quiz');
const grammarRoutes = require('./routes/grammar');
const punctuationRoutes = require('./routes/punctuation');
const flashcardRoutes = require('./routes/flashcard');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/grammar', grammarRoutes);
app.use('/api/punctuation', punctuationRoutes);
app.use('/api/flashcard', flashcardRoutes);


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database connection with improved options
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Increase timeout to 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 5, // Maintain a minimum of 5 socket connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      retryWrites: true, // Retry failed writes
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);

    // Fallback to local MongoDB if Atlas fails (for development)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Attempting to connect to local MongoDB...');
      try {
        const localConn = await mongoose.connect('mongodb://localhost:27017/lingualearn', {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          bufferCommands: false,
        });
        console.log(`✅ Local MongoDB Connected: ${localConn.connection.host}`);
      } catch (localError) {
        console.error('❌ Local MongoDB connection also failed:', localError.message);
        console.log('💡 Please ensure MongoDB is installed and running locally, or check your Atlas connection string.');
        console.log('⚠️ Running without database connection - some features may not work');
      }
    } else {
      console.error('💡 Please check your MongoDB Atlas connection string and network connectivity');
      process.exit(1);
    }
  }
};

// Connect to database
connectDB();

// Routes (to be added)
app.get('/', (req, res) => {
  res.render('index');
});
app.get('/register', (req, res) => res.render('register'));
app.get('/login', (req, res) => res.render('login'));
app.get('/quiz', (req, res) => res.render('quiz'));
app.get('/grammar', (req, res) => res.render('grammar'));
app.get('/punctuation', (req, res) => res.render('punctuation'));
app.get('/vocabulary', (req, res) => res.render('vocabulary'));
app.get('/flashcards', (req, res) => res.render('flashcards'));
app.get('/verify-email/:token', (req, res) => res.render('verify-email'));
app.get('/reset-password/:token', (req, res) => res.render('reset-password'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});