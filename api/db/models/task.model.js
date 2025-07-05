const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  _listId: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  _teamId: {
    type: mongoose.Types.ObjectId,
    default: null  // <- make it optional
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 0
  },
  priorityLabel: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'low'
  },
  dueDate: {
    type: String, // ISO string like "2025-07-01"
    default: null
  },
  sortOrder: {
    type: Number,
    default: 0
  }
});

const Task = mongoose.model('Task', TaskSchema);

module.exports = { Task };
