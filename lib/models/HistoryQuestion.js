const mongoose = require('mongoose');

const bilingualTextSchema = new mongoose.Schema(
  {
    en: { type: String, required: true },
    hi: { type: String, required: true },
  },
  { _id: false }
);

const historyQuestionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    exam: { type: String },
    askedIn: { type: String, required: true },
    subject: { type: String, required: true },
    topic: { type: bilingualTextSchema, required: true },
    question: { type: bilingualTextSchema, required: true },
    options: { type: mongoose.Schema.Types.Mixed, required: true },
    answer: { type: String, required: true },
    explanation: { type: bilingualTextSchema, required: true },
  },
  {
    timestamps: true,
  }
);

const HistoryQuestion = mongoose.models.HistoryQuestion || mongoose.model('HistoryQuestion', historyQuestionSchema, 'history_questions');

module.exports = HistoryQuestion;