# Deliberation 1

**Task:** Add Scroll-Based Parallax Animation
**Created:** 2025-12-15T21:40:00Z

---

## Review of Prior Thinking

This is the first deliberation for this task. The REPORT.md provides a comprehensive execution plan with 9 steps covering:

1. Setting up scroll state tracking using Svelte 5 runes
2. Implementing IntersectionObserver to track hero viewport visibility
3. Creating throttled scroll listener with requestAnimationFrame
4. Calculating parallax offsets for each layer based on scroll position
5. Applying parallax via CSS custom properties
6. Adding boundary constraints to limit effect
7. Performance testing and optimization
8. Integration testing with existing hero content
9. Code documentation

The approach builds on Tasks 1 and 2, which have successfully implemented:
- **Task 1:** Hero3DBackground.svelte component with 3 geometric shapes
- **Task 2:** CSS 3D transforms with perspective (1200px), translateZ layering (-200px, -150px, -100px), and CSS custom properties architecture

**Key insights from previous tasks:**
- Component uses absolute positioning with z-index 0
- Three shapes configured with parallax multipliers (0.5, 0.8, 1.2)
- CSS custom properties already set up: `--hero-3d-scroll-offset`, `--hero-3d-mouse-x`, `--hero-3d-mouse-y`
- Transform calc() expressions already reference these variables (lines 111-113 of Hero3DBackground.svelte)
- All performance optimizations in place (will-change, backface-visibility, GPU acceleration)

**Critical realization:** The CSS infrastructure for parallax is ALREADY IMPLEMENTED in Task 2. The calc() expressions in Hero3DBackground.svelte (line 111) show:
```css
translateZ(calc(var(--shape-{i + 1}-z) + var(--hero-3d-scroll-offset) * var(--shape-{i + 1}-parallax) * 1px))
```

This means Task 3's primary work is **implementing the JavaScript logic to update `--hero-3d-scroll-offset`**, not creating the CSS foundation.

---

## New Insights

### 1. Implementation Location Decision

**Critical Question: Where should the scroll logic live?**

**Option A: Inside Hero3DBackground.svelte**
```typescript
// Inside Hero3DBackground.svelte
let scrollY = $state(0);
let isInViewport = $state(true);

$effect(() => {
  // Set up scroll listener here
});
```
- **Pro:** Self-contained, component manages its own reactivity
- **Pro:** No props needed, simpler interface
- **Con:** Adds JavaScript overhead to a previously pure-CSS component
- **Con:** Scroll listener runs even if component isn't used elsewhere

**Option B: Inside Hero.svelte, pass scrollOffset as prop**
```typescript
// Inside Hero.svelte
let scrollOffset = $state(0);

// Pass to component
<Hero3DBackground scrollOffset={scrollOffset} />
```
- **Pro:** Hero.svelte controls the scroll state
- **Pro:** Could reuse scroll value for other effects (ChevronDown fade, etc.)
- **Con:** Requires modifying Hero3DBackground props interface
- **Con:** Breaks component encapsulation

**Option C: Separate composable/store**
```typescript
// lib/stores/scroll.ts
export const heroScrollOffset = $state(0);
```
- **Pro:** Reusable across components
- **Pro:** Clean separation of concerns
- **Con:** Adds architectural complexity for single-use case
- **Con:** Global state might be overkill

**Recommendation: Option A (Inside Hero3DBackground.svelte)**

**Rationale:**
1. **Encapsulation:** The parallax effect is a feature of the 3D background, not the hero section
2. **Simplicity:** No prop changes, no external dependencies, component is self-sufficient
3. **Performance:** Scroll listener only runs when component is mounted
4. **Svelte 5 patterns:** Uses $effect for lifecycle management, perfectly suited for this
5. **Future-proofing:** If we add mouse parallax, it belongs in the same component

The component already has the CSS infrastructure. Adding the JavaScript logic inside keeps all parallax concerns co-located.

### 2. Scroll State Architecture

**Proposed state variables (inside Hero3DBackground.svelte):**

```typescript
let scrollY = $state(0);          // Raw window.scrollY value
let isInViewport = $state(true);  // Whether hero section is visible
let rafId: number | null = null;  // requestAnimationFrame ID for cleanup
```

**Derived state:**
```typescript
// No need for derived state - we update CSS variable directly
// The CSS calc() expression handles the parallax math
```

**Key insight:** We don't need complex derived calculations. Just update `--hero-3d-scroll-offset` CSS variable with the raw scroll value, and let the CSS calc() expressions (already implemented) handle per-layer parallax rates using the `--shape-N-parallax` multipliers.

### 3. IntersectionObserver Strategy

**Purpose:** Pause scroll listener when hero section is not in viewport to save CPU cycles.

**Implementation approach:**

```typescript
$effect(() => {
  // Need reference to hero section element
  // Since Hero3DBackground is inside Hero.svelte, we can observe the parent

  const heroSection = document.querySelector('[data-hero-section]');
  if (!heroSection) return;

  const observer = new IntersectionObserver(
    (entries) => {
      isInViewport = entries[0].isIntersecting;
    },
    {
      threshold: 0.1,  // Trigger when 10% visible
      rootMargin: '100px' // Start tracking slightly before entering viewport
    }
  );

  observer.observe(heroSection);

  return () => {
    observer.disconnect();
  };
});
```

**Critical requirement:** Hero.svelte must add `data-hero-section` attribute to the `<section>` element.

**Alternative approach:** Instead of `querySelector`, use a Svelte binding:
```svelte
<script>
let heroElement = $state<HTMLElement | null>(null);
</script>

<div bind:this={heroElement} ...>
```

**Problem:** Hero3DBackground doesn't have a parent reference. It's a child component that can't access Hero.svelte's element refs.

