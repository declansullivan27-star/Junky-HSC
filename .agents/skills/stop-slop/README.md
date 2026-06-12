# stop-slop

A Claude Code skill that strips AI filler, buzzwords, and structural bloat from text — and rewrites it to sound like a human.

## Usage

```
/stop-slop [paste text or point to a file]
```

## What it catches
- AI affirmations ("Certainly!", "Great question!", "I hope this helps")
- Hedge stacking ("It's worth noting that", "That being said")
- Buzzword inflation ("seamless", "robust", "leverage", "delve into")
- Vague nouns ("solutions", "offerings", "ecosystem", "space")
- Structural bloat (echo openers, fake three-part structure, summary-that-repeats-body)
- Passive voice defaults, disclaimer walls, orphan headers

## References
- `references/phrases.md` — flagged words and phrases
- `references/structures.md` — structural patterns to avoid
- `references/examples.md` — before/after rewrites
