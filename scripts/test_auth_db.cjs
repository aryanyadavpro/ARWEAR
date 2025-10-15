// Test MongoDB connection and authentication logic
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error(`.env.local not found at ${envPath}`);
  }
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || /^\s*#/.test(line) || !line.includes('=')) continue;
    const [key, ...rest] = line.split('=');
    const value = rest.join('=').trim();
    if (key && !(key in process.env)) {
      process.env[key.trim()] = value;
    }
  }
}

async function testDatabase() {
  console.log('🔍 Testing MongoDB Connection and Authentication...\n');
  
  try {
    // Load environment variables
    loadEnvLocal();
    
    const uri = process.env.MONGODB_URI;
    const jwtSecret = process.env.JWT_SECRET;
    
    console.log('✅ Environment Variables:');
    console.log(`   MONGODB_URI: ${uri ? 'Set' : 'Not set'}`);
    console.log(`   JWT_SECRET: ${jwtSecret ? 'Set' : 'Not set'}\n`);
    
    if (!uri) {
      throw new Error('MONGODB_URI is not set');
    }
    
    // Connect to database
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(uri, { 
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ MongoDB connected successfully\n');
    
    // Define User schema (matching your model)
    const userSchema = new mongoose.Schema({
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      password: {
        type: String,
        required: true,
        select: false,
        minlength: 6,
      },
      firstName: { type: String, required: true, trim: true, maxlength: 50 },
      lastName: { type: String, required: true, trim: true, maxlength: 50 },
    }, { timestamps: true });

    // Hash password before saving
    userSchema.pre('save', async function(next) {
      if (!this.isModified('password')) return next();
      try {
        this.password = await bcrypt.hash(this.password, 12);
        next();
      } catch (error) {
        next(error);
      }
    });

    // Instance method to compare password
    userSchema.methods.comparePassword = async function(candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    };

    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Test 1: Check existing users
    console.log('👥 Checking existing users...');
    const userCount = await User.countDocuments();
    console.log(`   Found ${userCount} users in database\n`);
    
    const existingUsers = await User.find({}, 'email firstName lastName createdAt').limit(5);
    if (existingUsers.length > 0) {
      console.log('📋 Sample users:');
      existingUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.firstName} ${user.lastName})`);
      });
      console.log();
    }
    
    // Test 2: Test signup logic
    console.log('📝 Testing SIGNUP logic...');
    const testEmail = `test.auth.${Date.now()}@example.com`;
    const testPassword = 'TestPassword123';
    
    try {
      // Check if user exists (should not exist)
      const existingUser = await User.findOne({ email: testEmail.toLowerCase() });
      if (existingUser) {
        console.log('❌ User already exists (this should not happen)');
      } else {
        console.log('✅ User does not exist (good for signup)');
      }
      
      // Create new user
      const newUser = new User({
        email: testEmail.toLowerCase(),
        password: testPassword,
        firstName: 'Test',
        lastName: 'Auth'
      });
      
      await newUser.save();
      console.log('✅ User created successfully');
      console.log(`   User ID: ${newUser._id}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Name: ${newUser.firstName} ${newUser.lastName}\n`);
      
      // Test 3: Test signin logic
      console.log('🔐 Testing SIGNIN logic...');
      
      // Find user with password field
      const userForSignin = await User.findOne({ email: testEmail.toLowerCase() }).select('+password');
      if (!userForSignin) {
        console.log('❌ User not found for signin');
      } else {
        console.log('✅ User found for signin');
        
        // Test password comparison
        const isPasswordValid = await userForSignin.comparePassword(testPassword);
        console.log(`✅ Password validation: ${isPasswordValid ? 'PASSED' : 'FAILED'}`);
        
        // Test wrong password
        const isWrongPasswordValid = await userForSignin.comparePassword('WrongPassword');
        console.log(`✅ Wrong password validation: ${isWrongPasswordValid ? 'FAILED (should be false)' : 'PASSED (correctly false)'}`);
      }
      
      // Cleanup - remove test user
      await User.deleteOne({ email: testEmail.toLowerCase() });
      console.log('🧹 Test user cleaned up\n');
      
    } catch (error) {
      console.log('❌ Signup/Signin test failed:', error.message);
    }
    
    // Test 4: Test with existing user (if any)
    if (existingUsers.length > 0) {
      console.log('🔍 Testing with existing user...');
      const existingUser = existingUsers[0];
      
      // Try to find user for signin
      const userWithPassword = await User.findOne({ email: existingUser.email }).select('+password');
      if (userWithPassword) {
        console.log('✅ Can retrieve existing user with password field');
      } else {
        console.log('❌ Cannot retrieve existing user with password field');
      }
    }
    
    console.log('🎉 Database connection and authentication logic test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.name === 'MongoServerSelectionError') {
      console.error('   This usually means:');
      console.error('   - MongoDB URI is incorrect');
      console.error('   - Network connectivity issues');
      console.error('   - Database server is down');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB connection closed');
  }
}

testDatabase().catch(console.error);