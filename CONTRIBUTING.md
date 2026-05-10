# Contributing to engineering-overview-pro

Thank you for your interest in improving this project. This document explains how to work on the codebase and propose changes.

## Prerequisites

- Node.js 22+
- npm (ships with Node)

## Local workflow

1. Fork the repository and clone your fork.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and set at least `PAT_1` for integration-style manual testing.
4. Run checks before opening a pull request (same as CI):

   ```bash
   npm run verify
   ```

## Pull requests

- Keep changes focused on a single concern when possible.
- Describe **what** changed and **why** in the PR description.
- If you add user-facing behavior, update `README.md` (or linked docs) in the same PR.
- Ensure CI passes (GitHub Actions runs lint, typecheck, tests, and build).

## Style

- Match existing TypeScript and formatting conventions; run `npm run format` where appropriate.
- Prefer clear names and small, testable units over large refactors unless discussed first.

## Questions

Open a GitHub issue if you are unsure whether a change fits the project goals.
