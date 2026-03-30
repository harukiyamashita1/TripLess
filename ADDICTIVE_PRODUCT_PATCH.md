# Make TripLess addictive: product patch

This patch focuses on **retention loops**, **repeat engagement**, and **shareable delight** without becoming spammy or manipulative. The goal is to make users want to come back because the product becomes more personally useful and rewarding over time.

It adds a roadmap and concrete implementation patterns for:
- favorites / pinning journeys
- recently viewed journeys
- streak-friendly planning prompts
- smart progress states
- duplicate journey
- lightweight personalization memory
- shareable moments
- delight surfaces that reward exploration

---

## 1) Add `src/types.ts` extensions

Add the following optional fields to `Trip`:

```ts
isFavorite?: boolean;
lastViewedAt?: string;
createdAt?: string;
```

### Why
These power:
- pinning / favorites
- recently viewed sorting
- recency-based engagement
- “continue planning” prompts

---

## 2) Upgrade the trip store with product-memory behaviors

### New store capabilities
Add these actions to `TripContextType`:

```ts
favoriteTrip: (tripId: string) => void;
unfavoriteTrip: (tripId: string) => void;
markTripViewed: (tripId: string) => void;
duplicateTrip: (tripId: string) => void;
```

### Behavior

#### `favoriteTrip`
- marks a journey as pinned/favorite
- favorites sort to the top on Home

#### `markTripViewed`
- writes `lastViewedAt`
- updates “Recently viewed” section

#### `duplicateTrip`
- copies an existing journey with a new ID
- great for “Tokyo v1 / Tokyo v2” behavior
- extremely sticky because users iterate instead of starting over

---

## 3) Home page: create retention-driving sections

Split the current single list into three sections:

### A. Continue Planning
Show journeys that were viewed recently or created recently.

Display copy:
- `Continue Planning`
- `Pick up where you left off.`

### B. Favorites
Show pinned journeys first.

Display copy:
- `Favorites`
- `Keep your top journeys close.`

### C. All Journeys
Fallback list of everything else.

### Why this matters
This transforms the home screen from a static archive into a **return surface**.
Users no longer just “see old trips.” They get nudged into the next action.

---

## 4) Add quick actions on each journey card

Replace the single delete action with a premium menu containing:

- `Favorite / Unfavorite`
- `Duplicate`
- `Delete`
- later: `Rename`
- later: `Share`

### Why
This makes each journey feel like a living object, not a dead artifact.
That increases emotional ownership.

---

## 5) Add “Duplicate Journey” implementation

### UX copy
- `Duplicate Journey`
- success toast: `Journey duplicated`
- description: `A copy is ready to customize.`

### Example duplication logic
```ts
const duplicateTrip = (tripId: string) => {
  setTrips((prev) => {
    const source = prev.find((t) => t.id === tripId);
    if (!source) return prev;

    const copy = {
      ...source,
      id: crypto.randomUUID(),
      destination: `${source.destination} Copy`,
      createdAt: new Date().toISOString(),
      lastViewedAt: new Date().toISOString(),
      isFavorite: false,
    };

    return [copy, ...prev];
  });
};
```

### Why duplication is addictive
Users love branching and remixing. Once they can duplicate, they start testing:
- budget version
- premium version
- rainy-day version
- foodie version

That creates **repeat sessions** naturally.

---

## 6) Add a “planning progress” layer

Create a lightweight derived status for each journey:

### Statuses
- `Fresh` → newly created
- `Exploring` → viewed but not refined
- `Refined` → edited at least once
- `Ready` → favorite/pinned

### UI display
A subtle badge on the card:
- `Fresh`
- `Ready`
- `Recently viewed`

### Why
Progress states create gentle game-like momentum without feeling childish.
People like moving things from “idea” to “ready.”

---

## 7) Add “Recently viewed” memory

Whenever a user opens a trip detail page, call:

```ts
markTripViewed(trip.id)
```

Then sort recent trips by `lastViewedAt` descending.

### Why
The easiest retention win is helping people resume intent.
If they come back, they should instantly see what they were thinking about.

---

## 8) Add “nudge chips” on the home page

Above `Continue Planning`, show 1–3 action chips based on state.

### Examples
- `Refine your Tokyo trip`
- `Try a cheaper version`
- `Duplicate and compare`
- `Pin your favorite journey`

### Why
These are lightweight prompts that reduce blank-screen friction.
The user doesn’t have to decide what to do next.

---

## 9) Add emotional ownership moments

Use premium microcopy that makes journeys feel personal:

### Better wording
- `Your Journeys` → keep
- `Continue Planning`
- `Ready when you are`
- `Your favorite escapes`
- `Make another version`
- `Keep exploring`

### Why
Subtle wording matters. It shifts the feeling from “tool” to “companion.”

---

## 10) Add shareable delight loops

### Near-term feature
Add a `Share Journey` action that copies a summary card or link.

### First version
- copy itinerary summary to clipboard
- copy top 3 highlights
- optional image card later

### Why
Sharing is a retention multiplier. A shared journey becomes social proof and an acquisition loop.

---

## 11) Add a lightweight “memory” model

Store a small user preference object in localStorage:

```ts
interface UserPreferences {
  preferredTripTypes?: string[];
  favoriteDestinations?: string[];
  lastBudgetMode?: 'style' | 'exact';
  lastPace?: 'relaxed' | 'medium' | 'fast';
}
```

Use it to prefill Create Trip.

### Why
Personalization increases return rate because the product starts feeling familiar and fast.

---

## 12) Add “surprise & reward” moments

Examples:
- after creating 3 journeys: `You’re building quite the collection.`
- after duplicating: `Try a premium version next.`
- after favoriting: `Pinned for easy access.`

### Why
These tiny acknowledgements make product use feel rewarding.
Not everything has to be a feature. Some of it is just emotional feedback.

---

## 13) Highest-impact build order

### Phase A — fastest retention wins
1. favorites / pinning
2. recently viewed
3. duplicate journey
4. continue planning section

### Phase B — premium engagement
5. quick actions menu
6. progress badges
7. nudge chips
8. user preference memory

### Phase C — growth loop
9. share journey
10. exported share card / image
11. collaborative planning later

---

## 14) Exact next patch I recommend implementing first

If you want the biggest immediate stickiness bump, implement these in this order:

### Patch 1
- add `isFavorite`, `lastViewedAt`, `createdAt`
- add `favoriteTrip`, `markTripViewed`, `duplicateTrip`
- sort journeys with favorites first, recents next

### Patch 2
- add `Continue Planning` section
- add `Favorites` section
- add duplicate action

### Patch 3
- add `More actions` menu and toast feedback

---

## 15) Product principle to keep in mind

The best addictive products are not loud. They are:
- useful faster over time
- easier to resume than restart
- rewarding to customize
- easy to show to other people

That is exactly the direction TripLess should go.

---

## 16) Recommended next command

After this roadmap, the best practical next step is:

**Implement favorites + duplicate + recently viewed first.**

That gives you the strongest retention lift with the least engineering effort.
