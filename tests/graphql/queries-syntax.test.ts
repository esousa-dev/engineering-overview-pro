import { describe, expect, it } from 'vitest';
import { parse } from 'graphql';

import { ALL_GITHUB_GRAPHQL_OPERATIONS } from '../../src/graphql/github-queries.js';

describe('GitHub GraphQL operation strings', () => {
  it('parses every exported operation without syntax errors', () => {
    for (const doc of ALL_GITHUB_GRAPHQL_OPERATIONS) {
      expect(() => {
        parse(doc);
      }).not.toThrow();
    }
  });
});
