const mongoose = require('mongoose');
const shortid = require('shortid');

// Membership subdocument schema
const MembershipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer'],
    default: 'viewer'
  }
}, { _id: false });

// Main Team schema
const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    unique: true,
    default: () => shortid.generate()
  },
  memberships: [MembershipSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to get a user's role from the team
TeamSchema.methods.getUserRole = function(userId) {
  const member = this.memberships.find(m => m.userId.equals(userId));
  return member?.role || null;
};

const Team = mongoose.model('Team', TeamSchema);
module.exports = { Team };
