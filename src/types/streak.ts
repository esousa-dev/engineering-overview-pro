// Types for the streak payload

export interface StreakData {
  totalContributions: number;
  firstContribution: string;
  currentStreak: {
    start: string;
    end: string;
    length: number;
  };
  longestStreak: {
    start: string;
    end: string;
    length: number;
  };
  theme: string; // The selected theme or override params combined into a theme name
}
