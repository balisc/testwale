'use server';

import clientPromise from '../../lib/mongodb';

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

export async function getUPPCS2025Questions(): Promise<QuestionItem[]> {
  const client = await clientPromise;
  const db = client.db('testwale_db');
  const collection = db.collection<QuestionItem>('questions');

  const geographyQuestion = await collection.findOne(
    { subject: { $regex: /geography/i } },
    { projection: { _id: 0 } }
  );

  if (!geographyQuestion) {
    return [];
  }

  return [geographyQuestion];
}
