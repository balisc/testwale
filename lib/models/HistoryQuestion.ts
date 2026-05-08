import mongoose, { Document, Model, Schema } from 'mongoose';

export type BilingualText = {
  en: string;
  hi: string;
};

export type HistoryQuestionItem = {
  id: string;
  exam?: string;
  askedIn: string;
  subject: string;
  topic: BilingualText;
  question: BilingualText;
  options: Record<string, BilingualText>;
  answer: string;
  explanation: BilingualText;
};

export interface HistoryQuestionDocument extends HistoryQuestionItem, Document {}

const bilingualTextSchema = new Schema<BilingualText>(
  {
    en: { type: String, required: true },
    hi: { type: String, required: true },
  },
  { _id: false }
);

const historyQuestionSchema = new Schema<HistoryQuestionDocument>(
  {
    id: { type: String, required: true, unique: true },
    exam: { type: String },
    askedIn: { type: String, required: true },
    subject: { type: String, required: true },
    topic: { type: bilingualTextSchema, required: true },
    question: { type: bilingualTextSchema, required: true },
    options: { type: Schema.Types.Mixed, required: true },
    answer: { type: String, required: true },
    explanation: { type: bilingualTextSchema, required: true },
  },
  {
    timestamps: true,
  }
);

const HistoryQuestion: Model<HistoryQuestionDocument> = mongoose.models.HistoryQuestion || mongoose.model<HistoryQuestionDocument>('HistoryQuestion', historyQuestionSchema, 'history_questions');

export default HistoryQuestion;