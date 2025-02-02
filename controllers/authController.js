const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const authController = {
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
          return res.status(400).json({ message: 'User already exists' });
        }
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await User.create({
        username,
        email,
        password: hashedPassword
      });
      
    //   res.status(201).json({ message: 'User registered successfully' });
    // } catch (error) {
    //   res.status(500).json({ error: error.message });
    // }
    await user.save();

    // Generate token
    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    });
  } catch (error) {
      res.status(500).json({ message: 'Error creating user', error: error.message });
  }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid password' });
      }
      
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({ 
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = authController;


// const User = require('../models/User');
// const jwt = require('jsonwebtoken');

// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: '30d'
//   });
// };

// exports.register = async (req, res) => {
//   try {
//     const { username, email, password, learningPreferences } = req.body;

//     const userExists = await User.findOne({ email });
//     if (userExists) {
//       return res.status(400).json({ error: 'User already exists' });
//     }

//     const user = await User.create({
//       username,
//       email,
//       password,
//       learningPreferences
//     });

//     const token = generateToken(user._id);

//     res.status(201).json({
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         learningPreferences: user.learningPreferences
//       },
//       token
//     });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user || !(await user.isValidPassword(password))) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     const token = generateToken(user._id);

//     res.json({
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         learningPreferences: user.learningPreferences
//       },
//       token
//     });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };