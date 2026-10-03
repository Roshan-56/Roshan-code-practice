# Roshan code practice

A responsive interview practice website ready for GitHub and Render. Public visitors can browse and draft code; accounts keep private saved drafts and completion history. Users can contribute original questions and earn points.

## Included

- 2,770 unique LeetCode-linked questions, plus two original guided exercises: 2,772 total at launch.
- Easy, Medium, Hard; search by title, number, and topic; topic, company, completion, and collection filters; pagination.
- Community-reported associations for 61 companies, including Google, Amazon, Microsoft, Meta, Infosys, Accenture, and others.
- Arrays, strings, searching, trees, graphs, DP, linked lists, stacks, queues, greedy, backtracking, heaps, tries, bits, SQL, and advanced topics.
- Progressive hints, gated solution reveal, per-language draft storage, and completion controls.
- 17 editor languages: Python, C, C++, Java, JavaScript, TypeScript, Go, Rust, C#, Kotlin, Swift, PHP, Ruby, SQL, Scala, Dart, and R.
- Full question details, examples, input/output, constraints, tables, and diagrams appear inside the workspace. Existing guided exercises and the new Phone Number scenario are bundled; other catalog details load from the pinned public community source on first opening and are cached in SQLite. The original LeetCode reference section appears below the question.
- Letter Combinations of a Phone Number includes a complete original practice scenario, all eight keypad mappings, three input/output examples, explanations, and constraints.
- 10 fully guided problems retain three problem-specific hints, tested Python/C reference functions, and time/space reference quizzes. Other questions provide topic coaching, external solution references, and complexity self-review. Reference languages vary externally.
- Password accounts; 10 points per valid, nonduplicate contribution; maximum 5 questions per account per day. Points are shown beside the profile and in the header.
- SQLite persistence and a Node 24 backend. No Sites-specific accounts, database, or runtime required.

**The editor does not compile, run, or automatically judge code.** Run locally or submit on LeetCode. The complexity quiz evaluates reference bounds, not the text in your draft. Account data starts fresh; the original private Sites database is not exported.

## Run locally

Install Node.js **24**. From this folder:

```bash
npm ci --include=dev
npm run build
npm start
```

Open http://localhost:3000. The database is created automatically in `data/`. An `.env` file is optional; copy `.env.example` to `.env` if you want a different port or data path. For local code changes, `npm run dev` rebuilds the frontend once and watches the backend; run `npm run build` again after frontend changes, then refresh.

## Put it on GitHub

1. Extract this ZIP and create a GitHub repository named `roshan-code-practice`. You can keep the repository private; Render can deploy authorized private repositories.
2. Put the **contents** of this folder at the repository root. `package.json`, `render.yaml`, and `README.md` should be visible at the root.
3. Upload the source, lockfile, catalog, and configuration files. Do not upload `node_modules`, runtime `data`, or your real `.env`.

With git installed, use your new repository's actual URL:

```bash
git init
git add .
git commit -m "Add Roshan code practice"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/roshan-code-practice.git
git push -u origin main
```

## Deploy on Render — recommended

1. Sign in to Render and choose **New → Blueprint**.
2. Connect the GitHub repository and let Render detect `render.yaml`.
3. Review the paid service and 1 GB persistent disk in the Blueprint, then deploy.
4. Wait for the build to succeed. Open the `https://…onrender.com` URL shown on the service dashboard.
5. Create your account on that URL. Other visitors can register their own accounts.

The included Blueprint uses a **paid web service and persistent disk** so accounts, questions, points, and drafts survive restarts and redeploys. Render's free web services do not support persistent disks. Do not remove the disk or switch to Free if you need durable user data. This package does not create any paid service automatically.

### Manual Render setup

| Setting | Value |
| --- | --- |
| Service type | Web Service, Node runtime |
| Root directory | Empty, when source is at repository root |
| Build command | `npm ci --include=dev && npm run build && npm test` |
| Start command | `npm start` |
| Node version | `24.19.0` |
| Health check | `/api/health` |
| Environment | `NODE_ENV=production`, `NODE_VERSION=24.19.0`, `DATA_DIR=/var/data` |
| Disk | Paid service, mounted at `/var/data`, 1 GB |

