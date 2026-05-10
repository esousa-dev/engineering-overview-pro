// ============================================================
// GitHub GraphQL operation strings (single source of truth).
// Validated in CI via tests/graphql/queries-syntax.test.ts
// ============================================================

export const STATS_QUERY = `
  query userStats($login: String!) {
    user(login: $login) {
      name
      login
      repositories(
        first: 100
        ownerAffiliations: OWNER
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        totalCount
        nodes {
          stargazerCount
          isArchived
          isFork
          isPrivate
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
      pullRequests(first: 1) {
        totalCount
      }
      issues(first: 1) {
        totalCount
      }
      contributionsCollection {
        totalCommitContributions
        restrictedContributionsCount
        totalRepositoriesWithContributedCommits
      }
      repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
        totalCount
      }
      followers(first: 1) {
        totalCount
      }
    }
  }
`;

export const TOP_LANGS_QUERY = `
  query userInfo($login: String!, $after: String) {
    user(login: $login) {
      repositories(ownerAffiliations: OWNER, first: 100, after: $after, isFork: false) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          isArchived
          isFork
          isPrivate
          languages(first: 100, orderBy: {field: SIZE, direction: DESC}) {
            edges {
              size
              node {
                color
                name
              }
            }
          }
        }
      }
    }
  }
`;

export const DEVOPS_QUERY = `
  query devopsStats($login: String!) {
    user(login: $login) {
      repositories(first: 100, ownerAffiliations: [OWNER, COLLABORATOR], orderBy: { field: PUSHED_AT, direction: DESC }) {
        nodes {
          name
          isPrivate
          isArchived
          updatedAt
          description
          repositoryTopics(first: 1) { totalCount }
          owner { login }
          workflows: object(expression: "HEAD:.github/workflows") {
            ... on Tree { entries { name } }
          }
          dependabotYml: object(expression: "HEAD:.github/dependabot.yml") {
            ... on Blob { byteSize }
          }
          dependabotYaml: object(expression: "HEAD:.github/dependabot.yaml") {
            ... on Blob { byteSize }
          }
          defaultBranchRef {
            target {
              ... on Commit {
                statusCheckRollup {
                  state
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const STREAK_QUERY = `
  query userInfo($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      createdAt
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

export const ACTIVITY_MAIN_QUERY = `
  query activityStats($login: String!, $after: String) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              contributionLevel
              date
            }
          }
        }
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoriesWithContributedCommits
      }
      repositories(first: 100, ownerAffiliations: OWNER, isFork: false, after: $after, orderBy: {field: STARGAZERS, direction: DESC}) {
        pageInfo { hasNextPage endCursor }
        nodes { isFork isArchived stargazerCount forkCount }
      }
    }
  }
`;

export const ACTIVITY_PAGINATION_QUERY = `
  query repoPagination($login: String!, $after: String) {
    user(login: $login) {
      repositories(first: 100, ownerAffiliations: OWNER, isFork: false, after: $after, orderBy: {field: STARGAZERS, direction: DESC}) {
        pageInfo { hasNextPage endCursor }
        nodes { isFork isArchived stargazerCount forkCount }
      }
    }
  }
`;

export const PINNED_REPOS_QUERY = `
  query pinnedRepos($login: String!) {
    user(login: $login) {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            owner {
              login
            }
            description
            primaryLanguage {
              name
              color
            }
            stargazerCount
            forkCount
            isArchived
            isFork
            isPrivate
          }
        }
      }
    }
  }
`;

export const REPO_INFO_QUERY = `
  query repoInfo($login: String!, $repo: String!) {
    repository(owner: $login, name: $repo) {
      name
      owner {
        login
      }
      description
      primaryLanguage {
        name
        color
      }
      stargazerCount
      forkCount
      isArchived
      isFork
      isPrivate
    }
  }
`;

/** All operations parsed in CI to catch syntax regressions. */
export const ALL_GITHUB_GRAPHQL_OPERATIONS: readonly string[] = [
  STATS_QUERY,
  TOP_LANGS_QUERY,
  DEVOPS_QUERY,
  STREAK_QUERY,
  ACTIVITY_MAIN_QUERY,
  ACTIVITY_PAGINATION_QUERY,
  PINNED_REPOS_QUERY,
  REPO_INFO_QUERY,
];
