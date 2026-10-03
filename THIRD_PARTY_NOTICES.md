# Third-party notices

Application source and original guided exercises: MIT, see LICENSE.

## Catalog metadata

`lib/catalog.json` contains factual titles, levels, topics, original LeetCode URLs, and community company associations. Full question corpora are not bundled in this archive. LeetCode is an independent service and this app is not affiliated with it. The in-app question reader accesses description sections from the public Doocs source at runtime and stores successful reads in a local SQLite cache; source attribution is displayed with the content. The original LeetCode link is retained for reference and submissions.

Titles, topic mapping, and difficulty metadata are adapted from [Doocs LeetCode](https://github.com/doocs/leetcode), snapshot `8c570e97ba7b0320392853a8769a6fcb2c277bfa`, under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Attribution: Doocs contributors. Adaptations: selected non-premium problems represented in the company-report snapshot, normalized topic whitespace, fallback “Uncategorized” where neither source supplies a topic, and mapping to local guided exercises. Preserve this attribution and license when redistributing derived catalog metadata. Full license: `licenses/CC-BY-SA-4.0.txt`.

Company associations and source links are factual metadata extracted from public CSVs in [liquidslr/leetcode-company-wise-problems](https://github.com/liquidslr/leetcode-company-wise-problems), snapshot `03850eb5d16892514491cf1381c32ec0330a2719`. Repository advertised update: 20 June 2025. The repository has no explicit software license at this snapshot. Only selected factual metadata is included; original CSVs, acceptance-rate values, frequency scores, and problem statements are not redistributed. Company associations are community reported, not employer verified. They are not guaranteed current. See `docs/catalog-provenance.json` for counts and exact snapshots.

Linked Doocs reference solutions remain on the external source site. They are not copied into the catalog or verified by this app.

## Components

The included UI components originate from shadcn/ui (MIT): https://github.com/shadcn-ui/ui. Radix UI, React, Tailwind CSS, and Lucide icons retain their upstream licenses. Dependencies installed through npm include their own notices. The vendored shadcn Tailwind stylesheet's full notice is included at `vendor/shadcn-tailwind-4.13.0.LICENSE.md`.

MIT component attribution: Copyright (c) 2023 shadcn. Permission is granted to use, copy, modify, merge, publish, distribute, sublicense, and sell copies, subject to inclusion of this copyright and permission notice. The software is provided “AS IS”, without warranty; authors are not liable for claims or damages. See https://github.com/shadcn-ui/ui/blob/main/LICENSE for the complete license.

## Runtime question reader

`server/statements.mjs` reads question-description sections from the pinned public Doocs snapshot; it does not fetch code solutions into the question panel. Statements, examples, tables, and constraints are displayed with a source link and the repository's stated CC BY-SA 4.0 attribution. Original source content retains its original ownership and applicable terms; the application MIT license does not apply to fetched content.

The Letter Combinations of a Phone Number scenario in `lib/scenarios.json` is newly authored practice wording and examples based on the linked task requirements. Its keypad mapping, input/output rules, and constraints are factual task details.

Marked (https://github.com/markedjs/marked) and parse5 (https://github.com/inikulin/parse5) are MIT-licensed parsing dependencies; their installed npm packages include the upstream licenses.
