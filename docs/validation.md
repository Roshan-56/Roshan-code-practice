# Validation

- `npm ci --include=dev`: passed, using the included lockfile.
- `npm run build`: TypeScript and production Vite build passed.
- `npm test`: all 17 API/catalog/content-rendering tests passed; these cover account isolation, authentication, CSRF, persistence for 17 languages, completion controls, question contributions, duplicate points prevention, and daily caps.
- `python3 checks/solutions.py`: 6,862 independent oracle comparisons passed across all 10 Python and 10 compiled C reference functions.
- Responsive layouts are included for desktop and mobile. Live browser validation was blocked by the execution environment; visual and browser UI checks are not claimed as completed. An optional Playwright workflow is included in `tests/browser.cjs` and documented in README.md.
- The source project has not been deployed to Render or uploaded to GitHub. No production accounts, secrets, or private Sites data are included.

Dependency update: Vite upgraded from 8.0.13 to 8.3.2 to address the reported Windows development-server advisories. Production build and API/catalog tests passed after the update. npm audit reports zero known vulnerabilities at validation time.

Version 2.1.0 question details: full-source extraction, HTML filtering, source cache persistence, public detail API, keypad scenario, example outputs, SQL schemas, and React markup tests all pass. Ten representative questions were retrieved from the live source, covering arrays, graph cloning, tree traversal and validation, design operations, SQL, dynamic programming, and searching. The original reference footer was checked to render after the question constraints. Native visual browser checks remain blocked as noted above.
