# stop-slop

Rewrite AI-generated or sloppy text to sound like a real human wrote it. Remove filler, hedging, corporate buzzwords, and structural bloat. Make it direct, specific, and earned.

## When to use
- Reviewing copy before publishing
- Cleaning up AI-drafted emails, website text, docs, or marketing
- Auditing a file or block of text for slop density

## How to run

1. Read `references/phrases.md` — flag every hit in the target text
2. Read `references/structures.md` — flag every structural pattern
3. Read `references/examples.md` — use as a rewrite style guide
4. Rewrite the flagged passages. Rules:
   - Cut filler entirely — don't replace it with different filler
   - Replace vague with specific (don't say "solutions", say what the solution does)
   - Replace passive voice with active wherever it matters
   - If a sentence can be cut without losing meaning, cut it
   - Match the voice and register of the surrounding text
5. Return the rewritten version with a short diff summary of what changed

## What not to do
- Don't add new buzzwords to fix old ones
- Don't over-explain the changes — show the rewrite, note the key cuts
- Don't make every sentence short — vary rhythm; just earn every word
- Don't sterilize personality out of text that has good voice already
