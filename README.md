# 🌍 LinguaLearn - Interactive Language Learning Platform

A comprehensive, modern language learning application built with Node.js, Express, and MongoDB. LinguaLearn offers an engaging, gamified experience for learning languages through vocabulary practice, grammar exercises, punctuation training, flashcards, and adaptive quizzes.

![LinguaLearn Banner](https://via.placeholder.com/800x200/3B82F6/FFFFFF?text=LinguaLearn+-+Master+Languages+Interactively)

## ✨ Features

### 🎯 **Core Learning Modules**
- **Vocabulary Practice** - Interactive word learning with translations, examples, and pronunciation
- **Grammar Exercises** - Comprehensive grammar rules with practice exercises
- **Punctuation Training** - Master punctuation rules through interactive exercises
- **Flashcard System** - Spaced repetition algorithm for optimal retention
- **Adaptive Quizzes** - Dynamic quiz generation with multiple question types

### 🚀 **Advanced Features**
- **Spaced Repetition** - Intelligent review scheduling based on performance
- **Progress Tracking** - Detailed analytics and learning statistics
- **Gamification** - Points, levels, achievements, and leaderboards
- **Multi-language Support** - English, Spanish, French, and more
- **Adaptive Difficulty** - Automatic adjustment based on user performance
- **Real-time Feedback** - Instant corrections and explanations

### 🔐 **User Management**
- Secure user authentication with JWT
- Email verification and password reset
- User profiles and learning preferences
- Role-based access control (admin/user)

## 🛠 Tech Stack

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Nodemailer** - Email functionality

### **Frontend**
- **EJS** - Templating engine
- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - Component library
- **Vanilla JavaScript** - Interactive functionality

## 📦 Installation

### **Prerequisites**
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Git

### **Quick Start**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/lingualearn.git
   cd lingualearn
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/lingualearn
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key
   NODE_ENV=development

   # Optional: Email configuration
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the application**
   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## 🎮 Usage

### **Getting Started**
1. **Register** a new account or **login** with existing credentials
2. **Choose your learning path** - select language pair and difficulty level
3. **Start learning** with any of the available modules:
   - Practice vocabulary with interactive exercises
   - Master grammar rules through guided lessons
   - Improve punctuation with correction exercises
   - Create and study flashcard decks
   - Challenge yourself with adaptive quizzes

### **Learning Modules**

#### 📚 **Vocabulary Practice**
- **Translation Mode** - Learn word meanings and translations
- **Definition Mode** - Match words with their definitions
- **Audio Practice** - Improve pronunciation and listening
- **Spaced Review** - Revisit words based on retention algorithm

#### 📝 **Grammar Exercises**
- **Rule Learning** - Understand grammar concepts with examples
- **Practice Exercises** - Multiple choice and fill-in-the-blank questions
- **Sentence Correction** - Fix grammatical errors in sentences
- **Progressive Difficulty** - Advance from basic to complex rules

#### ✏️ **Punctuation Training**
- **Rule Reference** - Quick access to punctuation guidelines
- **Text Correction** - Fix punctuation errors in passages
- **Interactive Exercises** - Practice with immediate feedback
- **Real-world Examples** - Learn through practical applications

#### 🃏 **Flashcard System**
- **Custom Decks** - Create personalized study sets
- **Spaced Repetition** - Optimized review scheduling
- **Performance Tracking** - Monitor learning progress
- **Vocabulary Integration** - Auto-generate cards from vocabulary

#### 🧠 **Adaptive Quizzes**
- **Mixed Content** - Combine vocabulary, grammar, and punctuation
- **Timed Challenges** - Test knowledge under time pressure
- **Difficulty Adaptation** - Questions adjust to your skill level
- **Detailed Results** - Comprehensive performance analysis

## 📊 API Documentation

### **Authentication Endpoints**
```
POST /api/auth/register     - Register new user
POST /api/auth/login        - User login
GET  /api/auth/profile      - Get user profile
PUT  /api/auth/profile      - Update user profile
POST /api/auth/forgot-password - Request password reset
POST /api/auth/reset-password/:token - Reset password
```

### **Learning Module Endpoints**
```
# Vocabulary
GET  /api/vocabulary/words     - Get vocabulary words
GET  /api/vocabulary/practice  - Get practice words
POST /api/vocabulary/submit    - Submit practice answer

# Grammar
GET  /api/grammar/rules        - Get grammar rules
GET  /api/grammar/practice     - Get practice exercises
POST /api/grammar/submit       - Submit exercise answer

# Punctuation
GET  /api/punctuation/rules    - Get punctuation rules
GET  /api/punctuation/practice - Get practice exercises
POST /api/punctuation/submit   - Submit exercise answer

# Flashcards
GET  /api/flashcard/decks      - Get user's decks
POST /api/flashcard/decks      - Create new deck
GET  /api/flashcard/cards/due  - Get cards due for review
POST /api/flashcard/review     - Submit card review

# Quizzes
GET  /api/quiz/generate        - Generate dynamic quiz
POST /api/quiz/submit          - Submit quiz answers
GET  /api/quiz/progress        - Get user progress
GET  /api/quiz/leaderboard     - Get leaderboard
```

## 🗂 Project Structure

```
LangLearnApp/
├── controllers/           # Business logic
│   ├── authController.js
│   ├── vocabularyController.js
│   ├── grammarController.js
│   ├── punctuationController.js
│   ├── flashcardController.js
│   └── quizController.js
├── models/               # Database schemas
│   ├── User.js
│   ├── Vocabulary.js
│   ├── Grammar.js
│   ├── Punctuation.js
│   ├── Flashcard.js
│   ├── Quiz.js
│   ├── Progress.js
│   └── UserProgress.js
├── routes/               # API endpoints
│   ├── auth.js
│   ├── vocabulary.js
│   ├── grammar.js
│   ├── punctuation.js
│   ├── flashcard.js
│   └── quiz.js
├── middleware/           # Custom middleware
│   └── auth.js
├── views/                # Frontend templates
│   ├── index.ejs
│   ├── login.ejs
│   ├── register.ejs
│   ├── vocabulary.ejs
│   ├── grammar.ejs
│   ├── punctuation.ejs
│   ├── flashcards.ejs
│   └── quiz.ejs
├── public/               # Static assets
├── .env                  # Environment variables
├── package.json          # Dependencies
└── index.js             # Main server file
```

## 🔧 Configuration

### **Environment Variables**
- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)
- `EMAIL_USER` - Email service username (optional)
- `EMAIL_PASS` - Email service password (optional)
- `CLIENT_URL` - Frontend URL for email links

### **Database Setup**
The application will automatically create the necessary collections and indexes when you first run it. No manual database setup required!

## 🚀 Deployment

### **Production Deployment**

1. **Set environment variables**
   ```bash
   export NODE_ENV=production
   export MONGODB_URI=your-production-mongodb-uri
   export JWT_SECRET=your-production-jwt-secret
   ```

2. **Install production dependencies**
   ```bash
   npm ci --only=production
   ```

3. **Start the application**
   ```bash
   npm start
   ```

### **Docker Deployment**
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### **Development Guidelines**
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **DaisyUI** - Beautiful UI components
- **Tailwind CSS** - Utility-first CSS framework
- **MongoDB** - Flexible document database
- **Express.js** - Fast, minimalist web framework
- **Node.js** - JavaScript runtime environment

## 📞 Support

- **Documentation**: [Wiki](https://github.com/JustoSinak/lingualearn/wiki)
- **Issues**: [GitHub Issues](https://github.com/JustoSinak/lingualearn/issues)
- **Discussions**: [GitHub Discussions](https://github.com/JustoSinak/lingualearn/discussions)

---

**Made with ❤️ for language learners worldwide**

*Start your language learning journey today with LinguaLearn!*