**Solution:** Add `data-hero-section` attribute to Hero.svelte's `<section>` tag. This is a minimal, non-invasive change.

### 4. RequestAnimationFrame Throttling Pattern

**Why RAF is essential:**
- Scroll events fire 60+ times per second (every 16ms on modern browsers)
- Each scroll event could trigger expensive calculations
- RAF ensures updates sync with browser paint cycle (efficient)
- Prevents redundant calculations between frames

**Standard RAF throttling pattern:**

```typescript
$effect(() => {
  if (!isInViewport) return; // Don't listen if hero not visible

  let ticking = false;

  const handleScroll = () => {
    if (!ticking) {
      rafId = requestAnimationFrame(() => {
        scrollY = window.scrollY;
        // Update CSS variable here
        updateScrollOffset();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', handleScroll);
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
  };
});
```

**Key points:**
- `passive: true` tells browser the listener won't call preventDefault(), enabling optimizations
- `ticking` flag prevents queueing multiple RAF callbacks
- Cleanup cancels pending RAF and removes listener (prevents memory leaks)
- Entire listener disabled when `isInViewport === false` (conditional $effect)

### 5. CSS Custom Property Update Strategy

**Current CSS infrastructure (from Task 2):**
```css
--hero-3d-scroll-offset: 0;  /* Global input variable */
--shape-1-parallax: 0.5;     /* Per-shape multiplier */
--shape-2-parallax: 0.8;
--shape-3-parallax: 1.2;

transform: translateZ(calc(
  var(--shape-1-z) +
  var(--hero-3d-scroll-offset) * var(--shape-1-parallax) * 1px
));
```

**Update mechanism:**

**Option A: Direct inline style manipulation**
```typescript
const container = heroElement;
container.style.setProperty('--hero-3d-scroll-offset', scrollY.toString());
```
- **Pro:** Direct, no DOM query needed if we have element ref
- **Con:** Need element reference

**Option B: Reactive style binding in template**
```svelte
<div
  style:--hero-3d-scroll-offset={scrollY}
  ...>
```
- **Pro:** Automatic reactivity via Svelte
- **Pro:** Clean, declarative
- **Con:** None really - this is the Svelte way

**Recommendation: Option B (Reactive style binding)**

**Implementation:**
```svelte
<div
  class="absolute inset-0 ..."
  style:--hero-3d-scroll-offset={scrollY}
  style:z-index="0"
  role="presentation"
  aria-hidden="true"
>
```

This automatically updates the CSS variable whenever `scrollY` changes, triggering the transform recalculation via CSS calc().

**Performance consideration:** Svelte's style: directive is highly optimized. It only updates the specific CSS property, not the entire style string. This is more efficient than manual setProperty() calls.

### 6. Boundary Constraints Analysis

**Problem:** Without constraints, scrolling far down the page would continue increasing parallax offset infinitely, even when hero is out of view.

**Solution approaches:**

**Option A: Clamp based on hero section height**
```typescript
const MAX_SCROLL_EFFECT = heroSectionHeight; // e.g., 800px
const clampedScroll = Math.min(scrollY, MAX_SCROLL_EFFECT);
```
- **Pro:** Natural boundary (stops when hero scrolls out)
- **Con:** Requires measuring hero height (potential layout thrash)

**Option B: Use IntersectionObserver ratio**
```typescript
const observer = new IntersectionObserver(
  (entries) => {
    const ratio = entries[0].intersectionRatio;
    isInViewport = ratio > 0;
    // Could use ratio to fade effect as hero leaves viewport
  },
  { threshold: [0, 0.25, 0.5, 0.75, 1] }
);
```
- **Pro:** More sophisticated, gradual effect reduction
- **Con:** More complex, might be overengineering

**Option C: Fixed maximum (simple approach)**
```typescript
const MAX_SCROLL = 500; // Stop parallax after 500px of scrolling
const scrollOffset = Math.min(scrollY, MAX_SCROLL);
```
- **Pro:** Simple, predictable, no DOM measurements
- **Pro:** Prevents runaway offset values
- **Con:** Arbitrary value, might need tuning

**Recommendation: Option C for MVP, with Option A as enhancement**

**Rationale:**
1. Simple to implement (one Math.min() call)
2. No layout measurements (performance-friendly)
3. Easy to tune (just adjust MAX_SCROLL constant)
4. Can evolve to Option A later if needed

**Proposed value:** 500px
- Hero section is min-h-screen (typically 800-1000px)
- 500px ensures effect covers most of hero visibility
- Conservative - keeps parallax subtle even with fast scrolling

### 7. Performance Optimization Deep Dive

**Current optimizations (already in place from Task 2):**
- ✅ GPU acceleration via translateZ()
- ✅ will-change: transform on animated elements
- ✅ backface-visibility: hidden
- ✅ Single transform property (not multiple)
- ✅ Minimal DOM elements (3 shapes)

**New optimizations for Task 3:**

**1. Passive scroll listeners**
```typescript
window.addEventListener('scroll', handleScroll, { passive: true });
```
Tells browser we won't preventDefault(), enabling scroll optimizations.

**2. RAF throttling**
Already covered - ensures max one update per frame.

**3. Conditional activation via IntersectionObserver**
Only runs scroll listener when hero is in viewport. Massive savings when user scrolls past hero.

**4. CSS variable updates (not style recalculation)**
Updating `--hero-3d-scroll-offset` triggers only transform recalculation, not layout or paint. This is the fastest update path.

**5. Integer values for scroll offset**
```typescript
scrollY = Math.round(window.scrollY);
```
Avoids sub-pixel rendering issues, slightly faster calculations.

**Performance budget for this task:**
- **Target:** Maintain 60fps on desktop, 30fps on mobile
- **Current:** 0% CPU (static CSS)
- **Expected after Task 3:** < 5% CPU (scroll listener + RAF + CSS variable update)
- **Risk areas:** Low-end mobile devices, especially during fast scrolling

