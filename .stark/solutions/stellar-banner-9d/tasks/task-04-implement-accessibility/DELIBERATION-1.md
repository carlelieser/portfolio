# Deliberation 1

**Task:** Implement Accessibility and Motion Preferences
**Created:** 2025-12-15T22:00:00Z

---

## Review of Prior Thinking

This is the first deliberation for this task. The REPORT.md provides a comprehensive execution plan with 8 steps covering:

1. Implementing CSS media query for `prefers-reduced-motion`
2. Adding Svelte reactive logic for motion preference detection
3. Conditional animation application based on preference
4. Adding ARIA labels and screen reader support
5. Verifying keyboard navigation
6. Screen reader testing (VoiceOver/NVDA)
7. Running accessibility audit with axe DevTools
8. Creating accessibility documentation

The approach builds on Tasks 1-3, which have successfully implemented:
- **Task 1:** Hero3DBackground.svelte component with 3 geometric shapes using absolute positioning and z-index 0
- **Task 2:** CSS 3D transforms with perspective (1200px), translateZ layering (-200px, -150px, -100px), subtle rotations, and CSS custom properties architecture
- **Task 3:** Scroll-based parallax using IntersectionObserver, RAF-throttled scroll listener, and reactive CSS variable updates (`--hero-3d-scroll-offset`)

**Key insights from previous tasks:**

**From Task 1:**
- Component is purely decorative (no interactive elements)
- Uses `aria-hidden="true"` and `role="presentation"` already set
- Absolute positioning keeps it behind content (z-index: 0)
- Shapes use theme-aware OKLCH colors at low opacity

**From Task 2:**
- Static 3D transforms create depth without animation
- CSS custom properties structure enables conditional disabling
- GPU-accelerated transforms for performance
- Cross-browser tested (Chrome, Firefox, Safari)

**From Task 3:**
- Scroll parallax implemented via JavaScript in Hero3DBackground.svelte
- IntersectionObserver already pauses effect when hero out of viewport
- Two `$effect` blocks: one for observer, one for scroll listener
- Reactive state: `scrollY`, `isInViewport`, `rafId`

**Critical realization:** The accessibility work primarily involves **conditionally disabling the scroll parallax** (Task 3) while **preserving the static 3D depth** (Task 2) when `prefers-reduced-motion: reduce` is detected.

---

## New Insights

### 1. Accessibility Architecture Decision

**Critical Question: How should prefers-reduced-motion be implemented?**

Given that we have both CSS (static 3D transforms) and JavaScript (scroll parallax) components, we need a dual-layer approach:

**Layer 1: CSS Media Query (for static transforms)**
```css
@media (prefers-reduced-motion: reduce) {
  /* Disable or reduce CSS animations/transitions */
  /* Question: Should we keep static 3D depth or flatten completely? */
}
```

**Layer 2: JavaScript Detection (for scroll parallax)**
```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

$effect(() => {
  if (prefersReducedMotion || !isInViewport) return;
  // ... scroll listener setup
});
```

**Key Decision Point: What should "reduced motion" mean for our 3D hero?**

**Option A: Disable ALL 3D effects (flatten completely)**
- Remove perspective, translateZ, rotations
- Render shapes as flat 2D with opacity only
- **Pro:** Most conservative, safest for motion sensitivity
- **Con:** Loses visual design intent entirely
- **Con:** Static 3D depth isn't "motion" - it's spatial layout

**Option B: Keep static 3D depth, disable only scroll parallax**
- Preserve perspective, translateZ, rotations (Task 2)
- Disable scroll-based movement (Task 3)
- **Pro:** Respects "reduced motion" literally (no movement)
- **Pro:** Maintains visual design quality
- **Pro:** Static depth doesn't trigger motion sickness
- **Con:** Some users might perceive depth as "motion"

**Option C: Flatten 3D but keep gradual transitions**
- Transition from 3D to 2D smoothly when preference changes
- Add transition animations (ironic for reduced motion!)
- **Pro:** Smooth state change
- **Con:** The transition itself is motion (counterproductive)

**Recommendation: Option B (Keep static 3D, disable scroll parallax)**

**Rationale:**
1. **WCAG Interpretation:** "Animation from Interactions" (2.3.3) refers to motion triggered by user actions. Static spatial layout is not motion.
2. **User Intent:** Users setting `prefers-reduced-motion` typically want to avoid:
   - Autoplay animations
   - Parallax scrolling effects
   - Spinning/rotating elements
   - Transition animations
   - NOT static visual depth
3. **Design Preservation:** Static 3D transforms create depth perception without movement, maintaining design intent
4. **Technical Simplicity:** Disabling scroll listener is straightforward; removing all 3D requires significant rework
5. **Precedent:** Major sites (Apple, Stripe) maintain static depth/shadows with reduced motion, only disabling movement

