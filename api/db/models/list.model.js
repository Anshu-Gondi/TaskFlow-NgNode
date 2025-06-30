const mongoose = require('mongoose');

const ListSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },

  // Solo user ownership
  _userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: function () {
      return !this.teamId;  // required if not in a team
    }
  },

  // Team ownership (optional)
  teamId: {
    type: mongoose.Types.ObjectId,
    ref: 'Team',
    required: function () {
      return !this._userId; // required if not a solo list
    }
  }
});

// Add indexes to optimize queries
ListSchema.index({ _userId: 1 });
ListSchema.index({ teamId: 1 });

const List = mongoose.model('List', ListSchema);
module.exports = { List };