**Testing protocol:**
1. Chrome DevTools Performance tab: Record during scroll, verify 60fps
2. CPU throttling (4x slowdown): Verify >= 30fps
3. Memory profiler: Check for leaks (mount/unmount/scroll/remount)
4. Mobile device testing: Real iOS/Android device if available

### 8. Svelte 5 Runes Implementation Pattern

**State management:**
```typescript
let scrollY = $state(0);
let isInViewport = $state(true);
```

**Effects (lifecycle):**
```typescript
// Effect 1: IntersectionObserver
$effect(() => {
  const heroSection = document.querySelector('[data-hero-section]');
  // ... observer setup
  return () => observer.disconnect();
});

// Effect 2: Scroll listener (conditional on isInViewport)
$effect(() => {
  if (!isInViewport) return;

  let ticking = false;
  const handleScroll = () => { /* ... */ };

  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', handleScroll);
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
});
```

**Key pattern:** Two separate $effect blocks:
1. **Observer effect:** Always runs, tracks visibility
2. **Scroll effect:** Conditionally runs based on isInViewport

This ensures scroll listener is properly cleaned up when hero leaves viewport.

**Reactivity flow:**
1. User scrolls → scroll event fires
2. handleScroll queues RAF callback
3. RAF callback updates scrollY state
4. Svelte detects scrollY change
5. Template re-renders, updating style:--hero-3d-scroll-offset
6. CSS calc() recalculates transforms
7. Browser paints new transform (GPU-accelerated)

**No derived state needed** - CSS handles all calculations.

### 9. Integration with Existing Hero.svelte

**Required change to Hero.svelte:**

Add `data-hero-section` attribute to the main `<section>` element:

```svelte
<section
  class="relative min-h-screen flex flex-col items-center justify-center text-center px-4 [perspective:1200px]"
  data-hero-section
>
```

