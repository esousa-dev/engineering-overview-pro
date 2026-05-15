// ============================================================
// engineering-overview-pro — GitHub stats card types
// Central type definitions (single source of truth)
// ============================================================

// --- Theme ---

export interface ThemeConfig {
  readonly bg: string;
  readonly surface: string;
  readonly border: string;
  readonly title: string;
  readonly text: string;
  readonly icon: string;
  readonly muted: string;
  readonly rankCircle: string;
  readonly progressBar: string;
  readonly red: string;
  readonly orange: string;
  readonly yellow: string;
  readonly green: string;
  readonly cyan: string;
  readonly purple: string;
  readonly pink: string;
}

export interface ThemeOverrides {
  readonly bgColor?: string | undefined;
  readonly textColor?: string | undefined;
  readonly titleColor?: string | undefined;
  readonly iconColor?: string | undefined;
  readonly borderColor?: string | undefined;
}

// --- Card Options ---

export interface CardOptions {
  readonly theme: ThemeConfig;
  readonly hideBorder: boolean;
  readonly borderRadius: number;
  readonly hideTitle: boolean;
  readonly customTitle?: string | undefined;
  readonly disableAnimations: boolean;
  readonly locale: SupportedLocale;
  readonly width: number;
  readonly height: number;
}

// --- Locale ---

export type SupportedLocale = 'en' | 'pt-br' | 'es';

export type TranslationKey =
  | 'stats.title'
  | 'stats.stars'
  | 'stats.commits'
  | 'stats.prs'
  | 'stats.issues'
  | 'stats.contribs'
  | 'stats.rank'
  | 'top-langs.title'
  | 'streak.title'
  | 'streak.current'
  | 'streak.longest'
  | 'streak.total'
  | 'activity.title'
  | 'pin.stars'
  | 'pin.forks'
  | 'devops.title'
  | 'wakatime.title'
  | 'wakatime.totalTime'
  | 'wakatime.dailyAverage'
  | 'wakatime.bestDay'
  | 'coding-stats.title'
  | 'coding-stats.totalTime'
  | 'coding-stats.dailyAverage'
  | 'coding-stats.sessions'
  | 'coding-stats.projects'
  | 'coding-stats.disclaimer'
  | 'error.title'
  | 'error.generic'
  | 'error.user-not-found'
  | 'error.rate-limit';

export type TranslationMap = Record<TranslationKey, string>;

// --- User Stats ---

export interface UserStats {
  readonly username: string;
  readonly totalStars: number;
  readonly totalCommits: number;
  readonly totalPRs: number;
  readonly totalIssues: number;
  readonly totalContributions: number;
  readonly totalRepos: number;
  readonly activeRepos: number;
  readonly followers: number;
  readonly rank: RankInfo;
}

export interface RankInfo {
  readonly level: RankLevel;
  readonly percentile: number;
  readonly score: number;
}

export type RankLevel = 'S+' | 'S' | 'A++' | 'A+' | 'A' | 'B+' | 'B' | 'C';

// --- Repository ---

export interface RepoInfo {
  readonly name: string;
  readonly nameWithOwner: string;
  readonly description: string;
  readonly primaryLanguage: LanguageNode | null;
  readonly stargazerCount: number;
  readonly forkCount: number;
  readonly isArchived: boolean;
  readonly isFork: boolean;
  readonly isPrivate: boolean;
  readonly defaultBranchName: string | null;
}

export interface LanguageNode {
  readonly name: string;
  readonly color: string;
}

// --- Language Data ---

export interface LanguageData {
  readonly name: string;
  readonly color: string;
  readonly size: number;
  readonly percentage: number;
  readonly count: number;
}

// --- Streak Data ---

export interface StreakData {
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly totalContributions: number;
  readonly currentStreakStartDate: string;
  readonly currentStreakEndDate: string;
  readonly longestStreakStartDate: string;
  readonly longestStreakEndDate: string;
}

// --- Activity Data ---

export interface ActivityData {
  readonly weeks: ReadonlyArray<ContributionWeek>;
  readonly totalContributions: number;
  readonly stats: {
    readonly commits: number;
    readonly issues: number;
    readonly pullRequests: number;
    readonly reviews: number;
    readonly repos: number;
  };
  readonly languages: ReadonlyArray<{
    readonly name: string;
    readonly color: string;
    readonly size: number;
    readonly percentage: number;
  }>;
  readonly summary: {
    readonly totalStars: number;
    readonly totalForks: number;
  };
}

export interface ContributionWeek {
  readonly contributionDays: ReadonlyArray<ContributionDay>;
}

export interface ContributionDay {
  readonly date: string;
  readonly contributionCount: number;
  readonly contributionLevel: ContributionLevel;
}

export type ContributionLevel =
  | 'NONE'
  | 'FIRST_QUARTILE'
  | 'SECOND_QUARTILE'
  | 'THIRD_QUARTILE'
  | 'FOURTH_QUARTILE';

// --- Pin Card ---

export interface PinData {
  readonly name: string;
  readonly owner: string;
  readonly description: string;
  readonly primaryLanguage: LanguageNode | null;
  readonly stargazerCount: number;
  readonly forkCount: number;
  readonly isArchived: boolean;
  readonly isFork: boolean;
  readonly isPrivate: boolean;
}

// --- DevOps Card ---

export type CodeFactorGrade = string;

export interface DevOpsData {
  readonly ciCd: {
    readonly hasActionsCount: number;
    readonly totalRuns: number;
    readonly successRate: number;
    readonly grade: RankLevel;
  };
  readonly security: {
    readonly dependabotCount: number;
    readonly codeFactorAPlusCount: number;
    readonly codeFactorTotal: number;
    readonly advisories: number;
    readonly grade: RankLevel;
  };
  readonly organization: {
    readonly totalRepos: number;
    readonly archivedRepos: number;
    readonly wellOrganizedCount: number;
    readonly grade: RankLevel;
  };
  readonly overallGrade: RankLevel;
}

// --- Coding Stats Card ---

export interface CodingStatsData {
  readonly totalSeconds: number;
  readonly dailyAverageSeconds: number;
  readonly sessions: number;
  readonly activeDays: number;
  readonly languages: ReadonlyArray<CodingStatsLanguage>;
  readonly projects: ReadonlyArray<CodingStatsProject>;
}

export interface CodingStatsLanguage {
  readonly name: string;
  readonly percent: number;
  readonly seconds: number;
  readonly color: string;
}

export interface CodingStatsProject {
  readonly name: string;
  readonly pushCount: number;
  readonly estimatedSeconds: number;
  readonly lastActivity: string; // ISO date string
  readonly color: string;
}

// --- Cache ---

export interface CacheConfig {
  readonly stdTTL: number;
  readonly checkperiod: number;
  readonly maxKeys: number;
}

// --- Token State ---

export interface TokenState {
  readonly token: string;
  readonly remaining: number;
  readonly resetAt: number;
}

// --- Linguist ---

export interface LinguistLanguage {
  readonly name: string;
  readonly color: string;
  readonly type: 'programming' | 'markup' | 'data' | 'prose';
  readonly extensions: ReadonlyArray<string>;
}

// --- GraphQL Pagination ---

export interface PageInfo {
  readonly hasNextPage: boolean;
  readonly endCursor: string | null;
}

// --- Error ---

export interface CardError {
  readonly message: string;
  readonly type: 'user-not-found' | 'rate-limit' | 'generic';
}
