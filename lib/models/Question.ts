import mongoose, { Document, Model, Schema } from 'mongoose';

export type QuestionItem = {
  id: string;
  exam?: string;
  subject: string;
  topic: string;
  question: string;
  options: Record<string, string>;
  answer: string;
  explanation: string;
};

export interface QuestionDocument extends QuestionItem, Document {}

const questionSchema = new Schema<QuestionDocument>(
  {
    id: { type: String, required: true, unique: true },
    exam: { type: String },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    question: { type: String, required: true },
    options: { type: Schema.Types.Mixed, required: true },
    answer: { type: String, required: true },
    explanation: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Question: Model<QuestionDocument> = mongoose.models.Question || mongoose.model<QuestionDocument>('Question', questionSchema);

export default Question;
