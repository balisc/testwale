export type LocalizedText = string | { en?: string; hi?: string; [key: string]: any };

type QuestionOptions =
  | Record<string, LocalizedText>
  | {
      en?: LocalizedText[];
      hi?: LocalizedText[];
      [key: string]: any;
    };

export type QuestionItem = {
  id: string;
  exam?: string;
  askedIn?: string;
  asked_in?: string;
  subject?: string | LocalizedText;
  topic?: string | LocalizedText;
  question?: LocalizedText;
  options?: QuestionOptions;
  answer?: string;
  explanation?: LocalizedText;
  question_text?: LocalizedText;
  question_en?: string;
  question_hi?: string;
  explanation_text?: LocalizedText;
  options_en?: LocalizedText[];
  options_hi?: LocalizedText[];
  [key: string]: any;
};
