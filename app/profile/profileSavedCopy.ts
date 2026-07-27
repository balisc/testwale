import type { ProfileLanguage } from './profileCopy';
import type { SavedMistakeStatus } from '@/lib/profileSavedTypes';

export type ProfileSavedCopy = ReturnType<typeof getProfileSavedCopy>;

export function getProfileSavedCopy(language: ProfileLanguage) {
  if (language === 'hi') {
    return {
      title: 'रिविज़न और सेव की गई सामग्री',
      subtitle: 'अपनी गलतियों को दोहराएँ और सेव की गई सामग्री पर वापस जाएँ',
      revisionQueue: 'समीक्षा कतार',
      questionsToReview: 'समीक्षा के लिए प्रश्न',
      scheduleExplanation:
        'रिविज़न शेड्यूल उपलब्ध होने पर QuestionWale समीक्षा तिथियाँ व्यवस्थित करेगा।',
      reviewNext: 'अगला समीक्षा करें',
      browseSubjects: 'विषय देखें',
      queueSummary: (total: number) => `${total} अनुत्तरित गलतियाँ`,
      mistakeRecovery: 'गलती सुधार',
      recoveryRate: 'सुधार दर',
      recoveryHint: 'प्रथम-प्रयास गलतियाँ जिन्हें बाद में सही पुनः प्रयास से सुधारा गया',
      recoveredOf: (recovered: number, total: number) => `${total} में से ${recovered} सुधरीं`,
      stillDue: (count: number) => `${count} अभी बाकी`,
      improvedThisWeek: (count: number) => `${count} इस सप्ताह सुधरीं`,
      noMistakesRecovery: 'सुधार की प्रतीक्षा में कोई गलती नहीं',
      noFirstAttemptMistakes: 'अभी तक कोई प्रथम-प्रयास गलती नहीं',
      mistakesToReview: 'समीक्षा के लिए गलतियाँ',
      caughtUp: 'आप अप-टू-डेट हैं',
      caughtUpHint: 'कोई अनुत्तरित गलती समीक्षा की प्रतीक्षा में नहीं है।',
      allRecovered: 'सभी गलतियाँ सुधर चुकी हैं',
      allRecoveredHint: 'बाद के सही पुनः प्रयासों से आपकी गलतियाँ सुधर गईं।',
      noMistakesList: 'समीक्षा के लिए कोई गलती नहीं',
      review: 'समीक्षा',
      statusRecentlyMissed: 'हाल में छूटा',
      statusIncorrectTwice: 'दो बार गलत',
      statusUnresolved: 'अनुत्तरित गलती',
      savedLearning: 'सेव की गई सामग्री',
      bookmarks: 'बुकमार्क',
      notes: 'नोट्स',
      reportedQuestions: 'रिपोर्ट किए प्रश्न',
      reportedHint: 'रिपोर्ट की गई समस्याएँ — बुकमार्क नहीं',
      noRecentlyViewed: 'हाल में देखा गया — उपलब्ध नहीं',
      recentSavedItems: 'हाल की सेव की गई सामग्री',
      open: 'खोलें',
      nothingSaved: 'अभी कुछ सेव नहीं किया',
      nothingSavedHint:
        'अध्ययन के दौरान उपयोगी प्रश्न बुकमार्क करें या नोट्स जोड़ें — वे यहाँ दिखेंगे।',
      bookmarked: 'बुकमार्क किया',
      noteUpdated: 'नोट अपडेट',
      noteCreated: 'नोट बनाया',
      practiceMore: 'अभ्यास जारी रखें',
      loadError: 'सेव की गई सामग्री लोड नहीं हो सकी। कृपया पुनः प्रयास करें।',
      retry: 'पुनः प्रयास',
      newUserHint: 'अभ्यास शुरू करें — गलतियाँ और सेव की गई सामग्री यहाँ दिखेगी।',
      queueAccessible: (label: string, count: number) => `${label}: ${count}`,
      recoveryAccessible: (percent: number | null, unresolved: number) =>
        percent != null
          ? `${percent}% सुधार दर, ${unresolved} अनुत्तरित`
          : `कोई प्रथम-प्रयास गलती नहीं`,
    } as const;
  }

  return {
    title: 'Revision & Saved',
    subtitle: 'Review your mistakes and return to saved learning',
    revisionQueue: 'Revision queue',
    questionsToReview: 'Questions to review',
    scheduleExplanation:
      'QuestionWale will organise review dates when revision scheduling is available.',
    reviewNext: 'Review next',
    browseSubjects: 'Browse subjects',
    queueSummary: (total: number) => `${total} unresolved mistakes`,
    mistakeRecovery: 'Mistake recovery',
    recoveryRate: 'Recovery rate',
    recoveryHint: 'First-attempt mistakes later corrected by a genuine retry',
    recoveredOf: (recovered: number, total: number) => `${recovered} of ${total} corrected`,
    stillDue: (count: number) => `${count} still due`,
    improvedThisWeek: (count: number) => `${count} improved this week`,
    noMistakesRecovery: 'No mistakes waiting for recovery',
    noFirstAttemptMistakes: 'No first-attempt mistakes yet',
    mistakesToReview: 'Mistakes to review',
    caughtUp: 'You are caught up',
    caughtUpHint: 'No unresolved mistakes are waiting for review.',
    allRecovered: 'All mistakes recovered',
    allRecoveredHint: 'Your first-attempt mistakes were corrected by later retries.',
    noMistakesList: 'No mistakes to review',
    review: 'Review',
    statusRecentlyMissed: 'Recently missed',
    statusIncorrectTwice: 'Incorrect twice',
    statusUnresolved: 'Unresolved mistake',
    savedLearning: 'Saved learning',
    bookmarks: 'Bookmarked questions',
    notes: 'Notes',
    reportedQuestions: 'Reported questions',
    reportedHint: 'Questions you flagged — not bookmarks',
    noRecentlyViewed: 'Recently viewed — not available',
    recentSavedItems: 'Recent saved items',
    open: 'Open',
    nothingSaved: 'Nothing saved yet',
    nothingSavedHint: 'Bookmark useful questions or add notes while studying to find them here.',
    bookmarked: 'Bookmarked',
    noteUpdated: 'Note updated',
    noteCreated: 'Note created',
    practiceMore: 'Continue practice',
    loadError: 'Could not load saved data. Please try again.',
    retry: 'Retry',
    newUserHint: 'Start practicing — mistakes and saved items will appear here.',
    queueAccessible: (label: string, count: number) => `${label}: ${count}`,
    recoveryAccessible: (percent: number | null, unresolved: number) =>
      percent != null
        ? `${percent}% recovery rate, ${unresolved} unresolved`
        : 'No first-attempt mistakes',
  } as const;
}

export function mistakeStatusLabel(
  copy: ProfileSavedCopy,
  status: SavedMistakeStatus,
): string {
  switch (status) {
    case 'recently_missed':
      return copy.statusRecentlyMissed;
    case 'incorrect_twice':
      return copy.statusIncorrectTwice;
    default:
      return copy.statusUnresolved;
  }
}