Render sets `PORT` and `RENDER_EXTERNAL_URL`; the server uses them automatically. For a custom domain, also set `APP_ORIGIN=https://your-domain.example` with **no trailing slash**, then redeploy. This origin must match the domain visitors use for login and saving; incorrect origins cause 403 errors. Production requires HTTPS for session cookies.

Deploy as **one instance** because this SQLite disk belongs to one service. The database is initialized at runtime, when the disk is available. Treat the disk and backups as private account data. Delete or move the disk only after making a database backup.

## Test

```bash
npm run build
npm test
python3 checks/solutions.py
```

The automated API tests verify password login, CSRF protection, private account isolation, all 17 draft languages, completions, points, duplicate handling, daily contribution limits, and catalog integrity. The solution check needs Python 3 and a C compiler; it performs 6,862 oracle comparisons across the 10 Python and 10 C references.

Optional browser checks (run the app in a second terminal first):

```bash
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/browser.cjs
```

## Data and company guidance

The “frequently reported” collection means a question has tags from at least 10 distinct companies in the imported snapshot. Sorting counts company tags, not employer question frequency or probability. Company labels are community reports from a source repository advertised as updated in June 2025. They can be stale or wrong; no employer verification is claimed. Some problems have no company tags. Read the in-app Interview guide and `docs/catalog-provenance.json`.

Catalog statements are read at runtime from the public Doocs description sections, with source attribution shown in the workspace. The original LeetCode page remains available for current requirements, reference, review, and submissions. Internet access is required for the first load of an uncached catalog question; successful details are stored in SQLite for later offline reads. The archive bundles original practice exercises and the Phone Number scenario rather than a bulk copy of source statements. Imported metadata is attributed to Doocs and the company-report dataset; see `THIRD_PARTY_NOTICES.md` and `licenses/`. The importer is `scripts/import-catalog.py`; the bundled catalog requires no network access at startup.

## Contribution and account behavior

A valid contribution has a descriptive title, difficulty, topic, and an original statement of at least 100 characters. The optional original-source link must be an HTTPS LeetCode problem URL. Seed and user questions are checked for duplicate normalized titles and canonical source URLs. Question insertion and the 10-point award happen in one database transaction. Public contributions display the author's username; drafts and progress remain private to their account. Submissions are validated structurally and **are not reviewed by a human moderator**.

Sessions expire after 24 hours. Passwords use salted scrypt hashes; session cookies are HttpOnly and Secure in production. There is no email, password recovery, code execution, or moderation dashboard in this version. Keep your account credentials somewhere safe. For a larger public deployment, add moderation, email recovery, and a managed shared database before using multiple instances.

## Project files

- `app/`: React interface and responsive styles.
- `lib/catalog.json`: interview catalog; `lib/problems.json`: guided exercises; `lib/scenarios.json`: additional complete original practice scenarios.
- `server/`: Node HTTP API, authentication, SQLite, contribution points, full-question retrieval and caching, and static hosting.
- `tests/`, `checks/`: API/UI checks and reference-code verification.
- `render.yaml`: persistent Render deployment; `.github/workflows/ci.yml`: GitHub verification.

Official deployment references: https://render.com/docs/deploy-node-express-app, https://render.com/docs/disks, https://render.com/docs/blueprint-spec.

This export is prepared for you to deploy. It has not been pushed to GitHub or deployed to Render by this package. The existing private Sites workspace is unchanged.

## Upgrade an existing project to 2.1.0

Stop the server with Ctrl+C. Copy the new source files into the existing project while retaining your `data/`, `.env`, and `.git`. The new question-cache table is created automatically; existing users, points, drafts, and completions are retained. Then run `npm ci --include=dev`, `npm run build`, `npm test`, and `npm start`, and refresh the browser.

Question content is converted into a restricted data tree and rendered through React. Script tags, event attributes, frames, unsafe links, and unsupported image hosts are filtered. Source statements are a snapshot and may differ from the current LeetCode version. If a source is temporarily unavailable, the workspace displays a retry action and the original reference link.
