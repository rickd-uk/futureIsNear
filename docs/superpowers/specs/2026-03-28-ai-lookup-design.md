# AI Lookup — Design Spec
**Date:** 2026-03-28

## Overview

Add a `✨ AI` button to both link submission modals (admin `AddLinkModal` and user `UserSubmitLinkModal`) that uses the Claude API to suggest title, description, author, and category for a given URL. Keeps API costs low by sending only compact extracted metadata, not raw HTML.

---

## Backend

### 1. Upgrade `/api/fetch-title`

Extend the existing endpoint to extract additional metadata from the page HTML before returning. All new fields are optional (null if not found).

**New extracted fields:**
- `description` — `og:description`, `meta[name=description]`, `twitter:description`, `schema.org description`
- Additional author sources — `[rel=author]` href text, byline class patterns (`byline`, `author`, `writer`), `twitter:creator`
- `publishedDate` — `article:published_time`, `schema.org datePublished`

Return shape (extended):
```json
{ "title": "...", "author": "...", "description": "...", "publishedDate": "..." }
```

### 2. New `POST /api/ai-lookup`

Calls Claude API (`claude-haiku-4-5` for cost efficiency) with a compact structured prompt.

**Request body:**
```json
{
  "url": "https://...",
  "title": "...",
  "description": "...",
  "author": "...",
  "categories": ["Tech", "Science", "..."]
}
```

**Prompt strategy:** Send only the extracted fields (not HTML). Instruct Claude to:
- Return valid JSON only
- Pick `category` strictly from the provided list (or null if none fits)
- Keep description to 1–2 sentences
- Leave a field null if uncertain

**Response:**
```json
{ "title": "...", "description": "...", "author": "...", "category": "..." }
```

**Auth:** Requires user or admin JWT (same as other protected endpoints).

---

## Frontend

### UI

- A `✨ AI` button added to the URL field row in both modals (alongside the existing paste/clear button)
- Disabled until a URL is entered
- Shows a spinner while the AI call is in flight
- On error: small inline error message below the URL field

### Data flow

1. User enters/pastes URL → existing `fetchTitle()` runs as before (fast, free)
2. User clicks `✨ AI` → calls `/api/ai-lookup` with already-fetched metadata + full category list
3. Results populate the existing `suggestedTitle`, `suggestedAuthor`, `suggestedCategory` state, plus a new `suggestedDescription` state
4. Existing `↑ Use: ...` hints and **✓ Accept all** button handle display and acceptance automatically
5. Fields already filled by the user show as hints only — never overwritten

### No new components

Reuses existing suggestion infrastructure in both modals. Only additions: the button, a `suggestedDescription` state variable, and the `↑ Use:` hint wired to the description textarea.

---

## Constraints

- Model: `claude-haiku-4-5` (cheapest, sufficient for structured extraction)
- Payload to Claude: ~200–400 tokens per call (extracted fields only, no HTML)
- User-initiated only (no auto-fire on paste) — controls cost
- Category must be selected from the app's existing category list