**Why this approach:**
- Minimal invasiveness (one attribute)
- No structural changes
- No prop passing needed
- Semantic (clearly identifies hero section)
- Accessible (doesn't affect screen readers)

**No other Hero.svelte changes required** - all logic lives in Hero3DBackground.svelte.

### 10. Accessibility Considerations

**Current task scope (Task 3):**
- Parallax is a visual enhancement, no interactive elements
- Doesn't affect keyboard navigation
- Doesn't interfere with screen readers (aria-hidden already set in Task 1)

**Preparation for Task 4 (prefers-reduced-motion):**
- Structure scroll listener so it can be conditionally disabled
- Use media query check: `window.matchMedia('(prefers-reduced-motion: reduce)')`
- When reduced motion is preferred, don't set up scroll listener at all

**Implementation preview (will be in Task 4):**
```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

$effect(() => {
  if (prefersReducedMotion || !isInViewport) return;
  // ... scroll listener setup
});
```

**For Task 3:** No accessibility implementation required. The static 3D depth (Task 2) remains visible; only the scroll-based movement is added.

---

## Questions Resolved

**Q: Where should the scroll tracking logic be implemented?**
**A:** Inside Hero3DBackground.svelte using Svelte 5 $state and $effect runes. This keeps the component self-contained and aligns with the principle of co-locating related concerns.

**Q: How do we get a reference to the hero section for IntersectionObserver?**
**A:** Add a `data-hero-section` attribute to Hero.svelte's `<section>` tag, then query it with `document.querySelector('[data-hero-section]')`. This is minimal and non-invasive.

**Q: Should we use a derived state for parallax calculations?**
**A:** No. The CSS calc() expressions (already implemented in Task 2) handle all calculations. We only need to update the `--hero-3d-scroll-offset` CSS variable with the raw scroll value.

**Q: How do we update CSS custom properties reactively?**
**A:** Use Svelte's `style:` directive: `style:--hero-3d-scroll-offset={scrollY}`. This is declarative, automatic, and optimized by Svelte.

**Q: What should the boundary constraint be for scroll offset?**
**A:** Use a simple max value of 500px: `Math.min(scrollY, 500)`. This prevents infinite offset growth and is easy to tune.

**Q: How do we ensure 60fps performance?**
**A:** Combine passive scroll listeners, RAF throttling, IntersectionObserver (pause when invisible), and CSS custom property updates (fastest path). All best practices implemented.

**Q: Should scroll listener always be active?**
**A:** No. Use IntersectionObserver to detect when hero is in viewport. Only run scroll listener when `isInViewport === true`. This saves CPU when user scrolls past hero.

**Q: What cleanup is required?**
**A:** Three cleanup tasks in $effect return functions: (1) disconnect IntersectionObserver, (2) remove scroll event listener, (3) cancel pending requestAnimationFrame.

---

## Open Questions

**Q1: What is the optimal MAX_SCROLL value?**
- Proposal: 500px (conservative, covers most hero visibility)
- Alternative: 800px (full hero height on typical screens)
- Alternative: Dynamic based on hero section height (requires measurement)
- **Decision needed:** Start with 500px, test visually, adjust if parallax feels cut off too early

**Q2: Should we add easing to the parallax effect?**
- Linear (current): `scrollY` directly maps to offset
- Eased: Apply easing function (e.g., ease-out) for smoother feel
- Example: `scrollOffset = scrollY * (1 - Math.pow(1 - scrollY / MAX_SCROLL, 2))`
- **Decision needed:** Implement linear first (simpler). Add easing only if parallax feels too "robotic" during testing. Likely not needed.

**Q3: Should parallax reverse when scrolling up?**
- Currently: Yes, automatically (scrollY decreases, offset decreases)
- Could: Add smoothing/lerping for momentum feel
- **Decision needed:** Keep default behavior (immediate reversal). Smoothing adds complexity and might feel laggy. Re-evaluate after user testing if needed.

**Q4: How should we handle horizontal scrolling (edge case)?**
- Currently: Only track window.scrollY (vertical)
- Could: Ignore, or disable parallax if horizontal scroll detected
- **Decision needed:** Ignore horizontal scroll. Hero is full-width, horizontal scroll unlikely. Not worth complexity.

**Q5: Should we use a different RAF pattern (timestamp-based)?**
- Current proposal: Simple ticking flag
- Alternative: Timestamp-based throttling (limit to e.g., 60fps max)
- **Decision needed:** Stick with simple pattern. RAF already syncs to display refresh rate (~60fps). Additional throttling unnecessary.

**Q6: Should scroll offset be normalized (0-1 range)?**
- Currently: Raw pixel value (0 to MAX_SCROLL)
- Alternative: Normalize to 0-1 range: `scrollOffset = Math.min(scrollY / MAX_SCROLL, 1)`
- CSS would need adjustment: `... * var(--hero-3d-scroll-offset) * MAX_SCROLL_PX`
- **Decision needed:** Keep raw pixel values. Simpler, more intuitive, CSS multipliers already configured. Normalization adds unnecessary complexity.

**Q7: What if querySelector doesn't find the hero section?**
- Possible if component mounts before Hero.svelte
- Could: Add error handling, console.warn, or retry logic
- **Decision needed:** Return early from $effect if element not found. This is safe - effect will run again on next state change. Document requirement in code comments.

**Q8: Should we debounce resize events?**
- Currently: Not tracking resize
- Could: Re-measure hero section height on resize (if using dynamic MAX_SCROLL)
- **Decision needed:** Not needed for MVP. Using fixed MAX_SCROLL value. Add only if we implement dynamic boundary in future enhancement.

---

## Confidence Assessment

| Aspect | Confidence | Notes |
|--------|------------|-------|
| **Understanding** | **Very High** | Task 2 already implemented CSS infrastructure. Clear understanding of Svelte 5 runes, RAF patterns, and IntersectionObserver API. |
| **Approach** | **Very High** | Implementation location (Hero3DBackground.svelte) is optimal. Scroll tracking pattern is proven. CSS variable update via style: directive is Svelte best practice. |
| **Risks identified** | **High** | Known risks: performance on low-end mobile, querySelector timing, scroll listener cleanup. All have clear mitigations. |
| **Performance concerns** | **High** | All optimizations identified and planned: passive listeners, RAF throttling, IntersectionObserver, CSS variables. Expected CPU impact < 5%. |
| **Visual outcome** | **Medium-High** | Parallax multipliers (0.5, 0.8, 1.2) are mathematically sound. MAX_SCROLL value might need tuning. Easy to adjust. |
| **Integration complexity** | **Very High** | Minimal changes: one attribute to Hero.svelte, all logic in Hero3DBackground. No prop changes, no refactoring. |
| **Browser compatibility** | **Very High** | IntersectionObserver: 95%+ support. RAF: universal. CSS variables: universal. Passive listeners: 96%+ support. All modern browser features. |
| **Code complexity** | **Medium** | Two $effect blocks, RAF pattern, state management. Not trivial but well-structured. Svelte 5 patterns make it cleaner than traditional approach. |

**Overall confidence: VERY HIGH**

This task has a clear implementation path with minimal risks. The CSS foundation is already in place, so we're just adding the JavaScript reactivity. Svelte 5 runes provide clean patterns for this exact use case.

---

## Detailed Technical Plan

### Phase 1: Add data-hero-section Attribute (2 min)

**File:** `/Users/devplex/Documents/Projects/Development/carlelieser/carlos-santos-site/src/lib/components/sections/Hero.svelte`

**Action:** Add `data-hero-section` to main `<section>` tag

**Before:**
```svelte
<section class="relative min-h-screen ... [perspective:1200px]">
```

**After:**
```svelte
<section
  class="relative min-h-screen ... [perspective:1200px]"
  data-hero-section
>
```

**Validation:** Inspect element in browser DevTools, verify attribute is present.

---

### Phase 2: Add State Variables (3 min)

**File:** `/Users/devplex/Documents/Projects/Development/carlelieser/carlos-santos-site/src/lib/components/effects/Hero3DBackground.svelte`

**Action:** Add scroll tracking state after existing props

**Implementation:**
```typescript
// After existing props (line 28)

/**
 * Scroll-based parallax state
 */
let scrollY = $state(0);              // Current scroll position
let isInViewport = $state(true);      // Whether hero is visible
let rafId: number | null = null;      // requestAnimationFrame ID

const MAX_SCROLL = 500; // Maximum scroll offset for parallax effect
```

**Validation:** TypeScript compilation succeeds, no errors.

---

### Phase 3: Implement IntersectionObserver (10 min)

**Action:** Add first $effect block for viewport tracking

**Implementation:**
```typescript
/**
 * Track hero section visibility to pause parallax when out of view
 * Improves performance by disabling scroll listener when not needed
 */
$effect(() => {
  const heroSection = document.querySelector('[data-hero-section]');

  if (!heroSection) {
    console.warn('Hero3DBackground: Hero section not found. Ensure Hero.svelte has data-hero-section attribute.');
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      isInViewport = entries[0].isIntersecting;
    },
    {
      threshold: 0.1,      // Trigger when 10% of hero is visible
      rootMargin: '100px'  // Start tracking slightly before entering viewport
    }
  );

  observer.observe(heroSection);

  // Cleanup: disconnect observer when component unmounts
  return () => {
    observer.disconnect();
  };
});
```

**Validation:**
- Add `console.log('isInViewport:', isInViewport)` inside effect
- Scroll page, verify logs show true/false changes
- Check browser DevTools for warning if hero section not found

---

### Phase 4: Implement Scroll Listener with RAF (15 min)

**Action:** Add second $effect block for scroll tracking

**Implementation:**
```typescript
/**
 * Track scroll position and update parallax offset
 * Uses requestAnimationFrame for performance (max one update per frame)
 * Only active when hero section is in viewport
 */
$effect(() => {
  // Don't set up scroll listener if hero not visible
  if (!isInViewport) return;

  let ticking = false; // Prevents multiple RAF callbacks from queueing

  const handleScroll = () => {
    if (!ticking) {
      rafId = requestAnimationFrame(() => {
        // Update scroll position with boundary constraint
        scrollY = Math.min(window.scrollY, MAX_SCROLL);
        ticking = false;
      });
      ticking = true;
    }
  };

  // Passive: true enables browser scroll optimizations
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Cleanup: remove listener and cancel pending animation frame
  return () => {
    window.removeEventListener('scroll', handleScroll);
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
});
```

**Validation:**
- Add `console.log('scrollY:', scrollY)` inside RAF callback
- Scroll page, verify logs show values from 0 to 500 (MAX_SCROLL)
- Scroll past 500px, verify value caps at 500
- Scroll back up, verify value decreases

---

### Phase 5: Update CSS Variable Binding (5 min)

**Action:** Modify template to bind scrollY to CSS variable

**Current (line 77-82):**
```svelte
<div
  class="absolute inset-0 overflow-hidden pointer-events-none [transform-style:preserve-3d]"
  style="
    z-index: 0;
    --hero-3d-scroll-offset: 0;
    --hero-3d-mouse-x: 0;
    --hero-3d-mouse-y: 0;
  "
  role="presentation"
  aria-hidden="true"
>
```

**Updated:**
```svelte
<div
  class="absolute inset-0 overflow-hidden pointer-events-none [transform-style:preserve-3d]"
  style:z-index="0"
  style:--hero-3d-scroll-offset={scrollY}
  style:--hero-3d-mouse-x={0}
  style:--hero-3d-mouse-y={0}
  role="presentation"
  aria-hidden="true"
>
```

**Validation:**
- Inspect element in DevTools
- Verify --hero-3d-scroll-offset changes as you scroll
- Check that it updates from 0 to 500

---

### Phase 6: Visual Verification (10 min)

**Action:** Test parallax effect in browser

**Test cases:**
1. **Slow scroll down:** Shapes should move at different rates (subtle parallax)
2. **Slow scroll up:** Shapes should reverse direction smoothly
3. **Fast scroll:** No visual glitches, smooth throughout
4. **Scroll to 500px+:** Effect should stabilize (not increase infinitely)
5. **Scroll past hero section:** Verify effect pauses (check console for isInViewport: false)
6. **Scroll back to hero:** Effect should resume

**Visual checks:**
- Shape 1 (parallax 0.5): moves slowest (most distant)
- Shape 2 (parallax 0.8): moves medium speed
- Shape 3 (parallax 1.2): moves fastest (closest)
- Depth perception enhanced by differential movement
- Effect is subtle, not distracting
- No text obscuring or CTA interference

**Validation:** All test cases pass, visual effect enhances depth.

---

### Phase 7: Performance Profiling (15 min)

**Action:** Verify 60fps and low CPU usage

**Chrome DevTools Performance:**
1. Open DevTools > Performance tab
2. Click Record
3. Scroll through hero section multiple times (up and down)
4. Stop recording after 10 seconds

**Analysis:**
- Check frame rate: Should be solid 60fps green line
- Look for dropped frames: Should be none (or very few)
- Check Scripting time: Should be < 5% of total
- Verify RAF callbacks: Should see requestAnimationFrame entries
- Check for long tasks: Should be none > 50ms

**CPU Throttling Test:**
1. DevTools > Performance > CPU: 4x slowdown
2. Record while scrolling
3. Verify frame rate >= 30fps (acceptable for throttled)

**Memory Test:**
1. DevTools > Memory > Take heap snapshot
2. Scroll several times
3. Take second snapshot
4. Compare: Should be no significant growth (no leaks)

**Validation:**
- 60fps on desktop: PASS
- >= 30fps on 4x throttled: PASS
- No memory leaks: PASS
- No console errors: PASS

---

### Phase 8: Cross-Browser Testing (15 min)

**Chrome:**
- Test parallax effect works
- Verify smooth scrolling
- Check DevTools for errors

**Firefox:**
- Test parallax effect consistency
- Verify RAF throttling works
- Check console for warnings

**Safari:**
- Test on macOS Safari
- Verify IntersectionObserver works
- Check for rendering quirks

**Mobile (if available):**
- iOS Safari: Test on iPhone or simulator
- Chrome Android: Test on Android device or emulator
- Verify performance acceptable (>= 30fps)

**Validation:** Consistent behavior across all tested browsers.

---

### Phase 9: Code Documentation (10 min)

**Action:** Add comprehensive JSDoc comments

**Additions:**
1. Document state variables with purpose and type
2. Add comments explaining RAF throttling pattern
3. Document IntersectionObserver usage and rationale
4. Explain MAX_SCROLL boundary constraint
5. Add performance notes (why passive, why RAF, why IntersectionObserver)

**Example documentation:**
```typescript
/**
 * Maximum scroll distance (in pixels) that affects parallax.
 * Prevents infinite offset growth as user scrolls far down the page.
 *
 * Value of 500px covers most of hero section viewport on typical screens.
 * Adjust if parallax effect feels cut off too early.
 */
const MAX_SCROLL = 500;
```

**Validation:**
- All state variables documented
- All complex logic explained
- Future maintainers can understand approach

---

### Phase 10: Integration Testing (10 min)

**Action:** Test with full hero content

**Test scenarios:**
1. **Text readability:** Ensure parallax doesn't distract from reading hero text
2. **CTA clickability:** Verify Patreon and Projects buttons work correctly
3. **ChevronDown animation:** Ensure scroll indicator still bounces (no conflict)
4. **Keyboard navigation:** Tab through CTAs, verify focus visible
5. **Responsive design:** Test on mobile viewport (sm, md, lg breakpoints)
6. **Dark mode:** Test in both light and dark themes
7. **Gradient interaction:** Verify 3D shapes complement existing gradient

**Edge cases:**
- Very short viewport height (< 600px)
- Very tall viewport (> 1200px)
- Rapid scroll direction changes
- Scrolling with keyboard (Page Down, Space, Arrow keys)

**Validation:** All scenarios pass, no regressions, effect enhances UX.

---

### Phase 11: Final Cleanup (5 min)

**Action:** Remove debugging code and finalize

**Checklist:**
- [ ] Remove all console.log statements
- [ ] Remove any commented-out code
- [ ] Verify no TypeScript errors: `npm run check`
- [ ] Verify build succeeds: `npm run build`
- [ ] Format code: `npm run format` (if available)
- [ ] Lint code: `npm run lint` (if available)
- [ ] Git diff review: Check all changes make sense

**Validation:** Clean, production-ready code with no debugging artifacts.

---

## Risk Assessment - Detailed

### Risk 1: Performance Degradation on Scroll

**Probability:** Medium
**Impact:** High (could cause stuttering, poor UX)

**Specific scenarios:**
- Scroll listener fires too frequently, overwhelming CPU
- CSS variable updates trigger layout/paint instead of just composite
- Multiple layers cause expensive transform recalculations
- Mobile devices struggle with continuous updates

**Mitigation strategy:**
1. Use passive scroll listeners (enables browser optimizations)
2. RAF throttling ensures max one update per frame (16ms)
3. IntersectionObserver pauses effect when hero not visible (major savings)
4. CSS variable updates trigger only transform recalc (fastest path)
5. Limited to 3 shapes with pre-calculated multipliers (minimal complexity)
6. Test with CPU throttling early to catch issues

**Validation:**
- Chrome DevTools Performance: 60fps during scroll
- 4x CPU throttling: >= 30fps
- Real mobile device testing
- No frame drops or stuttering

**Fallback:** If performance issues persist, reduce MAX_SCROLL or disable on mobile via media query.

---

### Risk 2: IntersectionObserver Doesn't Find Hero Section

**Probability:** Low
**Impact:** Medium (parallax would run continuously, wasting CPU)

**Specific scenarios:**
- Hero3DBackground mounts before Hero.svelte adds data-hero-section
- Typo in querySelector selector
- SSR/hydration timing issues in SvelteKit

**Mitigation strategy:**
1. Add console.warn if element not found (alerts developer)
2. Return early from $effect if heroSection is null (safe fallback)
3. Document requirement in Hero3DBackground JSDoc comments
4. Verify attribute exists in Phase 1 testing
5. Consider using `window.document.body.querySelector` for broader scope

**Validation:**
- Manual testing: verify warning doesn't appear in console
- Inspect Hero.svelte DOM: confirm data-hero-section attribute present
- Test SSR: `npm run build && npm run preview`, verify works

**Fallback:** If querySelector consistently fails, fall back to always-on scroll listener (less optimal but functional).

---

### Risk 3: Scroll Listener Memory Leak

**Probability:** Low
**Impact:** High (memory leak in long-lived apps)

**Specific scenarios:**
- Event listener not removed on component unmount
- RAF callback continues running after unmount
- IntersectionObserver not disconnected
- $effect cleanup functions not called

**Mitigation strategy:**
1. Always return cleanup function from $effect
2. Remove event listener in cleanup: `removeEventListener`
3. Cancel RAF in cleanup: `cancelAnimationFrame(rafId)`
4. Disconnect observer in cleanup: `observer.disconnect()`
5. Test by mounting/unmounting component multiple times
6. Use Chrome DevTools Memory profiler to detect leaks

**Validation:**
- Memory snapshot test: mount, scroll, unmount, repeat 10x, compare snapshots
- Verify cleanup functions are called (add console.log, check on unmount)
- Check Chrome Task Manager: memory shouldn't grow after unmount

**Fallback:** If leak detected, review cleanup logic, ensure all listeners/observers are properly removed.

---

### Risk 4: Parallax Effect Too Subtle or Too Aggressive

**Probability:** Medium
**Impact:** Medium (might not achieve desired visual impact)

**Specific scenarios:**
- Parallax multipliers (0.5, 0.8, 1.2) create imperceptible movement
- MAX_SCROLL too low (effect cuts off early)
- MAX_SCROLL too high (effect too linear/flat)
- Different screen sizes perceive depth differently

**Mitigation strategy:**
1. Implement with current values (based on Task 2 deliberation)
2. Make MAX_SCROLL a constant for easy adjustment
3. Test on multiple screen sizes (laptop, desktop, mobile)
4. Get peer/stakeholder feedback on visual appeal
5. Be prepared to iterate: adjust multipliers or MAX_SCROLL
6. Document rationale for values chosen

**Validation:**
- Visual review on 3+ screen sizes
- Peer feedback session
- A/B test with alternative values if uncertain
- Verify depth perception enhanced, not distracting

**Adjustment options:**
- Increase multipliers: 0.6, 1.0, 1.4 (more dramatic)
- Decrease multipliers: 0.3, 0.5, 0.8 (more subtle)
- Increase MAX_SCROLL: 800px (longer effect range)
- Decrease MAX_SCROLL: 300px (more concentrated effect)

---

### Risk 5: Browser Inconsistencies with IntersectionObserver

**Probability:** Low
**Impact:** Low (fallback is acceptable)

**Specific scenarios:**
- IntersectionObserver not supported (< 5% of browsers)
- Threshold behavior differs between browsers
- rootMargin interpreted inconsistently
- Safari-specific quirks

**Mitigation strategy:**
1. Use standard IntersectionObserver API (95%+ support)
2. Provide fallback: if (!('IntersectionObserver' in window)), assume always in viewport
3. Test across browsers (Chrome, Firefox, Safari)
4. Use simple options (threshold: 0.1, rootMargin: '100px')
5. Don't rely on complex threshold arrays (keep it simple)

**Validation:**
- Test in Chrome, Firefox, Safari
- Verify threshold triggering is consistent
- Check MDN compatibility table for edge cases

**Fallback implementation:**
```typescript
if (!('IntersectionObserver' in window)) {
  // Old browser, assume hero always in viewport
  isInViewport = true;
  // Skip observer setup
} else {
  // Normal IntersectionObserver logic
}
```

---

### Risk 6: Svelte Reactivity Not Updating CSS Variable

**Probability:** Very Low
**Impact:** High (parallax wouldn't work)

**Specific scenarios:**
- style: directive doesn't trigger CSS variable update
- Svelte doesn't detect scrollY state changes
- CSS calc() doesn't recalculate on variable change
- Race condition between JS and CSS

**Mitigation strategy:**
1. Use Svelte's style: directive (reliable, optimized)
2. Ensure scrollY is $state (not plain variable)
3. Test reactivity with console.log and DevTools inspection
4. Verify in DevTools that CSS variable updates in real-time
5. Trust Svelte's reactivity system (well-tested, mature)

**Validation:**
- DevTools Elements panel: inspect div, watch --hero-3d-scroll-offset change as you scroll
- Visual verification: shapes move as expected
- Console logging: verify scrollY state updates

**Debugging:**
- If reactivity fails, check: Is scrollY wrapped in $state? Is style: syntax correct? Is component re-rendering?

---

## Implementation Checklist

Comprehensive task list for execution:

**Prerequisites:**
- [ ] Task 1 complete (Hero3DBackground.svelte exists)
- [ ] Task 2 complete (CSS 3D transforms and custom properties set up)
- [ ] Development server running (`npm run dev`)
- [ ] Browser DevTools open for debugging

**Phase 1: Hero.svelte Modification**
- [ ] Open Hero.svelte
- [ ] Add `data-hero-section` attribute to `<section>` tag
- [ ] Save file
- [ ] Verify in browser DevTools that attribute appears

**Phase 2: State Setup**
- [ ] Open Hero3DBackground.svelte
- [ ] Add `scrollY`, `isInViewport`, `rafId` state variables
- [ ] Add `MAX_SCROLL` constant (500)
- [ ] Run `npm run check` - verify no TypeScript errors
- [ ] Add JSDoc comments for new variables

**Phase 3: IntersectionObserver**
- [ ] Add first $effect block for observer
- [ ] Query `[data-hero-section]`
- [ ] Set up observer with threshold 0.1, rootMargin 100px
- [ ] Update `isInViewport` in callback
- [ ] Add cleanup: disconnect observer
- [ ] Add console.warn if element not found
- [ ] Test: scroll page, check console for isInViewport logs

**Phase 4: Scroll Listener**
- [ ] Add second $effect block for scroll tracking
- [ ] Add conditional: return early if !isInViewport
- [ ] Implement RAF throttling pattern with ticking flag
- [ ] Update scrollY with Math.min(window.scrollY, MAX_SCROLL)
- [ ] Add scroll listener with passive: true
- [ ] Add cleanup: removeEventListener and cancelAnimationFrame
- [ ] Test: scroll page, check console for scrollY logs (0-500)

**Phase 5: CSS Variable Binding**
- [ ] Modify template div style attributes
- [ ] Replace `--hero-3d-scroll-offset: 0` with `style:--hero-3d-scroll-offset={scrollY}`
- [ ] Replace inline style string with individual style: directives
- [ ] Save file
- [ ] Inspect in DevTools: verify CSS variable updates on scroll

**Phase 6: Visual Testing**
- [ ] Test slow scroll down (verify parallax visible)
- [ ] Test slow scroll up (verify reversal)
- [ ] Test fast scroll (verify smoothness)
- [ ] Test scroll past 500px (verify capping)
- [ ] Test scroll past hero section (verify pause)
- [ ] Verify shape 1 moves slowest (parallax 0.5)
- [ ] Verify shape 3 moves fastest (parallax 1.2)
- [ ] Verify depth perception enhanced

**Phase 7: Performance Profiling**
- [ ] Chrome DevTools Performance: record during scroll
- [ ] Verify 60fps (green line, no drops)
- [ ] Check scripting time (< 5% of total)
- [ ] CPU throttling 4x: verify >= 30fps
- [ ] Memory profiling: mount/scroll/unmount 10x, check for growth
- [ ] No console errors or warnings
- [ ] Lighthouse audit (optional): Performance >= 90

**Phase 8: Cross-Browser Testing**
- [ ] Test in Chrome (verify all features work)
- [ ] Test in Firefox (verify consistency)
- [ ] Test in Safari (verify IntersectionObserver works)
- [ ] Test on mobile (iOS Safari or Android Chrome if available)
- [ ] Verify no browser-specific errors in console

**Phase 9: Documentation**
- [ ] Add JSDoc for scrollY, isInViewport, rafId
- [ ] Document MAX_SCROLL rationale
- [ ] Add comments explaining RAF pattern
- [ ] Document IntersectionObserver purpose
- [ ] Add performance notes (passive, RAF, observer)
- [ ] Document browser compatibility notes

**Phase 10: Integration Testing**
- [ ] Test text readability (not obscured)
- [ ] Test CTA clickability (Patreon, Projects buttons)
- [ ] Test ChevronDown animation (no conflicts)
- [ ] Test keyboard navigation (Tab focus visible)
- [ ] Test responsive (sm, md, lg breakpoints)
- [ ] Test dark mode (verify in both themes)
- [ ] Test edge cases (short viewport, rapid scroll changes)

**Phase 11: Cleanup**
- [ ] Remove all console.log debugging statements
- [ ] Remove commented-out code
- [ ] Run `npm run check` - 0 errors
- [ ] Run `npm run build` - successful
- [ ] Run formatter (if available)
- [ ] Run linter (if available)
- [ ] Git diff review - all changes intentional

**Final Validation:**
- [ ] All acceptance criteria met (from REPORT.md)
- [ ] All definition of done items complete
- [ ] Performance maintains 60fps
- [ ] No memory leaks
- [ ] No console errors
- [ ] Code is clean and documented
- [ ] Ready for Task 4 (accessibility)

---

## Recommendation

**READY**

This task is ready for immediate execution. The implementation path is crystal clear, the CSS foundation is already in place, and the approach is proven.

**Key factors supporting readiness:**

1. **Strong Foundation:** Tasks 1 and 2 are complete and verified. CSS custom property infrastructure is already implemented. Only JavaScript reactivity logic is needed.

2. **Clear Scope:** This task is well-bounded - add scroll tracking, update one CSS variable. No complex calculations, no architectural changes.

3. **Proven Patterns:** IntersectionObserver, RAF throttling, and Svelte 5 $effect are well-documented patterns. No experimental techniques.

4. **Minimal Changes:** One attribute to Hero.svelte, scroll logic to Hero3DBackground.svelte. Non-invasive, low risk.

5. **Easy Iteration:** MAX_SCROLL is a tunable constant. Parallax multipliers already set in Task 2. Visual refinement is straightforward.

6. **Performance Optimized:** All best practices identified and planned. Expected CPU impact minimal (< 5%).

7. **Comprehensive Testing Plan:** Clear validation steps at each phase. Performance profiling protocol defined. Cross-browser testing scoped.

**Execution strategy:**

1. **Sequential implementation:** Follow 11-phase plan exactly
2. **Test early and often:** Verify after each phase (don't wait until end)
3. **Visual validation priority:** Test visual effect immediately after Phase 6
4. **Performance check at Phase 7:** Don't proceed if 60fps not maintained
5. **Iterate if needed:** MAX_SCROLL and multipliers are easy to adjust

**Success criteria for task completion:**

- [ ] Shapes move at different rates when scrolling (parallax visible)
- [ ] Effect is subtle and enhances depth (not distracting)
- [ ] Solid 60fps performance on desktop during scroll
- [ ] >= 30fps on CPU-throttled testing
- [ ] Scroll listener properly pauses when hero out of view
- [ ] No memory leaks (verified with profiler)
- [ ] No console errors or warnings
- [ ] Works across Chrome, Firefox, Safari
- [ ] Code is clean, documented, production-ready
- [ ] Ready for Task 4 (prefers-reduced-motion implementation)

**Blockers/Dependencies:**

- **Task 2 must be complete:** CSS custom properties must be set up ✅ (verified in VERIFICATION.md)
- **Development server running:** Need live preview for testing
- **Browser DevTools available:** Required for debugging and profiling

**Estimated time:** 1.5-2 hours including testing and documentation

**Confidence level: VERY HIGH**

All unknowns have been resolved through deliberation. The technical approach is sound, risks are mitigated, and the path forward is clear. The main execution work is straightforward Svelte 5 reactivity implementation.

**Next steps:**

1. Verify Tasks 1 and 2 are complete (check VERIFICATION.md files) ✅ Done
2. Start development server: `npm run dev`
3. Execute Phase 1: Add data-hero-section attribute
4. Execute Phases 2-11 sequentially
5. Document any deviations or learnings
6. Update REPORT.md with final values (if MAX_SCROLL was adjusted)

**Proceed with execution immediately.**

---

## Additional Notes

**Potential enhancements for future iterations (not in scope for Task 3):**

1. **Mouse parallax:** Add `--hero-3d-mouse-x/y` tracking (mentioned in Task 2 CSS but not implemented yet)
2. **Easing function:** Apply smooth easing to parallax for more organic feel
3. **Intersection ratio gradient:** Use intersection ratio to fade effect as hero leaves viewport
4. **Dynamic MAX_SCROLL:** Calculate based on hero section height instead of fixed 500px
5. **Scroll velocity:** Add momentum/inertia effect based on scroll speed
6. **Configurable via props:** Make MAX_SCROLL and parallax multipliers customizable
7. **Performance mode:** Auto-disable on low-end devices via device detection

**Known limitations (acceptable for MVP):**

- Parallax only responds to vertical scroll (no horizontal scroll support)
- Fixed MAX_SCROLL value (not dynamic based on hero height)
- No easing function (linear movement)
- No mouse parallax yet (planned for future, CSS vars already set up)
- Assumes modern browser (IntersectionObserver support)

**Testing notes:**

- Focus on Chrome for initial development (best DevTools)
- Test Safari early (known for IntersectionObserver quirks)
- Mobile testing critical (performance more constrained)
- Use throttling aggressively (4x-6x) to simulate low-end devices

**Code quality standards:**

- Follow existing code style in Hero3DBackground.svelte
- Use consistent naming (camelCase for variables, SCREAMING_SNAKE_CASE for constants)
- JSDoc comments for all state variables and effects
- Inline comments for complex logic (RAF pattern, observer setup)
- TypeScript strict mode compliance

**Documentation requirements:**

- Update REPORT.md with actual MAX_SCROLL value used
- Note any deviations from planned approach
- Document performance metrics achieved (fps, CPU %)
- Add notes on browser-specific quirks encountered
- Recommend any follow-up tasks or enhancements
