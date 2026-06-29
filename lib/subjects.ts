export type SubjectConfig = {
  key: string;
  table: string;
  label: string;
  labelHi: string;
};

export const SUBJECTS = [
  { key: 'history', table: 'history_questions', label: 'History', labelHi: 'इतिहास' },
  { key: 'science', table: 'science_questions', label: 'Science', labelHi: 'विज्ञान' },
  { key: 'polity', table: 'polity_questions', label: 'Polity', labelHi: 'राजव्यवस्था' },
  { key: 'economics', table: 'economics_questions', label: 'Economics', labelHi: 'अर्थशास्त्र' },
  { key: 'geography', table: 'geography_questions', label: 'Geography', labelHi: 'भूगोल' },
  { key: 'general-knowledge', table: 'general_knowledge_questions', label: 'General Knowledge', labelHi: 'सामान्य ज्ञान' },
  { key: 'math', table: 'math_questions', label: 'Math', labelHi: 'गणित' },
  { key: 'current-affairs', table: 'current_affairs_questions', label: 'Current Affairs', labelHi: 'वर्तमान मामले' },
  { key: 'reasoning', table: 'reasoning_questions', label: 'Reasoning', labelHi: 'तर्क' },
] as const satisfies readonly SubjectConfig[];

export const SUBJECT_KEYS = SUBJECTS.map((subject) => subject.key);
export const SUBJECT_TABLES = Object.fromEntries(SUBJECTS.map((subject) => [subject.key, subject.table]));
export const SUBJECT_LABELS = Object.fromEntries(SUBJECTS.map((subject) => [subject.key, subject.label]));

export function getSubjectConfig(subjectKey: string) {
  return SUBJECTS.find((subject) => subject.key === subjectKey);
}
