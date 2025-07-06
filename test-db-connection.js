require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...');
  console.log('📍 Connection URI:', process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
  
  try {
    // Test Atlas connection
    console.log('\n⏳ Attempting to connect to MongoDB Atlas...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Ready State: ${conn.connection.readyState}`);
    
    // Test a simple operation
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`📁 Collections found: ${collections.length}`);
    
    await mongoose.disconnect();
    console.log('✅ Connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Atlas connection failed:', error.message);
    
    // Test local connection as fallback
    console.log('\n⏳ Attempting to connect to local MongoDB...');
    try {
      const localConn = await mongoose.connect('mongodb://localhost:27017/lingualearn', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
      });
      
      console.log('✅ Successfully connected to local MongoDB!');
      console.log(`📍 Host: ${localConn.connection.host}`);
      console.log(`📊 Database: ${localConn.connection.name}`);
      
      await mongoose.disconnect();
      console.log('✅ Local connection test completed successfully!');
      
    } catch (localError) {
      console.error('❌ Local connection also failed:', localError.message);
      console.log('\n💡 Troubleshooting suggestions:');
      console.log('1. Check if MongoDB is installed and running locally');
      console.log('2. Verify your Atlas connection string and credentials');
      console.log('3. Check your network connection');
      console.log('4. Ensure your IP is whitelisted in Atlas (0.0.0.0/0 for development)');
    }
  }
}

testConnection();
