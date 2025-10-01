// Create a test user in MongoDB without running the Next.js server
// Loads .env.local, connects with mongoose, and inserts a user with hashed password

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
      // Do not print values to avoid leaking secrets
      process.env[key.trim()] = value;
    }
  }
}

async function main() {
  loadEnvLocal();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment');
  }

  // Connect
  await mongoose.connect(uri, { bufferCommands: false });

  const userSchema = new mongoose.Schema(
    {
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
    },
    { timestamps: true }
  );

  userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
      this.password = await bcrypt.hash(this.password, 12);
      next();
    } catch (err) {
      next(err);
    }
  });

  const User = mongoose.models.User || mongoose.model('User', userSchema);

  const email = 'test.user@example.com';
  const password = 'Test@123456';
  const firstName = 'Test';
  const lastName = 'User';

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    console.log(`Test user already exists: ${email}`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const user = new User({ email, password, firstName, lastName });
  await user.save();

  console.log('Created test user:', {
    email,
    firstName,
    lastName,
  });

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Failed to create test user:', err && err.message ? err.message : err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});