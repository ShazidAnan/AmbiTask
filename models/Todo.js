const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  important: { type: Boolean, default: false },
  dueDate: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Todo', todoSchema);