**Implementation:**
- CSS: No changes needed for static transforms (they're already static)
- JavaScript: Conditionally disable scroll listener setup when `prefersReducedMotion === true`
- Result: Shapes remain at fixed 3D positions, no parallax movement on scroll

### 2. JavaScript Detection Architecture

**Proposed implementation location:** Inside Hero3DBackground.svelte (co-located with scroll parallax logic)

**State variable:**
```typescript
let prefersReducedMotion = $state(false);
```

**Detection pattern:**
```typescript
$effect(() => {
  // Detect initial preference
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  prefersReducedMotion = mediaQuery.matches;

  // Listen for changes (user might toggle mid-session)
  const handleChange = (e: MediaQueryListEvent) => {
    prefersReducedMotion = e.matches;
  };

  mediaQuery.addEventListener('change', handleChange);

  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
});
```

**Integration with existing scroll effect:**

Current scroll effect (from Task 3):
```typescript
$effect(() => {
  if (!isInViewport) return;
  // ... scroll listener setup
});
```

Updated with motion preference:
```typescript
$effect(() => {
  if (prefersReducedMotion || !isInViewport) return;
  // ... scroll listener setup (only if motion allowed AND in viewport)
});
```

**Key insight:** This is a minimal change - one additional condition in the existing `$effect` guard clause.

### 3. Effect Execution Order Analysis

**Svelte 5 $effect execution:**

We'll have THREE $effect blocks in Hero3DBackground.svelte:

**Effect 1: Motion Preference Detection (NEW)**
```typescript
$effect(() => {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  prefersReducedMotion = mediaQuery.matches;
  // ... listener setup
});
```

**Effect 2: IntersectionObserver (EXISTING)**
```typescript
$effect(() => {
  const heroSection = document.querySelector('[data-hero-section]');
  // ... observer setup
  isInViewport = entries[0].isIntersecting;
});
```

**Effect 3: Scroll Listener (EXISTING, MODIFIED)**
```typescript
$effect(() => {
  if (prefersReducedMotion || !isInViewport) return; // MODIFIED
  // ... scroll listener setup
});
```

**Execution order considerations:**

1. **Initial mount:** All three effects run in declaration order
2. **Motion preference changes:** Effect 1 updates `prefersReducedMotion`, triggering Effect 3 re-evaluation
3. **Viewport changes:** Effect 2 updates `isInViewport`, triggering Effect 3 re-evaluation
4. **Cleanup:** All effects clean up properly on unmount or when conditions change

**Potential race condition:** What if `prefersReducedMotion` isn't set before Effect 3 runs?

**Analysis:**
- Effect 1 runs first (declared first), sets `prefersReducedMotion` immediately
- Effect 3 depends on `prefersReducedMotion` state, so Svelte tracks the dependency
- Even if race occurs, Effect 3 would re-run when `prefersReducedMotion` is set
- Safe: Effects are reactive and re-run when dependencies change

**Conclusion:** No race condition risk. Svelte's reactivity handles this correctly.

### 4. ARIA and Screen Reader Strategy

**Current ARIA attributes (from Task 1):**
```svelte
<div
  class="..."
  role="presentation"
  aria-hidden="true"
>
```

**Analysis of sufficiency:**

**`aria-hidden="true"`:**
- Removes element and ALL descendants from accessibility tree
- Screen readers completely ignore this subtree
- Correct for purely decorative content (our 3D shapes)

**`role="presentation"`:**
- Removes semantic meaning but keeps in accessibility tree
- Redundant when combined with `aria-hidden="true"`
- Can be removed (aria-hidden is stronger)

**Question: Should we add ARIA live region announcements for motion preference changes?**

**Option A: Silent (no announcements)**
- User changes OS setting, parallax stops
- No screen reader announcement
- **Pro:** Non-intrusive, respects user preference silently
- **Con:** User might not realize preference was applied

**Option B: Announce state change**
```svelte
<div role="status" aria-live="polite" class="sr-only">
  {#if prefersReducedMotion}
    Animation effects disabled based on your system preferences.
  {/if}
</div>
```
- **Pro:** Confirms to screen reader users that preference is respected
- **Con:** Might be annoying/unnecessary (user already knows they set it)
- **Con:** Adds complexity

**Recommendation: Option A (Silent)**

**Rationale:**
1. `prefers-reduced-motion` is a **system-level setting**, not a website-specific toggle
2. Users who set this preference expect it to apply automatically, not be announced
3. Screen reader users don't need confirmation - the lack of movement is the confirmation
4. Adding announcements could be patronizing or interrupt their reading flow
5. Our implementation is passive (disables scroll listener), not active (shows UI toggle)

**Conclusion:** No ARIA live region needed. Existing `aria-hidden="true"` is sufficient.

### 5. Keyboard Navigation Analysis

**Current interactive elements in Hero section (from Hero.svelte):**

1. **Patreon link** (CTA button)
2. **View Projects link** (CTA button)
3. **ChevronDown scroll indicator** (may or may not be interactive)

**Potential impacts of 3D background on keyboard navigation:**

**Tab order:**
- 3D background is `aria-hidden`, not in tab sequence
- Interactive elements are higher z-index (z-10+)
- Should not affect tab order

**Focus indicators:**
- CSS outline/ring on focused elements
- Shapes are behind content (z-index: 0)
- Should not obscure focus indicators

**Focus trap:**
- No interactive elements in 3D background
- No JavaScript focus management
- No risk of trap

**Keyboard shortcuts:**
- No custom keyboard handlers in Hero3DBackground
- Scroll listener is passive (doesn't preventDefault)
- Should not interfere with Page Down, Space, Arrow keys

**Testing protocol:**
1. Tab from before hero section → should focus Patreon link
2. Tab again → should focus View Projects link
3. Tab again → should focus next element after hero
4. Shift+Tab → should reverse order
5. Verify focus visible on all interactive elements
6. Test Page Down / Space scrolling → should work normally
7. Test with screen reader (VO+Tab navigation)

**Expected outcome:** Zero impact. 3D background is decorative and non-interactive.

### 6. Screen Reader Testing Strategy

**Screen Readers to Test:**

**VoiceOver (macOS) - Primary**
- Built into macOS, readily available
- Cmd+F5 to enable
- VO+Right Arrow to navigate elements
- VO+A to read all

**NVDA (Windows) - Secondary**
- Free, widely used
- If Windows environment available
- Arrow keys + Tab navigation

**Testing Script:**

**VoiceOver Testing:**
1. Enable VoiceOver (Cmd+F5)
2. Navigate to hero section (VO+Right Arrow)
3. Expected: VO announces hero heading, description, CTA links
4. Expected: VO does NOT announce shapes, transforms, or decorative elements
5. Verify reading order: Heading → Description → CTA 1 → CTA 2 → Next section
6. Test with reduced motion enabled: verify same behavior (no announcements about motion changes)
7. Verify forms mode (VO+Shift+Space): CTAs are activatable

**NVDA Testing (if available):**
1. Enable NVDA
2. Navigate hero section with arrow keys
3. Verify same content announcements as VoiceOver
4. Test interaction mode (Tab key): CTAs focusable and activatable

**Expected announcements:**
```
"[Hero Heading Text] Heading Level 1"
"[Hero Description Text]"
"Support on Patreon, Link"
"View Projects, Link"
"[Next Section Content]"
```

**NOT announced:**
- 3D background shapes
- Transform values
- Scroll parallax state
- Motion preference changes

**Validation:** If screen reader announces ONLY the content (not decorative elements), test passes.

### 7. CSS Media Query Implementation Details

**Question: Should we add CSS-only reduced motion handling?**

**Current situation:**
- Static 3D transforms are in CSS (Task 2)
- Scroll parallax is in JavaScript (Task 3)

**Option A: CSS-only (partial solution)**
```css
@media (prefers-reduced-motion: reduce) {
  /* This would only affect CSS animations/transitions */
  /* Doesn't affect JavaScript scroll listener */
}
```
- **Pro:** Works without JavaScript
- **Con:** Our scroll parallax is JS-based, so this has limited effect
- **Con:** Might cause visual inconsistency (CSS says no motion, JS still animates)

**Option B: JavaScript-only (current plan)**
```typescript
const prefersReducedMotion = window.matchMedia(...).matches;
if (prefersReducedMotion) {
  // Don't set up scroll listener
}
```
- **Pro:** Centralized control (one source of truth)
- **Pro:** Handles JavaScript parallax correctly
- **Pro:** Can disable all motion in one place

**Option C: Hybrid (belt and suspenders)**
```css
@media (prefers-reduced-motion: reduce) {
  .hero-3d-background * {
    animation: none !important;
    transition: none !important;
  }
}
```
```typescript
const prefersReducedMotion = window.matchMedia(...).matches;
// JavaScript check as well
```
- **Pro:** Defense in depth
- **Pro:** Handles edge cases (future CSS animations)
- **Con:** Redundant for current implementation

**Recommendation: Option B with future-proofing comment**

**Rationale:**
1. Current implementation has NO CSS animations/transitions to disable
2. All motion is JavaScript-based (scroll listener)
3. JavaScript detection correctly handles the JavaScript parallax
4. Adding CSS media query now would be premature optimization
5. Can add CSS later if we introduce CSS animations

**Implementation:**
- JavaScript detection in `$effect` (primary mechanism)
- Add comment noting that CSS media query would go here if needed
- Document in code that future CSS animations should check `prefers-reduced-motion`

**Code comment:**
```typescript
/**
 * Detects user's motion preference (prefers-reduced-motion).
 * Currently, all motion is JavaScript-based (scroll parallax).
 * If CSS animations are added in the future, also add:
 * @media (prefers-reduced-motion: reduce) { ... }
 */
```

### 8. State Management and Reactivity Flow

**Complete state diagram:**

```
┌─────────────────────────────────────────────────────────┐
│ User OS Setting: prefers-reduced-motion                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Effect 1: window.matchMedia('(prefers-reduced-motion)')│
│   → Sets prefersReducedMotion: boolean                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ State: prefersReducedMotion ($state)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Effect 3: Scroll Listener Setup                         │
│   Guard: if (prefersReducedMotion || !isInViewport)     │
│   → Returns early (no listener) if motion reduced       │
└─────────────────────────────────────────────────────────┘
```

**Reactivity scenarios:**

**Scenario 1: Page load with reduced motion already enabled**
1. Component mounts
2. Effect 1 runs: detects `matchMedia.matches === true`
3. Sets `prefersReducedMotion = true`
4. Effect 3 runs: guard clause `if (prefersReducedMotion)` returns early
5. Scroll listener NEVER set up
6. Result: Static 3D depth only, no parallax

**Scenario 2: Page load with reduced motion disabled**
1. Component mounts
2. Effect 1 runs: detects `matchMedia.matches === false`
3. Sets `prefersReducedMotion = false`
4. Effect 3 runs: guard clause passes (if `isInViewport` also true)
5. Scroll listener set up
6. Result: Full parallax effect active

**Scenario 3: User enables reduced motion mid-session**
1. User goes to OS settings, enables "Reduce motion"
2. Media query listener fires: `handleChange` called
3. Sets `prefersReducedMotion = true`
4. Svelte reactivity detects state change
5. Effect 3 re-runs: guard clause returns early
6. Cleanup function from previous Effect 3 run removes scroll listener
7. Result: Parallax stops immediately, static depth remains

**Scenario 4: User disables reduced motion mid-session**
1. User goes to OS settings, disables "Reduce motion"
2. Media query listener fires: `handleChange` called
3. Sets `prefersReducedMotion = false`
4. Svelte reactivity detects state change
5. Effect 3 re-runs: guard clause passes
6. Scroll listener set up
7. Result: Parallax resumes immediately

**Critical insight:** Svelte's `$effect` reactivity handles all state transitions automatically. We don't need manual listener management beyond the return cleanup functions.

### 9. Performance Impact Analysis

**Additional overhead from accessibility implementation:**

**Memory:**
- New state variable: `prefersReducedMotion` (1 boolean, ~1 byte)
- Media query listener: ~100 bytes
- Total: Negligible (< 200 bytes)

**CPU:**
- Initial matchMedia call: ~1ms (one-time)
- Media query listener: Only fires on OS setting change (extremely rare)
- Effect re-evaluation: Negligible (boolean check)
- Total: < 0.1% CPU increase

**Beneficial side effect:**
- When `prefersReducedMotion === true`, scroll listener is NOT set up
- Saves CPU cycles from scroll events (5-10% reduction)
- Improves performance for users with motion sensitivity

**Conclusion:** Accessibility implementation has **zero performance cost** and actually **improves performance** for users who need it.

### 10. Edge Cases and Error Handling

**Edge Case 1: matchMedia not supported (ancient browsers)**

**Probability:** Very low (< 1% of users)
**Impact:** Parallax would always run (no reduced motion support)

**Mitigation:**
```typescript
if (!window.matchMedia) {
  // Very old browser, assume reduced motion not needed
  prefersReducedMotion = false;
  return;
}
```

**Validation:** Test in BrowserStack with IE11 or very old Safari.

---

**Edge Case 2: Media query listener doesn't fire**

**Probability:** Very low (browser bug)
**Impact:** Motion preference changes mid-session wouldn't apply

**Mitigation:**
- Initial detection still works (page load)
- User can refresh page to apply new setting
- Not worth complex workarounds

**Validation:** Manual testing - change OS setting while page open.

---

**Edge Case 3: SSR/Hydration with matchMedia**

**Probability:** Medium (SvelteKit is SSR by default)
**Impact:** `window.matchMedia` is undefined during SSR

**Mitigation:**
```typescript
$effect(() => {
  if (typeof window === 'undefined') return; // SSR guard

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  // ...
});
```

**Validation:**
- Run `npm run build && npm run preview`
- Check for console errors during SSR
- Verify client hydration works correctly

---

**Edge Case 4: User has reduced motion but JavaScript disabled**

**Probability:** Very low (< 0.1%)
**Impact:** Parallax wouldn't work anyway (JS-based), so reduced motion is moot

**Mitigation:** None needed. JavaScript is required for parallax in the first place.

**Graceful degradation:** Static 3D depth (CSS-only) still renders without JavaScript.

---

**Edge Case 5: Hero section not in viewport on page load**

**Probability:** Low (hero is first section)
**Impact:** No impact - IntersectionObserver and motion preference are independent

**Validation:** Test by loading page scrolled down (direct link to anchor).

---

## Questions Resolved

**Q: What does "reduced motion" mean for our 3D hero banner?**
**A:** Disable scroll-based parallax animation (Task 3) while preserving static 3D depth (Task 2). Static spatial layout is not motion.

**Q: Should we use CSS media query or JavaScript detection?**
**A:** JavaScript detection is sufficient because all motion is JavaScript-based (scroll listener). CSS media query is unnecessary for current implementation.

**Q: Where should the motion preference detection logic live?**
**A:** Inside Hero3DBackground.svelte, co-located with the scroll parallax logic. Create a third `$effect` block for preference detection.

**Q: Should we announce motion preference changes to screen readers?**
**A:** No. It's a system-level setting that users expect to apply automatically. Announcing it would be redundant and potentially annoying.

**Q: Will static 3D transforms trigger motion sickness?**
**A:** No. Static depth perception (translateZ, rotateX/Y without animation) is not motion. WCAG "Animation from Interactions" refers to movement, not spatial layout.

**Q: How does this integrate with existing IntersectionObserver?**
**A:** The scroll effect already has condition `if (!isInViewport) return;`. We simply add `if (prefersReducedMotion || !isInViewport) return;`. Two independent pause conditions.

**Q: What if user changes preference mid-session?**
**A:** Media query listener detects changes and updates `prefersReducedMotion` state. Svelte reactivity automatically re-runs Effect 3, stopping or starting scroll listener.

**Q: Should we remove role="presentation" since we have aria-hidden="true"?**
**A:** Yes. `aria-hidden="true"` is stronger and makes `role="presentation"` redundant. Simplify to just `aria-hidden="true"`.

**Q: Do we need to test on real screen readers?**
**A:** Yes, but expectations are simple: screen reader should announce hero content (heading, text, CTAs) and ignore decorative 3D shapes. This should already work from Task 1's ARIA setup.

---

## Open Questions

**Q1: Should we add a visual indicator that reduced motion is active?**
- Could show subtle badge: "Motion effects disabled"
- **Decision needed:** Not standard practice. Most sites apply silently. Skip for MVP.

**Q2: Should we log to console when reduced motion is detected?**
- Useful for debugging: `console.info('Reduced motion preference detected, parallax disabled')`
- **Decision needed:** Add in development, remove in production. Use conditional logging.

**Q3: What happens if user has BOTH reduced motion AND transparent motion enabled (some OSes)?**
- Unlikely scenario, OS-specific edge case
- **Decision needed:** Trust `prefers-reduced-motion` query result. Don't worry about OS-specific quirks.

**Q4: Should we add unit tests for motion preference logic?**
- Could mock `window.matchMedia` and test state changes
- **Decision needed:** Out of scope for this task. Manual testing sufficient for MVP.

**Q5: How do we document the reduced motion behavior for stakeholders?**
- Add to README or accessibility documentation
- **Decision needed:** Document in code comments (JSDoc). Formal docs can come later.

**Q6: Should we use a library for accessibility testing?**
- Options: axe-core, pa11y, jest-axe
- **Decision needed:** Use axe DevTools browser extension (already available, no installation). Automated testing can come later.

**Q7: What if future tasks add CSS animations to the shapes?**
- Would need CSS media query in addition to JavaScript check
- **Decision needed:** Add TODO comment in code. Address when/if CSS animations are added.

---

## Confidence Assessment

| Aspect | Confidence | Notes |
|--------|------------|-------|
| **Understanding** | **Very High** | WCAG guidelines clear. `prefers-reduced-motion` is well-documented. Prior tasks provide complete context. |
| **Approach** | **Very High** | JavaScript detection is proven pattern. Minimal code changes (one condition added). Integrates cleanly with existing effects. |
| **Risks identified** | **High** | Edge cases documented (SSR, browser support, media query listeners). All have clear mitigations. No major unknowns. |
| **Implementation complexity** | **Very Low** | Add one `$effect` block, one state variable, one condition. ~20 lines of code. |
| **Screen reader compatibility** | **High** | Existing ARIA from Task 1 should suffice. Testing will confirm. No interactive elements to complicate. |
| **Keyboard navigation** | **Very High** | No impact expected. 3D background is non-interactive and already aria-hidden. |
| **WCAG compliance** | **Very High** | Approach directly addresses WCAG 2.3.3 (Animation from Interactions). Preserving static depth is valid interpretation. |
| **Performance** | **Very High** | Zero overhead, actually improves performance by not setting up scroll listener. |
| **Browser compatibility** | **High** | `matchMedia` has 98%+ support. SSR guard handles server-side. IE11 has fallback. |
| **Testing strategy** | **High** | Clear protocol for VoiceOver testing, keyboard nav, axe audit. Manual testing is sufficient. |

**Overall confidence: VERY HIGH**

This is the simplest task in the solution. Implementation is minimal (one additional effect, one condition), testing is straightforward, and the approach is well-established.

---

## Detailed Technical Plan

### Phase 1: Add Motion Preference Detection (10 min)

**File:** `/Users/devplex/Documents/Projects/Development/carlelieser/carlos-santos-site/src/lib/components/effects/Hero3DBackground.svelte`

**Action:** Add state variable and detection effect

**Before (lines ~28-35):**
```typescript
/**
 * Scroll-based parallax state
 */
let scrollY = $state(0);
let isInViewport = $state(true);
let rafId: number | null = null;

const MAX_SCROLL = 500;
```

**After:**
```typescript
/**
 * Scroll-based parallax state
 */
let scrollY = $state(0);
let isInViewport = $state(true);
let rafId: number | null = null;

/**
 * Motion preference state
 * Detects user's prefers-reduced-motion setting
 */
let prefersReducedMotion = $state(false);

const MAX_SCROLL = 500;
```

**Then add new effect (after line ~35, before IntersectionObserver effect):**
```typescript
/**
 * Detect user motion preference (prefers-reduced-motion)
 * Respects WCAG 2.3.3 - Animation from Interactions
 * When reduced motion is preferred, scroll parallax is disabled
 * Static 3D depth is preserved (not considered "motion")
 */
$effect(() => {
  // SSR guard - matchMedia only available in browser
  if (typeof window === 'undefined') return;

  // Check for very old browsers without matchMedia support
  if (!window.matchMedia) {
    console.warn('window.matchMedia not supported. Reduced motion preference cannot be detected.');
    prefersReducedMotion = false;
    return;
  }

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Set initial state
  prefersReducedMotion = mediaQuery.matches;

  // Listen for changes (user might toggle OS setting during session)
  const handleChange = (e: MediaQueryListEvent) => {
    prefersReducedMotion = e.matches;

    // Optional: Log for debugging (remove in production)
    if (import.meta.env.DEV) {
      console.info(
        `[Hero3DBackground] Motion preference ${e.matches ? 'enabled' : 'disabled'}: `,
        e.matches ? 'Parallax disabled' : 'Parallax enabled'
      );
    }
  };

  mediaQuery.addEventListener('change', handleChange);

  // Cleanup: remove listener on component unmount
  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
});
```

**Validation:**
- TypeScript compiles without errors
- Open browser DevTools console
- Check for motion preference log message
- Change OS reduced motion setting, verify log updates

---

### Phase 2: Update Scroll Effect Condition (2 min)

**File:** Same file, scroll listener `$effect` block

**Find the scroll listener effect (should be ~line 80-120):**
```typescript
$effect(() => {
  if (!isInViewport) return; // OLD CONDITION

  // ... scroll listener setup
});
```

**Update guard clause:**
```typescript
$effect(() => {
  // Don't set up scroll listener if:
  // - User prefers reduced motion (accessibility)
  // - Hero section not in viewport (performance optimization)
  if (prefersReducedMotion || !isInViewport) return;

  // ... scroll listener setup (unchanged)
});
```

**Validation:**
- Save file
- Enable reduced motion in OS settings
- Reload page
- Scroll - verify parallax does NOT activate
- Disable reduced motion
- Reload page
- Scroll - verify parallax DOES activate

---

### Phase 3: Simplify ARIA Attributes (2 min)

**File:** Same file, template section

**Find the root container div (should be ~line 150-160):**
```svelte
<div
  class="..."
  style:z-index="0"
  style:--hero-3d-scroll-offset={scrollY}
  ...
  role="presentation"
  aria-hidden="true"
>
```

**Update to remove redundant role:**
```svelte
<div
  class="..."
  style:z-index="0"
  style:--hero-3d-scroll-offset={scrollY}
  ...
  aria-hidden="true"
>
```

**Rationale:** `aria-hidden="true"` removes element from accessibility tree entirely, making `role="presentation"` redundant.

**Validation:**
- Inspect element in browser DevTools
- Verify `role="presentation"` is removed
- Verify `aria-hidden="true"` is still present

---

### Phase 4: Update JSDoc Documentation (5 min)

**File:** Same file, component-level JSDoc comment

**Update the component JSDoc (top of script section) to include accessibility notes:**

**Before:**
```typescript
/**
 * Hero 3D Background Component
 *
 * Renders layered geometric shapes with CSS 3D transforms to create
 * subtle depth behind hero content. Uses pure CSS for optimal performance.
 *
 * @component
 */
```

**After:**
```typescript
/**
 * Hero 3D Background Component
 *
 * Renders layered geometric shapes with CSS 3D transforms to create
 * subtle depth behind hero content. Implements scroll-based parallax
 * with full accessibility support.
 *
 * **Accessibility:**
 * - Respects `prefers-reduced-motion` media query (WCAG 2.3.3)
 * - Disables scroll parallax when reduced motion is preferred
 * - Preserves static 3D depth (spatial layout, not motion)
 * - Uses `aria-hidden="true"` (purely decorative, no semantic content)
 * - Does not interfere with keyboard navigation or screen readers
 *
 * **Performance:**
 * - GPU-accelerated CSS 3D transforms
 * - IntersectionObserver pauses when out of viewport
 * - requestAnimationFrame throttling for smooth 60fps
 * - Minimal memory footprint (3 shapes, ~200 bytes state)
 *
 * @component
 */
```

**Validation:** Documentation accurately reflects implementation.

---

### Phase 5: Test with OS Reduced Motion Setting (15 min)

**macOS:**
1. Open System Settings > Accessibility > Display
2. Enable "Reduce motion"
3. Return to browser with dev site open
4. Reload page
5. Scroll hero section
6. **Expected:** Shapes remain at fixed 3D positions, NO parallax movement
7. Disable "Reduce motion"
8. Reload page
9. Scroll hero section
10. **Expected:** Parallax effect active, shapes move at different rates

**Windows (if available):**
1. Open Settings > Ease of Access > Display
2. Enable "Show animations in Windows"
3. Follow same testing protocol as macOS

**Browser DevTools (alternative if OS access limited):**
1. Open Chrome DevTools
2. Open Command Palette (Cmd/Ctrl+Shift+P)
3. Type "Emulate CSS prefers-reduced-motion"
4. Select "Emulate CSS prefers-reduced-motion: reduce"
5. Test parallax (should be disabled)
6. Select "No emulation"
7. Test parallax (should be enabled)

**Validation:**
- Reduced motion: parallax disabled, static depth visible
- Normal motion: parallax enabled, shapes move on scroll
- Check console logs (if dev logging added)

---

### Phase 6: Screen Reader Testing (15 min)

**VoiceOver (macOS):**

**Setup:**
1. Enable VoiceOver: Cmd+F5
2. Navigate to hero section

**Test Protocol:**
1. Use VO+Right Arrow to navigate elements
2. **Expected announcements:**
   - Hero heading text
   - Hero description text
   - "Support on Patreon, Link"
   - "View Projects, Link"
3. **NOT announced:**
   - 3D background shapes
   - Decorative elements
   - Transform values
4. Test with reduced motion enabled: Same announcements (no change)
5. Test with reduced motion disabled: Same announcements (no change)
6. Verify no spurious announcements about motion state

**Keyboard Navigation (with VoiceOver):**
1. Press Tab key
2. **Expected:** Focus moves to first CTA (Patreon link)
3. Press Tab again
4. **Expected:** Focus moves to second CTA (Projects link)
5. Press Shift+Tab
6. **Expected:** Focus moves backward
7. Verify focus indicators are visible (not obscured by shapes)

**Disable VoiceOver:** Cmd+F5

**Validation:**
- Screen reader announces only semantic content
- Decorative 3D shapes are ignored
- Keyboard navigation unaffected
- No motion-related announcements

---

### Phase 7: Keyboard Navigation Testing (10 min)

**Test without screen reader:**

**Tab Navigation:**
1. Click before hero section (browser chrome)
2. Press Tab
3. **Expected:** Focus moves to Patreon link (visible focus ring)
4. Press Tab
5. **Expected:** Focus moves to Projects link (visible focus ring)
6. Press Tab
7. **Expected:** Focus moves to next section (past hero)
8. Press Shift+Tab repeatedly
9. **Expected:** Focus reverses through elements

**Scroll Keys:**
1. Focus hero section (click on it)
2. Press Page Down
3. **Expected:** Page scrolls smoothly, parallax activates (if motion allowed)
4. Press Space
5. **Expected:** Page scrolls down by viewport height
6. Press Shift+Space
7. **Expected:** Page scrolls up

**Arrow Keys (if hero has scroll):**
1. Press Down Arrow
2. **Expected:** Scroll moves down slightly
3. Press Up Arrow
4. **Expected:** Scroll moves up

**Validation:**
- All keyboard navigation works correctly
- Focus indicators always visible
- No focus traps
- Scrolling works with reduced motion on/off

---

### Phase 8: Axe DevTools Accessibility Audit (10 min)

**Setup:**
1. Install axe DevTools extension (if not already installed):
   - Chrome: https://chrome.google.com/webstore (search "axe DevTools")
   - Firefox: https://addons.mozilla.org (search "axe DevTools")
2. Open extension in browser

**Test Protocol:**
1. Navigate to hero section
2. Open axe DevTools (browser extensions panel)
3. Click "Scan ALL of my page"
4. Wait for results

**Expected Results:**
- **Violations:** 0 (or hero-unrelated issues)
- **Needs Review:** Possibly some (check if hero-related)
- **Passes:** All accessibility checks for hero section

**Common passes:**
- Color contrast (shapes have sufficient contrast with background)
- ARIA attributes (aria-hidden is valid for decorative content)
- Focus order (interactive elements are in logical order)
- Keyboard accessibility (no custom handlers interfering)

**If violations found:**
- Review description
- Determine if hero-related or other page issues
- Address hero-related violations before completing task

**Validation:**
- Zero accessibility violations in hero section
- If violations exist, document and fix

---

### Phase 9: Cross-Browser Accessibility Testing (15 min)

**Chrome (primary):**
- Run axe audit (done in Phase 8)
- Test keyboard navigation
- Test screen reader (if available)
- Test reduced motion toggle

**Firefox:**
- Open Firefox
- Navigate to dev site
- Enable reduced motion (about:config → ui.prefersReducedMotion = 1)
- Test parallax disables
- Test keyboard navigation
- Run axe audit (if extension installed)

**Safari:**
- Open Safari
- Navigate to dev site
- Enable reduced motion (System Settings)
- Test parallax disables
- Test keyboard navigation
- Test VoiceOver (Cmd+F5)

**Mobile (if available):**
- iOS Safari: Test VoiceOver on iPhone
- Chrome Android: Test TalkBack on Android device

**Validation:**
- Reduced motion works consistently across browsers
- Keyboard navigation works in all browsers
- Screen readers work (tested in at least one browser)
- No browser-specific accessibility issues

---

### Phase 10: Documentation and Code Cleanup (10 min)

**Actions:**

1. **Remove debug logging (if added):**
   - Remove or comment out `console.info` in motion preference effect
   - Or keep behind `import.meta.env.DEV` check

2. **Review all JSDoc comments:**
   - Motion preference detection effect: Documented ✓
   - State variables: All documented ✓
   - Accessibility notes in component header: Added ✓

3. **Add inline comments for complex logic:**
   ```typescript
   // Guard: Don't set up scroll listener if user prefers reduced motion
   // or if hero section is not in viewport (performance optimization)
   if (prefersReducedMotion || !isInViewport) return;
   ```

4. **Update REPORT.md with findings:**
   - Document final approach (disabled parallax, kept static depth)
   - Note any browser-specific quirks discovered
   - Record axe audit results
   - Confirm screen reader testing completed

5. **Check TypeScript errors:**
   ```bash
   npm run check
   ```
   Expected: 0 errors

6. **Verify build succeeds:**
   ```bash
   npm run build
   ```
   Expected: Successful build

7. **Format code (if project has formatter):**
   ```bash
   npm run format
   # or
   npx prettier --write src/lib/components/effects/Hero3DBackground.svelte
   ```

**Validation:**
- All code is documented
- No TypeScript errors
- Build succeeds
- Code is formatted
- REPORT.md updated

---

## Risk Assessment

### Risk 1: Static 3D Depth Triggers Motion Sickness Despite No Animation

**Probability:** Very Low
**Impact:** Medium (some users might be affected)

**Analysis:**
- Static spatial depth (translateZ) is not motion
- WCAG "Animation from Interactions" refers to movement, not layout
- Major sites (Apple, Microsoft) use static depth with reduced motion
- No documented cases of static 3D causing motion sickness

**Mitigation:**
- Monitor user feedback after deployment
- If reports of issues, add option to flatten 3D entirely
- Could add CSS media query to remove transforms if needed:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .hero-3d-background * {
      transform: none !important;
    }
  }
  ```

**Validation:**
- User testing with motion-sensitive individuals (if possible)
- Analytics monitoring for bounce rate changes
- Feedback channels open

---

### Risk 2: matchMedia Listener Doesn't Fire on OS Setting Change

**Probability:** Low (browser bug or incompatibility)
**Impact:** Low (page reload fixes)

**Scenarios:**
- Older browser with buggy matchMedia implementation
- OS doesn't properly communicate setting changes to browsers
- Event listener not set up correctly

**Mitigation:**
- Initial detection always works (page load)
- User can refresh page to apply new setting
- Add defensive coding:
  ```typescript
  try {
    mediaQuery.addEventListener('change', handleChange);
  } catch (error) {
    console.warn('Could not set up motion preference listener:', error);
  }
  ```

**Validation:**
- Manual testing: Change OS setting while page open, verify effect
- Test in multiple browsers
- Test in browser DevTools emulation mode

---

### Risk 3: SSR Hydration Mismatch with matchMedia

**Probability:** Medium (SvelteKit uses SSR by default)
**Impact:** Low (client-side state corrects)

**Scenario:**
- Server renders with `prefersReducedMotion = false` (default)
- Client has reduced motion enabled
- Hydration might flash with parallax before disabling

**Mitigation:**
- SSR guard: `if (typeof window === 'undefined') return;`
- Effect runs only on client, never on server
- Initial state defaults to false (no parallax flash)
- Hydration happens before user can scroll (fast)

**Validation:**
- Build and preview: `npm run build && npm run preview`
- Check for hydration warnings in console
- Test with reduced motion enabled, look for flash

---

### Risk 4: Screen Reader Announces Unwanted Information

**Probability:** Very Low (aria-hidden is effective)
**Impact:** Medium (poor screen reader UX)

**Scenario:**
- aria-hidden not working correctly
- Screen reader announces shape divs or transform values
- Motion state changes create spurious announcements

**Mitigation:**
- `aria-hidden="true"` is well-supported (98%+ browsers)
- No ARIA live regions that could announce motion changes
- Shapes are pure divs with no text content
- Test with VoiceOver to confirm

**Validation:**
- VoiceOver testing (macOS): Navigate hero, verify only content announced
- NVDA testing (Windows): Same verification
- Check for any surprise announcements

---

### Risk 5: Keyboard Focus Obscured by 3D Shapes

**Probability:** Very Low (z-index management should prevent)
**Impact:** High (accessibility blocker)

**Scenario:**
- Shape z-index higher than focus indicator z-index
- Focus ring rendered behind shapes
- User can't see which element is focused

**Mitigation:**
- Shapes at z-index: 0 (explicitly set)
- Content at z-index: 10+ (from Task 1/2)
- Focus indicators default to z-index: auto (above content)
- CSS outline property renders outside element bounds

**Validation:**
- Tab through all interactive elements
- Visually verify focus ring is visible
- Test in all browsers (Chrome, Firefox, Safari)
- Test with custom focus styles if project has them

---

## Implementation Checklist

Comprehensive task list for execution:

**Prerequisites:**
- [ ] Task 3 complete (scroll parallax implemented)
- [ ] Development server running (`npm run dev`)
- [ ] Browser DevTools open
- [ ] OS accessibility settings accessible (for testing)

**Phase 1: Motion Preference Detection**
- [ ] Open Hero3DBackground.svelte
- [ ] Add `prefersReducedMotion` state variable
- [ ] Add new `$effect` block for matchMedia detection
- [ ] Add SSR guard (`typeof window === 'undefined'`)
- [ ] Add browser support check (`!window.matchMedia`)
- [ ] Set initial state: `prefersReducedMotion = mediaQuery.matches`
- [ ] Add change listener: `mediaQuery.addEventListener('change', handleChange)`
- [ ] Add cleanup function: `mediaQuery.removeEventListener('change', handleChange)`
- [ ] Add optional dev logging: `if (import.meta.env.DEV) console.info(...)`
- [ ] Run `npm run check` - verify no TypeScript errors

**Phase 2: Update Scroll Effect**
- [ ] Locate scroll listener `$effect` block
- [ ] Find guard clause: `if (!isInViewport) return;`
- [ ] Update to: `if (prefersReducedMotion || !isInViewport) return;`
- [ ] Add comment explaining both conditions
- [ ] Save file
- [ ] Check browser console for any errors

**Phase 3: Simplify ARIA**
- [ ] Locate root container `<div>` in template
- [ ] Remove `role="presentation"` attribute
- [ ] Verify `aria-hidden="true"` is still present
- [ ] Save file
- [ ] Inspect element in DevTools: confirm role removed, aria-hidden remains

**Phase 4: Update Documentation**
- [ ] Update component-level JSDoc with accessibility notes
- [ ] Add comments to new motion preference effect
- [ ] Add inline comment to updated guard clause
- [ ] Document WCAG compliance approach
- [ ] Save file

**Phase 5: OS Reduced Motion Testing**
- [ ] macOS: Open System Settings > Accessibility > Display
- [ ] Enable "Reduce motion"
- [ ] Return to browser, reload page
- [ ] Scroll hero section: verify NO parallax
- [ ] Shapes should remain at fixed 3D positions
- [ ] Disable "Reduce motion"
- [ ] Reload page
- [ ] Scroll hero section: verify parallax WORKS
- [ ] Alternative: Use browser DevTools emulation (Cmd+Shift+P → "Emulate CSS prefers-reduced-motion")
- [ ] Test toggle mid-session: change setting without reload, verify effect updates

**Phase 6: Screen Reader Testing**
- [ ] Enable VoiceOver (Cmd+F5 on macOS)
- [ ] Navigate to hero section (VO+Right Arrow)
- [ ] Verify hero heading is announced
- [ ] Verify hero description is announced
- [ ] Verify CTA links are announced ("Support on Patreon, Link")
- [ ] Verify 3D shapes are NOT announced
- [ ] Test with reduced motion enabled: same announcements
- [ ] Test with reduced motion disabled: same announcements
- [ ] Disable VoiceOver (Cmd+F5)

**Phase 7: Keyboard Navigation Testing**
- [ ] Click before hero section
- [ ] Press Tab: focus should move to first CTA
- [ ] Verify focus ring is visible (not obscured)
- [ ] Press Tab: focus should move to second CTA
- [ ] Verify focus ring is visible
- [ ] Press Tab: focus should move to next section
- [ ] Press Shift+Tab repeatedly: focus should reverse
- [ ] Test Page Down key: scrolling works
- [ ] Test Space key: scrolling works
- [ ] Test arrow keys: scrolling works
- [ ] Verify no focus traps

**Phase 8: Axe DevTools Audit**
- [ ] Install axe DevTools extension (if not installed)
- [ ] Open axe DevTools in browser
- [ ] Click "Scan ALL of my page"
- [ ] Review results for violations
- [ ] Filter results to hero section
- [ ] Verify zero violations (or non-hero violations only)
- [ ] Check "Passes" section: color contrast, ARIA, keyboard
- [ ] Document any findings in REPORT.md

**Phase 9: Cross-Browser Testing**
- [ ] Test in Chrome: reduced motion, keyboard nav, axe audit
- [ ] Test in Firefox: reduced motion, keyboard nav
- [ ] Test in Safari: reduced motion, keyboard nav, VoiceOver
- [ ] Test in mobile browsers (if available): iOS Safari, Chrome Android
- [ ] Verify consistent behavior across browsers
- [ ] Document any browser-specific quirks

**Phase 10: Code Cleanup**
- [ ] Remove debug console.log statements (or keep behind DEV check)
- [ ] Verify all JSDoc comments are complete
- [ ] Verify all inline comments are clear
- [ ] Run `npm run check` - zero errors
- [ ] Run `npm run build` - successful
- [ ] Run formatter (if available): `npm run format`
- [ ] Git diff review: all changes intentional
- [ ] Update REPORT.md with findings

**Final Validation:**
- [ ] All acceptance criteria met (from REPORT.md)
- [ ] `prefers-reduced-motion` media query detected
- [ ] Animations disabled when reduced motion preferred
- [ ] Static 3D depth maintained
- [ ] ARIA attributes correct (`aria-hidden="true"`)
- [ ] Screen reader testing complete (VoiceOver or NVDA)
- [ ] Keyboard navigation verified
- [ ] Axe DevTools reports zero violations
- [ ] Code documented with accessibility considerations
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Ready for next task (Task 5: Integration)

---

## Recommendation

**READY**

This task is ready for immediate execution. The implementation is minimal, well-understood, and builds cleanly on existing work.

**Key factors supporting readiness:**

1. **Minimal Code Changes:** Add one `$effect` block, one state variable, modify one condition. ~25 lines of new code.

2. **Clear Requirements:** WCAG 2.3.3 provides explicit guidance. Disable motion-based animations, not static depth.

3. **Strong Foundation:** Tasks 1-3 set up perfect structure. All motion is in one place (scroll listener), easy to conditionally disable.

4. **Low Risk:** No complex logic, no edge cases beyond SSR guard. matchMedia is well-supported (98%+ browsers).

5. **Proven Patterns:** Media query detection is standard practice. Svelte $effect handles reactivity automatically.

6. **Straightforward Testing:** OS setting toggle, keyboard nav, screen reader. All manual, no test infrastructure needed.

7. **Zero Performance Impact:** Actually improves performance for users with motion sensitivity (no scroll listener).

**Execution strategy:**

1. **Implement in one session:** All phases can be completed in 90-120 minutes
2. **Test incrementally:** After Phase 2, test reduced motion immediately (don't wait)
3. **Screen reader priority:** Phase 6 is most important (user-facing accessibility)
4. **Document as you go:** Add JSDoc in Phase 4, not as afterthought

**Success criteria for task completion:**

- [ ] Motion preference detected and tracked reactively
- [ ] Parallax disabled when `prefersReducedMotion === true`
- [ ] Static 3D depth preserved (shapes visible, no movement)
- [ ] Screen reader announces only hero content (not decorative shapes)
- [ ] Keyboard navigation works perfectly (Tab, Shift+Tab, scroll keys)
- [ ] Axe DevTools reports zero accessibility violations
- [ ] Code is clean, documented, production-ready
- [ ] Works consistently across Chrome, Firefox, Safari
- [ ] Both OS setting change and DevTools emulation work

**Blockers/Dependencies:**

- **Task 3 must be complete:** Scroll parallax must be implemented ✓ (verified)
- **Browser DevTools available:** For testing emulation and inspection
- **OS accessibility settings accessible:** For manual testing (or use browser emulation)
- **axe DevTools installed:** For automated accessibility audit

**Estimated time:** 90-120 minutes including all testing and documentation

**Confidence level: VERY HIGH**

This is the simplest and lowest-risk task in the entire solution. Implementation is trivial, testing is straightforward, and the outcome is predictable. The main time investment is manual testing (screen reader, keyboard), not implementation complexity.

**Next steps:**

1. Verify Task 3 complete (scroll parallax working)
2. Execute Phase 1: Add motion preference detection
3. Execute Phase 2: Update scroll effect guard clause
4. Test immediately (Phase 5): Toggle reduced motion, verify behavior
5. Complete remaining phases (screen reader, keyboard, audit)
6. Document findings in REPORT.md
7. Mark task complete

**Proceed with execution immediately.**

---

## Additional Notes

**Expected outcomes after task completion:**

**With reduced motion disabled (default):**
- Hero section displays 3D shapes with depth
- Scrolling triggers parallax movement (shapes move at different rates)
- All interactive elements work normally
- Screen readers announce content normally
- Keyboard navigation works normally

**With reduced motion enabled:**
- Hero section displays same 3D shapes with same depth
- Scrolling does NOT trigger parallax (shapes stay fixed)
- All interactive elements work normally
- Screen readers announce content normally (no change)
- Keyboard navigation works normally (no change)

**The only difference:** Scroll-based movement is disabled. Everything else is identical.

**Future enhancements (not in scope for Task 4):**

1. **User toggle:** Add UI control to override OS preference (advanced users)
2. **Granular control:** Separate toggles for parallax vs. 3D depth
3. **Analytics:** Track how many users have reduced motion enabled
4. **A/B testing:** Compare engagement metrics (reduced motion on vs. off)
5. **CSS media query:** Add for any future CSS animations
6. **Automated testing:** Unit tests for motion preference logic
7. **Documentation:** Formal accessibility statement page

**Known limitations (acceptable for MVP):**

- No visual indicator that reduced motion is active (users rely on OS confirmation)
- No user override toggle (respects OS setting only)
- SSR always renders with `prefersReducedMotion = false` (corrects on hydration)
- Very old browsers (< 2%) don't support matchMedia (fallback: motion enabled)

**Code quality standards:**

- Follow existing Hero3DBackground.svelte style
- Use Svelte 5 runes ($state, $effect)
- JSDoc for all new state and effects
- Inline comments for complex logic
- TypeScript strict mode compliance
- No console.log in production (use `import.meta.env.DEV` guard)

**Documentation deliverables:**

- Updated component JSDoc with accessibility notes
- Inline comments explaining motion preference logic
- Updated REPORT.md with test results
- (Optional) Accessibility statement in project docs

**Validation checklist:**

Before marking task complete, verify:
- [ ] Code implemented correctly (phases 1-4)
- [ ] OS reduced motion testing passed (phase 5)
- [ ] Screen reader testing passed (phase 6)
- [ ] Keyboard navigation testing passed (phase 7)
- [ ] Axe audit passed (phase 8)
- [ ] Cross-browser testing passed (phase 9)
- [ ] Code cleanup complete (phase 10)
- [ ] All acceptance criteria met
- [ ] REPORT.md updated
- [ ] Ready for Task 5 (Integration)
