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
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: String, // Store as ISO string like "2025-07-01"
    default: null
  }
});

const Task = mongoose.model('Task', TaskSchema);

module.exports = { Task };
