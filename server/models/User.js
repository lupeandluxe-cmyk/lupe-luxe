const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
  },
  password: { type: String, required: false, minlength: 8 },
  googleId: { type: String, sparse: true },
  role: { 
    type: String, 
    enum: ['super_admin', 'admin', 'staff', 'employee', 'customer'], 
    default: 'customer' 
  },
  blocked: { type: Boolean, default: false },
  loginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  twoFactorSecret: { type: String },
  twoFactorEnabled: { type: Boolean, default: false },
  loginHistory: [{
    ip: String,
    date: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.twoFactorSecret;
  delete obj.loginAttempts;
  delete obj.lockedUntil;
  return obj;
};

// Helper methods to check roles
userSchema.methods.isSuperAdmin = function() {
  return this.role === 'super_admin';
};

userSchema.methods.isAdmin = function() {
  return this.role === 'admin' || this.role === 'super_admin';
};

userSchema.methods.isStaff = function() {
  return this.role === 'staff' || this.role === 'admin' || this.role === 'super_admin';
};

userSchema.methods.isEmployee = function() {
  return this.role === 'employee' || this.role === 'staff' || this.role === 'admin' || this.role === 'super_admin';
};

userSchema.methods.isCustomer = function() {
  return this.role === 'customer';
};

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
