# Deliberation 1

**Task:** Performance Testing and Optimization
**Created:** 2025-12-15T22:15:00Z

---

## Review of Prior Thinking

This is the first deliberation for Task 6: Performance Testing and Optimization. The REPORT.md provides an 11-step execution plan covering:

1. Setup performance testing environment
2. Baseline performance profiling
3. CPU throttling tests
4. Lighthouse performance audit
5. Bundle size analysis
6. Memory leak testing
7. Real mobile device testing
8. Layout stability verification
9. Cross-browser performance comparison
10. Optimization implementation (if needed)
11. Performance documentation

**Context from completed tasks:**

**Task 1-2: Component Structure & CSS 3D Transforms**
- Pure CSS implementation using `perspective: 1200px` on hero section
- Three geometric shapes with `translateZ()` values: -200px, -150px, -100px
- GPU-accelerated transforms with `will-change: transform` and `backface-visibility: hidden`
- Zero JavaScript overhead in the component itself initially

**Task 3: Scroll-Based Parallax**
- Added JavaScript reactivity using Svelte 5 $state and $effect runes
- IntersectionObserver pauses scroll listener when hero not in viewport (major performance win)
- RequestAnimationFrame throttling for scroll updates (max 60 updates/second)
- Passive scroll listeners enable browser optimizations
- CSS custom property updates (`--hero-3d-scroll-offset`) trigger only transform recalculation (fastest path)
- Boundary constraint: MAX_SCROLL = 500px prevents infinite offset growth

**Task 4: Accessibility**
- prefers-reduced-motion detection implemented
- All animations disabled when user prefers reduced motion
- Decorative background properly hidden from screen readers (aria-hidden="true")

**Task 5: Integration**
- Successfully integrated into Hero.svelte with zero layout shift (CLS: 0.0)
- Z-index hierarchy clean (background: 0, content: 10)
- Initial testing showed 60fps on desktop, Lighthouse Performance 95+
- Shapes use low opacity (0.2) for subtlety

**Critical insights from prior deliberations:**

From Task 3 Deliberation:
> "Performance budget for this task: Target 60fps desktop, 30fps mobile. Current: 0% CPU (static CSS). Expected after Task 3: < 5% CPU"

From Task 1 Deliberation:
> "Risk 3: Performance on Low-End Mobile - Use will-change: transform judiciously. Avoid backdrop-filter on mobile. Reduce number of shapes on mobile."

From Task 5 Report:
> "Performance Characteristics: Initial render ~0ms, Scroll handler throttled via RAF, Memory footprint minimal (3 DOM nodes, 1 IntersectionObserver)"

**Status quo:** All implementation tasks complete. The 3D hero banner animation is functional and integrated. Task 6 is about validation and optimization.

---

## New Insights

### 1. Performance Testing Strategy Refinement

**Key Realization:** We're testing a **hybrid implementation** - pure CSS 3D transforms (static) + JavaScript scroll reactivity (dynamic). This means we need to test both:

**Static Performance (CSS 3D only):**
- Initial render performance
- Layout stability (CLS)
- Paint/composite times
- GPU memory usage for layer promotion

**Dynamic Performance (JavaScript scroll):**
- Scroll event handling overhead
- RAF callback execution time
- CSS variable update cost
- Transform recalculation during scroll
- IntersectionObserver overhead

**Testing Approach:**

**Phase A: Baseline with prefers-reduced-motion (static only)**
1. Enable prefers-reduced-motion in DevTools
2. Profile initial render and static display
3. This isolates CSS 3D performance from JavaScript

**Phase B: Full animation (dynamic)**
1. Disable prefers-reduced-motion
2. Profile during active scrolling
3. Compare against Phase A to measure JavaScript overhead

**Phase C: Stress testing**
1. CPU throttling (4x slowdown)
2. Fast/aggressive scrolling
3. Rapid scroll direction changes
4. Mobile device simulation

This three-phase approach provides clear attribution of performance costs.

### 2. Performance Metrics Hierarchy

**Primary Metrics (Must Pass):**
- **Frame Rate:** 60fps desktop, 30fps mobile (4x throttled)
- **Lighthouse Performance:** >= 90
- **Cumulative Layout Shift:** < 0.1
- **No Console Errors:** Zero errors/warnings

**Secondary Metrics (Should Pass):**
- **First Contentful Paint:** < 1.5s on 3G
- **Time to Interactive:** < 2.0s on 3G
- **Total Blocking Time:** < 200ms
- **Scripting Time:** < 10% of total during scroll
- **Memory Growth:** < 5MB after 100 scroll cycles

**Tertiary Metrics (Nice to Have):**
- **Largest Contentful Paint:** < 2.5s
- **Speed Index:** < 3.0s
- **GPU Memory:** < 50MB for composited layers
- **Frame drops:** < 1% of frames during scroll

**Success Criteria Prioritization:**
If we must make tradeoffs, prioritize in this order:
1. No layout shift (CLS) - critical UX issue
2. 60fps on desktop - smooth animation perception
3. Lighthouse >= 90 - SEO and best practices
4. 30fps on throttled - acceptable mobile experience
5. No memory leaks - long-term stability

### 3. Chrome DevTools Performance Profiling Deep Dive

**Optimal Recording Settings:**

```
Performance Tab Settings:
- ☑ Screenshots: ON (visual correlation with metrics)
- ☑ Memory: ON (detect leaks early)
- ☐ Web Vitals: OFF (can add noise to timeline)
- CPU Throttling: None initially, then 4x
- Network: No throttling initially, then Fast 3G
```

**Recording Protocol:**

**Recording 1: Initial Render (Cold)**
1. Hard reload page (Cmd+Shift+R)
2. Start recording BEFORE page loads
3. Wait for hero to fully render
4. Stop recording after 5 seconds
5. **Analyze:** Scripting, Rendering, Painting, Compositing times

**Recording 2: Scroll Performance (Warm)**
1. Page already loaded
2. Start recording
3. Slow, smooth scroll through hero section (down then up)
4. Stop recording after 10 seconds
5. **Analyze:** Frame rate, long tasks, scripting %, RAF callback times

**Recording 3: Stress Test (Aggressive)**
1. Start recording
2. Fast scroll down through hero
3. Rapid scroll direction changes (down-up-down-up)
4. Stop recording
5. **Analyze:** Frame drops, scripting bottlenecks, forced reflows

**Key Metrics to Extract:**

**From Summary Tab:**
- Scripting time (target: < 5% of total during scroll)
- Rendering time (should be minimal, transforms are composited)
- Painting time (should be near-zero, GPU layers promoted)
- System time (browser overhead, less controllable)
- Idle time (higher is better, means browser has breathing room)

**From Main Thread Flame Chart:**
- Look for long tasks (> 50ms) - these cause jank
- Identify scripting time in scroll handlers
- Check for forced synchronous layouts (red triangles)
- Verify RAF callbacks execute quickly (< 5ms)

**From Frames Timeline:**
- Green line at 60fps = good
- Yellow/red bars = dropped frames
- Should be solid green during scroll in hero section

**From Memory Graph:**
- Should be stable (horizontal line)
- If sawtooth pattern: memory allocations (might be GC thrashing)
- If upward slope: potential memory leak

### 4. Lighthouse Audit Configuration

**Optimal Settings for Accurate Results:**

```bash
# Run from command line for consistency
npm run build  # Always test production build
npm run preview

# In new terminal
npx lighthouse http://localhost:4173 \
  --only-categories=performance \
  --throttling.cpuSlowdownMultiplier=4 \
  --throttling-method=devtools \
  --view
```

**Critical Lighthouse Metrics for Our Use Case:**

**1. Performance Score (target: >= 90)**
- Weighted composite of all metrics below
- Must maintain 90+ after adding 3D animation

**2. First Contentful Paint (FCP) - target: < 1.8s**
- When first text/image renders
- 3D background should not delay this (non-blocking)

**3. Largest Contentful Paint (LCP) - target: < 2.5s**
- When hero section heading renders
- Critical: ensure 3D background doesn't block LCP

**4. Total Blocking Time (TBT) - target: < 200ms**
- Sum of time main thread is blocked
- JavaScript scroll setup should be minimal

**5. Cumulative Layout Shift (CLS) - target: < 0.1**
- **Most critical for our implementation**
- Absolute positioning should guarantee 0.0 CLS

**6. Speed Index - target: < 3.4s**
- How quickly content is visually populated
- 3D shapes should appear instantly (CSS, no loading)

**Interpreting Results:**

**If Performance < 90:**
- Check which metric is failing (expand Lighthouse report)
- Common culprits: TBT (JS blocking), LCP (render blocking)
- For our use case: likely scroll listener setup or shape rendering

**If CLS > 0.1:**
- Critical issue - absolute positioning should prevent this
- Check: Are shapes causing reflow? Is perspective causing layout shift?
- Use Layout Shift Regions in DevTools Rendering tab to identify source

**If TBT > 200ms:**
- JavaScript execution blocking main thread
- Check: Scroll listener setup time, IntersectionObserver initialization
- May need to defer initialization to after FCP

### 5. Bundle Size Analysis Strategy

**Expected Bundle Impact:**

**Pure CSS Approach (Tasks 1-2):**
- Bundle size increase: ~0 KB (inline CSS in component)
- No external libraries added
- CSS 3D transforms are native browser features

**JavaScript Reactivity (Task 3):**
- Svelte 5 runes compile to minimal JavaScript
- IntersectionObserver: native browser API (0 KB)
- RequestAnimationFrame: native browser API (0 KB)
- Expected increase: ~1-2 KB (compiled Svelte reactivity logic)

**Total Expected Impact:** < 2 KB gzipped

**Verification Method:**

**Before/After Comparison:**
```bash
# Baseline (before 3D implementation)
# Would need to check git history or baseline branch

# Current (with 3D implementation)
npm run build
du -h .svelte-kit/output/client/_app/immutable/chunks/*.js | sort -h

# Look for Hero.svelte chunk
# Compare to baseline if available
```

**Alternative: Vite Bundle Analyzer**
```bash
# If rollup-plugin-visualizer is installed
npm run build
# Check for build/stats.html or similar

# Look for:
# - Hero3DBackground.svelte chunk size
# - Hero.svelte chunk size increase
```

**Acceptance Criteria:**
- Total bundle increase < 50 KB (very conservative limit)
- Actual expected: < 5 KB (Svelte component overhead)
- If > 10 KB: investigate why (might indicate bundler issue)

**Mitigation if Bundle Too Large:**
- Ensure Hero3DBackground is not duplicated in bundle
- Check for accidental library imports
- Verify tree-shaking working correctly
- Consider lazy loading component (likely overkill for 2 KB)

### 6. Memory Leak Testing Protocol

**Why Memory Leaks are Critical Here:**

Our implementation uses:
1. **IntersectionObserver** - must be disconnected on unmount
2. **Scroll event listener** - must be removed on unmount
3. **RequestAnimationFrame** - must be cancelled on unmount
4. **Svelte $effect cleanup** - must return cleanup functions

If any cleanup is missing = memory leak in single-page app.

**Three-Snapshot Technique:**

**Setup:**
1. Open Chrome DevTools > Memory tab
2. Ensure "Detached DOM tree" detection enabled
3. Close all other tabs (reduce noise)

**Procedure:**

**Snapshot 1: Baseline**
- Navigate to homepage (hero visible)
- Wait 5 seconds (let everything settle)
- Click "Take heap snapshot"
- Label: "1-baseline"

**Snapshot 2: After Activity**
- Scroll through hero section 20 times (up and down)
- Navigate away from homepage (to projects page)
- Navigate back to homepage
- Repeat navigation 5 times
- Wait 5 seconds
- Click garbage collection icon (force GC)
- Take snapshot
- Label: "2-after-activity"

**Snapshot 3: After More Cycles**
- Repeat navigation 10 more times
- Scroll 30 more times
- Force GC
- Take snapshot
- Label: "3-after-more-cycles"

**Analysis:**

**Compare Snapshots:**
1. Select "2-after-activity" in dropdown
2. Change from "Summary" to "Comparison"
3. Compare to "1-baseline"

**Look for:**
- **Detached DOM trees:** Should be 0 (any detached = leak)
- **EventListener count:** Should return to baseline after GC
- **System objects growth:** Should be minimal (< 1 MB)
- **Compiled code growth:** Flat (not increasing per cycle)

**Red Flags:**
- Detached DOM nodes (hero section not properly unmounted)
- Growing EventListener count (scroll listener not removed)
- IntersectionObserver instances growing (observer not disconnected)
- Continuous heap growth (missing cleanup somewhere)

**Validation:**
- Heap size after 15 navigation cycles should be within 5% of baseline
- Zero detached DOM trees
- EventListener count stable
- No memory growth trend line

### 7. Real Mobile Device Testing Approach

**Device Tier Strategy:**

**Tier 1: High-End (Target: 60fps)**
- iPhone 14 Pro / Pixel 7 Pro
- M1 iPad Pro
- Recent flagship devices
- **Expectation:** Full performance, all effects visible

**Tier 2: Mid-Range (Target: 45fps)**
- iPhone 12 / Pixel 5
- iPad Air (2020)
- 2-3 year old devices
- **Expectation:** Smooth enough, minor simplifications acceptable

**Tier 3: Low-End (Target: 30fps)**
- iPhone SE (2020) / Budget Android
- Older iPads
- 4+ year old devices
- **Expectation:** Might need to disable parallax, keep static 3D

**Testing Protocol per Device:**

**1. Enable Remote Debugging**
```bash
# iOS: Settings > Safari > Advanced > Web Inspector
# Android: Settings > Developer Options > USB Debugging

# Chrome DevTools > Remote Devices
# Select device, navigate to localhost
```

**2. Performance Profiling**
- Record performance profile during scroll
- Check FPS overlay (Chrome DevTools > Rendering > Frame Rendering Stats)
- Monitor for jank/stuttering visually

**3. Battery Impact Test**
- Fully charge device
- Navigate to hero section
- Leave page open for 10 minutes (with occasional scrolling)
- Check battery drain (should be < 5% in 10 min)

**4. Touch Responsiveness**
- Test CTA button tap response time
- Ensure parallax doesn't interfere with touch events
- Verify pointer-events-none working correctly

**5. Network Conditions**
- Test on WiFi (fast)
- Test on LTE (medium)
- Test on 3G (slow) - simulate with DevTools throttling
- Check FCP and LCP times

**Fallback Strategy if Mobile Performance < 30fps:**

**Option A: Reduce Parallax Complexity**
```css
@media (max-width: 768px) {
  /* Reduce parallax multipliers by 50% */
  --shape-1-parallax: 0.25;
  --shape-2-parallax: 0.4;
  --shape-3-parallax: 0.6;

  /* Reduce MAX_SCROLL */
  --max-scroll-mobile: 250px;
}
```

**Option B: Disable Parallax on Mobile, Keep Static 3D**
```typescript
let isMobile = window.innerWidth < 768;
$effect(() => {
  if (isMobile || prefersReducedMotion || !isInViewport) return;
  // Skip scroll listener setup on mobile
});
```

**Option C: Disable All 3D on Low-End Devices**
```typescript
// Detect low-end via deviceMemory API
const isLowEnd = navigator.deviceMemory && navigator.deviceMemory < 4;
if (isLowEnd) {
  // Don't render Hero3DBackground at all
}
```

**Recommended Approach:** Start with full implementation. If testing reveals issues, apply Option A first (reduce complexity), then Option B (disable parallax), and Option C only as last resort.

### 8. Layout Stability Deep Dive

**Why CLS is Critical for This Implementation:**

Cumulative Layout Shift measures unexpected layout shifts. For 3D background:
- Shapes are absolutely positioned (should not cause shifts)
- However, CSS 3D transforms can affect layout under certain conditions
- Perspective on parent can cause initial layout recalculation
- Shape rendering might cause reflow if not handled correctly

**CLS Target: 0.0 (not just < 0.1)**

Our implementation should have literally ZERO layout shift because:
1. Shapes use absolute positioning (out of layout flow)
2. Container has fixed dimensions (inset-0 fills parent exactly)
3. No lazy-loaded images in 3D background
4. No dynamic content that appears after render

**Testing Tools:**

**Chrome DevTools - Layout Shift Regions:**
1. Open DevTools > More Tools > Rendering
2. Check "Layout Shift Regions"
3. Reload page
4. Any blue flash = layout shift occurred
5. Identify source and fix

**Lighthouse CLS Metric:**
- Automated measurement during page load
- Should show 0.000 (literally zero)
- Any non-zero value requires investigation

**Manual Visual Test:**
1. Throttle CPU to 6x slowdown
2. Reload page
3. Watch hero section carefully during load
4. Text/buttons should not "jump" or shift position
5. Background shapes should appear without causing reflow

**Common CLS Causes in 3D Implementations (and our mitigations):**

**Cause 1: Perspective causing parent size recalculation**
- **Mitigation:** Hero section has fixed min-h-screen (size predetermined)
- **Verification:** Check that section height doesn't change when perspective applied

**Cause 2: Shapes rendering after content**
- **Mitigation:** Hero3DBackground renders synchronously, no async loading
- **Verification:** No loading spinner, no delayed appearance

**Cause 3: CSS transform affecting layout**
- **Mitigation:** Shapes have position: absolute (out of flow)
- **Verification:** Content z-index (10) > background (0), no overlap

**Cause 4: Font loading causing text reflow**
- **Not related to 3D background, but worth checking**
- **Mitigation:** Ensure font-display: swap with size-adjust

**If CLS > 0:**

**Debugging Steps:**
1. Use Layout Shift Regions to identify which element is shifting
2. Check if it's the 3D background or unrelated (likely unrelated)
3. If 3D background: investigate perspective, absolute positioning, transform-origin
4. If unrelated: fix separately (outside scope of this task)

**Expected Result:** CLS = 0.000 (perfect score)

### 9. Cross-Browser Performance Nuances

**Browser Rendering Differences:**

**Chrome (Blink Engine):**
- **Strengths:** Best DevTools, accurate performance profiling
- **3D Transform Handling:** Excellent, aggressive layer promotion
- **IntersectionObserver:** Reliable, well-optimized
- **Expected Performance:** 60fps baseline, best-case scenario

**Firefox (Gecko Engine):**
- **Strengths:** Good privacy, solid DevTools
- **3D Transform Handling:** Good, slightly more conservative layer promotion
- **IntersectionObserver:** Reliable, comparable to Chrome
- **Expected Performance:** 55-60fps, might see slight difference
- **Watch for:** Perspective rendering differences (minor visual variations possible)

**Safari (WebKit Engine):**
- **Strengths:** Mobile performance optimized, battery efficient
- **3D Transform Handling:** Conservative, careful about GPU memory
- **IntersectionObserver:** Known quirks, threshold behavior can differ
- **Expected Performance:** 50-60fps desktop, 30-45fps mobile
- **Watch for:**
  - IntersectionObserver root margin interpretation
  - Will-change honored differently (might ignore if too many elements)
  - Perspective rendering on iOS (can be quirky)
  - Scroll event timing (might debounce differently)

**Edge (Chromium-based):**
- **Identical to Chrome** (same Blink engine)
- **Expected Performance:** Same as Chrome
- **Test anyway:** Ensure no Windows-specific issues

**Performance Expectations by Browser:**

| Browser | Desktop FPS | Mobile FPS | Notes |
|---------|-------------|------------|-------|
| Chrome | 60 | 40-60 | Best performance, aggressive optimization |
| Firefox | 55-60 | 35-50 | Comparable, slightly more conservative |
| Safari (macOS) | 50-60 | N/A | Conservative GPU usage |
| Safari (iOS) | N/A | 30-45 | Mobile-optimized, but careful about battery |
| Edge | 60 | 40-60 | Same as Chrome (Chromium) |

**Browser-Specific Testing Protocol:**

**For Each Browser:**
1. Open DevTools Performance/Timeline
2. Record during scroll through hero
3. Note FPS (visual inspection + profiler)
4. Check for console errors/warnings
5. Verify IntersectionObserver triggers correctly
6. Test prefers-reduced-motion behavior

**Safari-Specific Tests:**
1. Test IntersectionObserver threshold triggering
2. Verify scroll event passive listeners work
3. Check if will-change is honored (inspect Layers in Web Inspector)
4. Test on iOS device (cannot just use macOS Safari)

**Known Safari Quirks to Watch:**
- May not promote layers with will-change if "too many" (> 10)
- IntersectionObserver rootMargin in pixels sometimes interpreted weirdly
- Scroll events can be debounced aggressively (affects RAF timing)
- Transform perspective on mobile can cause subpixel rendering issues

**If Safari Performance < 50fps:**
- Reduce will-change usage (Safari might ignore it anyway)
- Simplify transforms (fewer rotateX/Y values)
- Test if disabling parallax on Safari improves (use browser detection)

### 10. Optimization Decision Tree

**Decision Framework: When to Optimize vs. Accept**

```
Performance Test Result
├─ Passes all targets (60fps desktop, 30fps mobile, CLS=0)
│  └─ ✅ ACCEPT - Ship as-is, document success
│
├─ Desktop 60fps, Mobile 25-30fps
│  ├─ Is it visually acceptable?
│  │  ├─ Yes → ✅ ACCEPT (edge case, most users > 30fps)
│  │  └─ No → ⚠️ OPTIMIZE (reduce mobile complexity)
│  │
│  └─ Optimization: Reduce parallax multipliers by 50% on mobile
│
├─ Desktop 50-60fps, Mobile 30fps+
│  └─ ⚠️ OPTIMIZE (desktop should be perfect)
│      └─ Investigate: Long tasks? Forced reflows? RAF inefficiency?
│
├─ Desktop < 50fps
│  └─ 🚨 CRITICAL - Must optimize
│      ├─ Check: Scroll listener overhead
│      ├─ Check: CSS calc() complexity
│      └─ Consider: Simplify transforms, reduce layers
│
├─ CLS > 0.1
│  └─ 🚨 CRITICAL - Must fix (not ship with layout shift)
│      └─ Debug: Which element shifting? Fix positioning.
│
├─ Lighthouse < 90
│  ├─ Which metric failing?
│  │  ├─ TBT → Defer JavaScript initialization
│  │  ├─ LCP → Ensure 3D not blocking (shouldn't be)
│  │  └─ CLS → See above
│  └─ ⚠️ OPTIMIZE - Lighthouse 90+ is target
│
└─ Memory Leaks Detected
   └─ 🚨 CRITICAL - Must fix before shipping
       └─ Check: $effect cleanup, event listener removal, observer disconnect
```

**Optimization Priority Matrix:**

**P0 - Must Fix Before Shipping:**
- CLS > 0.1 (layout shift is terrible UX)
- Memory leaks (breaks long-running apps)
- Console errors (indicates bugs)
- Desktop < 50fps on modern hardware (unacceptable)

**P1 - Should Fix if Possible:**
- Lighthouse < 90 (SEO/best practices impact)
- Desktop 50-60fps (should be perfect 60)
- Mobile < 25fps on mid-range devices (too slow)

**P2 - Can Accept with Documentation:**
- Mobile 25-30fps on low-end (acceptable compromise)
- Desktop 58-60fps (imperceptible difference from 60)
- Lighthouse 88-90 (close enough, minimal impact)

**P3 - Future Enhancements:**
- Mobile 40fps (already great, diminishing returns)
- Desktop bundle size 2-5 KB (within budget, not worth complexity)
- Safari-specific optimizations (unless critical issues)

### 11. Documentation and Reporting Strategy

**Performance Report Structure:**

After completing all tests, create comprehensive documentation in solution.md under new "Performance Metrics" section.

**Recommended Format:**

```markdown
## Performance Metrics

**Test Date:** 2025-12-15
**Test Environment:** Chrome 120, macOS Sonoma, M1 Pro

### Frame Rate Performance

| Test Scenario | Desktop FPS | Mobile FPS (4x throttle) | Status |
|---------------|-------------|--------------------------|--------|
| Initial Render | 60 | 60 | ✅ Pass |
| Slow Scroll | 60 | 32 | ✅ Pass |
| Fast Scroll | 58 | 28 | ⚠️ Acceptable |
| Rapid Direction Change | 60 | 30 | ✅ Pass |

### Lighthouse Audit Results

**Performance Score:** 94/100 ✅

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| First Contentful Paint | 1.2s | < 1.8s | ✅ |
| Largest Contentful Paint | 1.8s | < 2.5s | ✅ |
| Total Blocking Time | 120ms | < 200ms | ✅ |
| Cumulative Layout Shift | 0.000 | < 0.1 | ✅ |
| Speed Index | 2.1s | < 3.4s | ✅ |

### Bundle Size Impact

- **Before 3D Implementation:** [baseline]
- **After 3D Implementation:** +1.8 KB gzipped
- **Status:** ✅ Within budget (< 50 KB limit)

### Memory Profile

- **Baseline Heap:** 12.4 MB
- **After 15 Navigation Cycles:** 12.6 MB (+0.2 MB)
- **Detached DOM Nodes:** 0
- **Status:** ✅ No memory leaks detected

### Cross-Browser Results

| Browser | Desktop FPS | Notes |
|---------|-------------|-------|
| Chrome 120 | 60 | Perfect performance |
| Firefox 121 | 58 | Slight difference, acceptable |
| Safari 17 | 55 | Conservative layer promotion |
| Edge 120 | 60 | Identical to Chrome |

### Mobile Device Results

| Device | FPS | Notes |
|--------|-----|-------|
| iPhone 14 Pro | 50 | Smooth, no issues |
| iPhone 12 | 38 | Acceptable, minor drops during fast scroll |
| Pixel 7 | 45 | Good performance |
| iPhone SE (2020) | 30 | Edge case, meets minimum target |

### Optimizations Applied

- [List any optimizations made during testing]
- [Or: "None required - met all targets with initial implementation"]

### Known Limitations

- Mobile performance on 4+ year old devices: 28-30fps (acceptable)
- Safari Desktop: 55fps vs 60fps on Chrome (minor, imperceptible)

### Recommendations

- Ship as-is - all targets met ✅
- Monitor real-world performance via analytics
- Consider future enhancement: device tier detection for adaptive complexity
```

---

## Questions Resolved

**Q: Should we test with prefers-reduced-motion enabled or disabled?**
**A:** Test BOTH. Phase A (reduced motion) isolates CSS performance. Phase B (full animation) measures JavaScript overhead. This attribution is valuable for understanding performance characteristics.

**Q: What's the minimum acceptable FPS on mobile?**
**A:** 30fps on 4x CPU throttled is the floor. This simulates low-end devices. Real mid-range devices should achieve 35-45fps. High-end should hit 50-60fps.

**Q: Should we test production build or dev build?**
**A:** Always test production build for Lighthouse and final metrics. Dev build has debug overhead (source maps, HMR, extra logging) that skews results. Dev testing is fine for iterative development, but final validation requires production.

**Q: How do we isolate 3D background performance from overall page performance?**
**A:** Use three-phase testing (static CSS only, full animation, stress test) and compare. Also test with Hero3DBackground component commented out to get pure baseline, then compare with component active.

**Q: What if Lighthouse score is 88-90 (just below target)?**
**A:** Depends on which metric is failing. If CLS or TBT, investigate and fix. If minor variations in FCP/LCP (network-dependent), acceptable if within margin of error. Document decision in performance report.

**Q: Should we test on real mobile devices or rely on DevTools emulation?**
**A:** Both. DevTools throttling is good for iterative testing (fast, repeatable). But real device testing is mandatory for final validation - emulation doesn't capture actual GPU/CPU characteristics accurately.

**Q: How many times should we run each test for consistency?**
**A:** Run Lighthouse 3 times, take median score (single runs can vary). Performance profiling: 2-3 recordings per scenario. Memory leak test: one comprehensive session with many cycles. Visual testing: once per browser if consistent.

**Q: What if we find a memory leak?**
**A:** Critical blocker - must fix before shipping. Check $effect cleanup functions. Verify event listener removal. Ensure IntersectionObserver disconnected. Re-test until leak eliminated.

---

## Open Questions

**Q1: Should we implement custom performance monitoring in production?**
- Could add performance.mark() calls to measure scroll handler timing
- Could send metrics to analytics (e.g., FPS, scroll event frequency)
- **Decision needed:** Probably overkill for MVP. Standard Lighthouse monitoring sufficient. Consider for post-launch if users report issues.

**Q2: What if Safari iOS performance is 25-28fps (below 30fps target)?**
- Is this acceptable given it's the low-end edge case?
- Should we disable parallax specifically on iOS?
- Should we reduce parallax multipliers on all mobile?
- **Decision needed:** Test first. If real iPhone performance < 30fps, apply Option A (reduce mobile complexity). Don't pre-optimize.

**Q3: Should we set up automated performance regression testing?**
- Could run Lighthouse in CI/CD pipeline
- Would catch performance degradation in future changes
- **Decision needed:** Good idea for production project, but outside scope of this task. Recommend as future enhancement.

**Q4: How do we handle browser that doesn't support IntersectionObserver (<5% of users)?**
- Fallback is to run scroll listener continuously (less efficient but functional)
- Is this acceptable for the tiny minority?
- **Decision needed:** Current implementation already has fallback (isInViewport defaults to true). Test in old browser (IE11?) to verify graceful degradation. Likely acceptable.

**Q5: Should we test with browser extensions enabled or disabled?**
- Extensions can impact performance significantly
- Real users have extensions, but they skew test results
- **Decision needed:** Test with extensions disabled for clean baseline. Note in docs that real-world performance may vary based on user's extensions.

**Q6: What if bundle size is larger than expected (e.g., 10 KB instead of 2 KB)?**
- Indicates bundler might be including extra code
- Could be Svelte compiler overhead or dependency issue
- **Decision needed:** Investigate with bundle analyzer. If > 10 KB, check for accidental imports or duplication. If justified (e.g., complex component logic), document and accept if < 50 KB.

**Q7: Should we test battery impact on mobile devices?**
- 3D animations can drain battery faster
- Could be user concern, especially on older devices
- **Decision needed:** Quick test (10-minute battery drain check) is reasonable. If > 5% drain in 10 min, might indicate inefficiency. But GPU-accelerated CSS should be efficient.

**Q8: What if different team members get different Lighthouse scores?**
- Lighthouse scores can vary based on machine, network, background processes
- How do we establish canonical baseline?
- **Decision needed:** Run on same machine, same conditions. Take median of 3 runs. Document test environment (CPU, RAM, Chrome version). Accept +/- 2 point variation as normal.

---

## Confidence Assessment

| Aspect | Confidence | Notes |
|--------|------------|-------|
| **Testing Methodology** | **Very High** | Clear 11-phase plan with established tools (Chrome DevTools, Lighthouse). Three-phase approach (static/dynamic/stress) provides good attribution. |
| **Performance Targets** | **High** | Targets are reasonable (60/30fps, Lighthouse 90+, CLS < 0.1). Based on industry standards and prior task benchmarks. |
| **Risk Identification** | **High** | Known risks from prior tasks well-documented (low-end mobile, Safari quirks, memory leaks). Mitigations planned for each. |
| **Tool Proficiency** | **Medium-High** | Chrome DevTools profiling is well-understood. Lighthouse is straightforward. Memory leak detection requires careful analysis. |
| **Expected Outcomes** | **High** | Implementation already shows strong performance in Task 5 testing (60fps, Lighthouse 95+, CLS 0.0). Expecting to validate, not fix. |
| **Optimization Strategy** | **High** | Clear decision tree for when to optimize vs. accept. Prioritization framework (P0-P3) guides tradeoff decisions. |
| **Browser Compatibility** | **Medium-High** | Chrome testing is definitive. Safari might have quirks (IntersectionObserver, will-change). Firefox generally consistent. |
| **Mobile Testing** | **Medium** | Real device testing is ideal but device availability varies. DevTools emulation is good proxy but not perfect. |
| **Documentation Plan** | **High** | Clear structure for performance report. Metrics defined. Table format for easy reading. |

**Overall Confidence: HIGH**

This task is primarily validation and documentation. The implementation (Tasks 1-5) is already complete and showing strong performance. We're testing to confirm and document, not to troubleshoot major issues.

**Main Uncertainties:**
1. Safari iOS performance (won't know until real device testing)
2. Low-end Android performance (diverse hardware, hard to predict)
3. Whether any optimizations will be needed (expect none, but prepared if so)

---

## Detailed Technical Plan

### Phase 1: Environment Setup (10 min)

**Preparation:**
- [ ] Ensure production build works: `npm run build && npm run preview`
- [ ] Clear browser cache and disable cache in DevTools
- [ ] Close all other tabs/applications (reduce system noise)
- [ ] Disable browser extensions (clean test environment)
- [ ] Open Chrome DevTools: Performance, Lighthouse, Memory, Rendering tabs ready
- [ ] Have Firefox, Safari browsers ready for cross-browser testing

**Setup Performance Profiling Presets:**
- [ ] DevTools > Performance > Settings: Enable screenshots, memory
- [ ] DevTools > Rendering: Enable "Frame Rendering Stats" for FPS overlay
- [ ] DevTools > Rendering: Enable "Layout Shift Regions" for CLS testing
- [ ] DevTools > Network: Note current throttling (None for baseline)

**Validation:** Environment is clean, tools ready, production build serving correctly.

---

### Phase 2: Baseline Static Performance (15 min)

**Objective:** Isolate CSS 3D performance from JavaScript

**Setup:**
1. Enable prefers-reduced-motion:
   - DevTools > Rendering > "Emulate CSS media feature prefers-reduced-motion: reduce"
2. This disables scroll parallax, leaving only static CSS 3D transforms

**Test 1: Initial Render Performance**
1. DevTools > Performance > Start recording
2. Hard reload page (Cmd+Shift+R)
3. Wait 5 seconds for render to complete
4. Stop recording
5. **Analyze:**
   - Scripting time for Hero3DBackground mount
   - Rendering time for 3D shapes
   - Painting time (should be minimal, composited)
   - Layout time (should be zero for shapes, absolute positioned)

**Expected:**
- Hero3DBackground mount: < 10ms
- Shape rendering: < 5ms each (< 15ms total)
- No painting (GPU composited layers)
- No layout caused by shapes

**Test 2: Layout Stability (CLS)**
1. DevTools > Rendering > "Layout Shift Regions" ENABLED
2. Hard reload page
3. Watch for blue flashes (indicate layout shifts)
4. **Expected:** Zero blue flashes in hero section

**Test 3: Lighthouse with Reduced Motion**
```bash
# Run Lighthouse
npx lighthouse http://localhost:4173 --only-categories=performance --view
```
5. **Record baseline scores:**
   - Performance: ___
   - FCP: ___
   - LCP: ___
   - CLS: ___ (expect 0.000)
   - TBT: ___

**Validation:**
- [ ] No layout shifts detected
- [ ] CSS 3D rendering cost < 20ms
- [ ] Baseline Lighthouse score documented

---

### Phase 3: Dynamic Performance (Full Animation) (20 min)

**Setup:**
1. Disable prefers-reduced-motion:
   - DevTools > Rendering > Remove "Emulate CSS media feature prefers-reduced-motion"
2. This enables scroll parallax JavaScript

**Test 1: Slow Scroll Performance**
1. DevTools > Performance > Start recording
2. Slowly scroll down through hero section (3 seconds)
3. Slowly scroll back up (3 seconds)
4. Stop recording
5. **Analyze:**
   - **Frames timeline:** Check for solid 60fps green line
   - **Main thread:** Check for long tasks (> 50ms)
   - **Scripting %:** Should be < 5% of total
   - **RAF callbacks:** Should execute in < 3ms each
   - **IntersectionObserver overhead:** Initial setup cost

**Expected:**
- Frame rate: 60fps solid
- No long tasks
- Scroll event handler: < 1ms per event
- RAF callback: < 3ms per frame
- Total scripting during scroll: < 5% of time

**Test 2: Fast Scroll Performance**
1. Start recording
2. Fast scroll down through hero (1 second)
3. Fast scroll back up (1 second)
4. Rapid direction changes (down-up-down-up)
5. Stop recording
6. **Analyze:**
   - Frame drops (yellow/red bars)
   - Scripting bottlenecks
   - Forced synchronous layouts (red flags)

**Expected:**
- Frame rate: >= 58fps (allow minor drops during aggressive scroll)
- No forced layouts
- No scripting >50ms

**Test 3: IntersectionObserver Validation**
1. Add temporary `console.log('isInViewport:', isInViewport)` in Hero3DBackground
2. Scroll past hero section (to projects section)
3. Check console: should log `false`
4. Scroll back to hero
5. Check console: should log `true`
6. **Verify:** Scroll listener pauses when hero not visible

**Test 4: Lighthouse with Full Animation**
```bash
npx lighthouse http://localhost:4173 --only-categories=performance --view
```
7. **Record scores:**
   - Performance: ___ (target: >= 90)
   - FCP: ___ (target: < 1.8s)
   - LCP: ___ (target: < 2.5s)
   - CLS: ___ (target: 0.000)
   - TBT: ___ (target: < 200ms)

**Comparison:**
- Compare to baseline (Phase 2)
- JavaScript should add < 100ms to TBT
- CLS should remain 0.000
- Performance score should remain >= 90

**Validation:**
- [ ] 60fps during scroll confirmed
- [ ] Lighthouse Performance >= 90
- [ ] CLS = 0.000
- [ ] IntersectionObserver pausing verified

---

### Phase 4: CPU Throttling (Low-End Simulation) (15 min)

**Setup:**
1. DevTools > Performance > CPU: 4x slowdown

**Test 1: Throttled Scroll Performance**
1. Start recording with 4x throttling
2. Slow scroll through hero section
3. Stop recording
4. **Analyze:**
   - Frame rate (target: >= 30fps)
   - Frame drops frequency
   - Scripting time (will be 4x longer, acceptable)

**Expected:**
- Frame rate: 30-40fps (acceptable for low-end)
- Some yellow bars okay (throttling is extreme)
- No complete freezes or hangs

**Test 2: Throttled Lighthouse**
```bash
npx lighthouse http://localhost:4173 \
  --only-categories=performance \
  --throttling.cpuSlowdownMultiplier=4 \
  --view
```
2. **Record scores:**
   - Performance: ___ (more lenient, aim for > 80)
   - TBT: ___ (will be higher, acceptable)

**Validation:**
- [ ] >= 30fps on throttled CPU
- [ ] No freezes or complete stalls
- [ ] Animation still perceptible (even if not smooth)

**Decision Point:**
- If < 30fps: Investigate optimization (reduce parallax on mobile)
- If >= 30fps: PASS, meets target

---

### Phase 5: Bundle Size Analysis (10 min)

**Method 1: Build Size Comparison**
```bash
npm run build

# Check output
ls -lh .svelte-kit/output/client/_app/immutable/chunks/

# Find Hero-related chunks
# Note sizes
```

**Method 2: Bundle Visualizer (if available)**
```bash
# If using vite-plugin-visualizer
npm run build
# Open stats.html

# Look for:
# - Hero3DBackground.svelte
# - Hero.svelte
# Note chunk sizes
```

**Analysis:**
1. Find Hero3DBackground in bundle
2. Note compressed size (gzipped)
3. Compare to expectations (< 5 KB)

**Expected:**
- Hero3DBackground.svelte: 1-3 KB gzipped
- No external dependencies added (0 KB)
- Total impact: < 5 KB

**Validation:**
- [ ] Bundle size increase < 50 KB (conservative limit)
- [ ] No unexpected dependencies
- [ ] Actual increase documented

**Decision Point:**
- If > 10 KB: Investigate why (possible bundler duplication)
- If < 5 KB: Perfect, document and proceed

---

### Phase 6: Memory Leak Testing (20 min)

**Setup:**
1. DevTools > Memory tab
2. Close all other tabs

**Three-Snapshot Protocol:**

**Snapshot 1: Baseline**
1. Navigate to homepage
2. Wait 5 seconds
3. Click garbage collection icon (trash can)
4. Take heap snapshot
5. Label: "baseline"

**Activity Cycle:**
1. Scroll through hero 10 times (up and down)
2. Navigate to another page (projects)
3. Navigate back to homepage
4. Repeat: navigate away, back, scroll
5. Total: 5 navigation cycles, 50 scroll actions

**Snapshot 2: After Activity**
1. Force garbage collection
2. Wait 5 seconds
3. Take heap snapshot
4. Label: "after-activity"

**More Cycles:**
1. Repeat navigation and scrolling
2. Total: 10 more navigation cycles, 100 more scroll actions

**Snapshot 3: After More Cycles**
1. Force garbage collection
2. Wait 5 seconds
3. Take heap snapshot
4. Label: "after-more-cycles"

**Analysis:**

**Compare Snapshot 2 to Snapshot 1:**
1. Select "after-activity" in dropdown
2. Switch view to "Comparison"
3. Select baseline in comparison dropdown
4. **Check:**
   - Total heap size growth (should be < 1 MB)
   - Detached DOM trees (should be 0)
   - EventListener count (should not grow)
   - IntersectionObserver instances (should be 1, not growing)

**Compare Snapshot 3 to Snapshot 1:**
1. Same process
2. **Check:**
   - Linear growth? (bad - leak)
   - Stable growth? (good - normal allocation)
   - Detached DOM? (should be 0)

**Expected:**
- Heap growth: < 5 MB after 15 cycles (mostly GC noise)
- Zero detached DOM nodes
- EventListener count: stable (not increasing)
- IntersectionObserver: 1 instance (when on homepage)

**Validation:**
- [ ] No detached DOM trees
- [ ] No linear heap growth
- [ ] EventListener count stable
- [ ] No memory leak indicators

**Decision Point:**
- If detached DOM or growing listeners: CRITICAL - must fix cleanup
- If stable heap: PASS, no leaks

---

### Phase 7: Real Mobile Device Testing (30 min)

**If Available: iOS Device (iPhone)**

**Setup:**
1. Connect iPhone via USB
2. Safari > Develop > [Device Name] > localhost:4173
3. Enable Web Inspector

**Tests:**
1. **Visual Performance:**
   - Scroll through hero slowly
   - Observe FPS (visual inspection)
   - Note any stuttering or jank
   - Expected: 40-60fps on modern iPhone, 30-40fps on older

2. **Touch Responsiveness:**
   - Tap CTA buttons (should respond immediately)
   - Scroll with various speeds
   - Verify parallax doesn't interfere with touch

3. **Battery Impact:**
   - Note battery % before test
   - Leave on hero section for 10 minutes
   - Scroll occasionally (every 30 seconds)
   - Note battery % after
   - Expected: < 5% drain

**If Available: Android Device**

**Setup:**
1. Enable USB debugging
2. Chrome > Remote Devices > Inspect
3. Navigate to localhost (use port forwarding)

**Tests:**
1. Same as iOS (visual, touch, battery)
2. Use DevTools to profile remotely (Performance tab)

**If No Real Devices: Mobile Emulation (DevTools)**

**Setup:**
1. DevTools > Toggle device toolbar
2. Select "iPhone 12 Pro"
3. CPU: 4x slowdown (simulate mobile CPU)
4. Network: Fast 3G

**Tests:**
1. Record performance during scroll
2. Check FPS (aim for >= 30fps with throttling)
3. Visual inspection

**Validation:**
- [ ] iOS performance documented (if available)
- [ ] Android performance documented (if available)
- [ ] Emulation performance >= 30fps
- [ ] Touch responsiveness good
- [ ] Battery drain acceptable (< 5% in 10 min)

**Decision Point:**
- If mobile < 30fps: Apply mobile optimization (reduce parallax)
- If mobile >= 30fps: PASS

---

### Phase 8: Layout Stability (CLS) Verification (15 min)

**Test 1: Layout Shift Regions Visual**
1. DevTools > Rendering > "Layout Shift Regions" ON
2. Hard reload page (clear cache)
3. Watch entire page load
4. **Look for:** Blue flashes (indicate layout shifts)
5. **Focus on:** Hero section specifically

**Expected:** Zero blue flashes in hero section

**Test 2: Lighthouse CLS Score**
1. Run Lighthouse (already done in Phase 3)
2. Check CLS metric
3. **Expected:** 0.000 (literally zero)

**Test 3: Slow Network Simulation**
1. DevTools > Network > Slow 3G
2. Hard reload page
3. Watch layout stability during slow load
4. Check Layout Shift Regions
5. **Expected:** Still zero shifts (shapes render immediately, no async)

**Test 4: Slow CPU Simulation**
1. DevTools > Performance > CPU 6x slowdown
2. Reload page
3. Watch hero section during load (will be slow motion)
4. Observe if text/buttons jump or shift
5. **Expected:** No shifts even in slow motion

**Debugging (if CLS > 0):**
1. DevTools > Performance > Reload and record
2. Check Timeline for "Layout Shift" events
3. Expand to see which element caused shift
4. Investigate:
   - Is it the 3D background? (shouldn't be, absolute positioned)
   - Is it hero content? (might be font loading or image)
   - Is it unrelated? (outside scope of this task)

**Validation:**
- [ ] Layout Shift Regions: zero blue flashes
- [ ] Lighthouse CLS: 0.000
- [ ] Slow network CLS: 0.000
- [ ] Slow CPU CLS: 0.000

**Decision Point:**
- If CLS = 0.000: PASS (perfect)
- If 0 < CLS < 0.1: Investigate and fix (should be 0 for our impl)
- If CLS >= 0.1: CRITICAL - must fix

---

### Phase 9: Cross-Browser Performance (30 min)

**Firefox Testing:**

1. Open Firefox
2. Navigate to http://localhost:4173
3. Open DevTools > Performance
4. Record during scroll through hero
5. **Analyze:**
   - Frame rate (via visual inspection + performance timeline)
   - Any warnings/errors in console
   - Parallax effect visual consistency

6. Test IntersectionObserver:
   - Scroll past hero, verify effect pauses
   - Check console for isInViewport logs

7. **Record:**
   - Firefox FPS: ___
   - Issues: ___
   - Notes: ___

**Expected:**
- FPS: 55-60 (comparable to Chrome)
- IntersectionObserver works correctly
- No Firefox-specific errors

---

**Safari (macOS) Testing:**

1. Open Safari
2. Navigate to http://localhost:4173
3. Safari > Develop > Show Web Inspector
4. Timelines tab > Record

5. Scroll through hero section
6. Stop recording
7. **Analyze:**
   - Frame rate (Safari Timeline is less detailed than Chrome)
   - Visual smoothness (subjective)
   - Any console errors

8. Test will-change:
   - Develop > Show Layers
   - Check if 3D shapes are promoted to layers
   - Safari can be conservative about will-change

9. Test IntersectionObserver:
   - Scroll past hero
   - Verify parallax pauses
   - Safari has known IntersectionObserver quirks

10. **Record:**
    - Safari FPS: ___
    - Layer promotion: ___
    - Issues: ___

**Expected:**
- FPS: 50-60 (Safari is more conservative)
- Shapes promoted to layers (if not, acceptable - Safari decides)
- IntersectionObserver works (might have threshold quirks)

**Known Safari Issues to Watch:**
- IntersectionObserver rootMargin might not work as expected
- will-change might be ignored if "too many" elements
- Perspective rendering can have subpixel issues

---

**Edge (Chromium) Testing:**

1. Open Edge
2. Navigate to localhost
3. DevTools (same as Chrome, Chromium-based)
4. Quick test:
   - Visual inspection during scroll
   - Check for any Windows-specific issues
   - Performance should be identical to Chrome

5. **Record:**
   - Edge performance: (same as Chrome expected)
   - Issues: ___

**Expected:** Identical to Chrome (same engine)

---

**Validation:**
- [ ] Firefox: 55-60fps, no errors
- [ ] Safari: 50-60fps, acceptable quirks documented
- [ ] Edge: 60fps, same as Chrome
- [ ] All browsers: IntersectionObserver working
- [ ] All browsers: prefers-reduced-motion respected

**Decision Point:**
- If all browsers >= 50fps: PASS
- If Safari < 50fps but >= 45fps: Acceptable (document)
- If any browser < 45fps: Investigate browser-specific issue

---

### Phase 10: Optimization (If Needed) (Variable)

**Trigger Conditions:**
- Desktop < 60fps on Chrome
- Mobile < 30fps on 4x throttling
- Lighthouse < 90
- CLS > 0.1
- Memory leaks detected

**Optimization Strategies:**

**If: Desktop < 60fps**

**Check 1: Long Tasks**
- DevTools Performance: Look for tasks > 50ms
- Common culprits: Scroll listener overhead, forced reflows
- **Fix:** Ensure RAF throttling working, check for synchronous layout reads

**Check 2: Scripting Time**
- If > 10% of time during scroll: too much JavaScript
- **Fix:** Profile RAF callback, optimize calculations

**Check 3: CSS Complexity**
- If calc() expressions causing slowdown
- **Fix:** Simplify transform calculations, pre-calculate more

---

**If: Mobile < 30fps**

**Option A: Reduce Parallax Complexity**
```typescript
// In Hero3DBackground.svelte
const isMobile = window.innerWidth < 768;
const parallaxMultiplier = isMobile ? 0.5 : 1.0;

// Apply to parallax calculations
scrollY = Math.min(window.scrollY, MAX_SCROLL) * parallaxMultiplier;
```

**Option B: Reduce Number of Shapes on Mobile**
```svelte
{#each shapesConfig as shape, i}
  {#if !isMobile || i < 2}
    <!-- Only render 2 shapes on mobile instead of 3 -->
    <div ...>
  {/if}
{/each}
```

**Option C: Disable Parallax on Mobile, Keep Static 3D**
```typescript
$effect(() => {
  if (isMobile || prefersReducedMotion || !isInViewport) return;
  // Skip scroll listener on mobile entirely
});
```

---

**If: Lighthouse < 90**

**Check Which Metric Failing:**

**TBT > 200ms:**
- JavaScript blocking main thread
- **Fix:** Defer Hero3DBackground initialization:
```typescript
onMount(() => {
  setTimeout(() => {
    // Setup scroll listener
  }, 100); // Defer 100ms
});
```

**LCP > 2.5s:**
- Something blocking hero text render
- **Fix:** Unlikely to be 3D background (CSS only), investigate fonts/images

**CLS > 0.1:**
- See Phase 8 CLS debugging steps

---

**If: Memory Leak Detected**

**Check 1: Event Listeners**
- Verify scroll listener removed: `removeEventListener` in cleanup
- Check with: Chrome DevTools > getEventListeners(window)

**Check 2: IntersectionObserver**
- Verify: `observer.disconnect()` in cleanup
- Check instances: Should be 1 when on hero, 0 when away

**Check 3: RequestAnimationFrame**
- Verify: `cancelAnimationFrame(rafId)` in cleanup
- Check: No pending RAF after component unmount

**Check 4: Svelte $effect**
- Verify: All $effect blocks return cleanup function
- Check: Cleanup functions actually execute (console.log test)

---

**Validation After Optimization:**
- Re-run all Phase 2-9 tests
- Verify optimization resolved issue
- Document what was changed and why

---

### Phase 11: Documentation (20 min)

**Update solution.md:**

Add new section after "Status":

```markdown
## Performance Metrics

**Tested:** 2025-12-15
**Environment:** Chrome 120, macOS Sonoma M1 Pro, Production Build

### Frame Rate Performance

| Scenario | Desktop | Mobile (4x CPU) | Status |
|----------|---------|-----------------|--------|
| Initial Render | 60 fps | 60 fps | ✅ |
| Slow Scroll | 60 fps | 32 fps | ✅ |
| Fast Scroll | 58 fps | 30 fps | ✅ |

### Lighthouse Audit

**Score:** 94/100 ✅

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| First Contentful Paint | 1.2s | < 1.8s | ✅ |
| Largest Contentful Paint | 1.8s | < 2.5s | ✅ |
| Total Blocking Time | 120ms | < 200ms | ✅ |
| Cumulative Layout Shift | 0.000 | < 0.1 | ✅ |
| Speed Index | 2.1s | < 3.4s | ✅ |

### Bundle Size

- **Impact:** +1.8 KB gzipped
- **Status:** ✅ Within budget

### Memory Profile

- **Cycles Tested:** 15 navigation + 150 scroll actions
- **Heap Growth:** +0.2 MB (negligible)
- **Detached DOM:** 0
- **Status:** ✅ No leaks

### Cross-Browser

| Browser | FPS | Notes |
|---------|-----|-------|
| Chrome 120 | 60 | Perfect |
| Firefox 121 | 58 | Excellent |
| Safari 17 | 55 | Good (conservative GPU) |
| Edge 120 | 60 | Identical to Chrome |

### Mobile Devices

| Device | FPS | Notes |
|--------|-----|-------|
| iPhone 14 Pro | 50 | Smooth |
| iPhone 12 | 38 | Acceptable |
| Pixel 7 | 45 | Good |
| DevTools Emulation (4x) | 32 | Meets target |

### Optimizations Applied

[List any changes made, or:]
None required - met all targets with initial implementation ✅

### Recommendations

- Ship as-is - all performance targets met
- Monitor real-world performance post-launch
- Future: Consider device tier detection for adaptive quality
```

**Update REPORT.md:**

Mark all acceptance criteria as complete:
- [x] Run Chrome DevTools Performance profiling during scroll
- [x] Verify 60fps maintained on desktop
- [x] Test on throttled CPU (4x slowdown)
- [x] Run Lighthouse audit (Performance score >= 90)
- [x] Check bundle size impact
- [x] Test on real mobile device (or thorough emulation)
- [x] Verify no layout shift (CLS score)
- [x] Profile memory usage (no leaks)

**Add Performance Notes in Hero3DBackground.svelte:**

```typescript
/**
 * Performance Characteristics (verified 2025-12-15):
 * - Initial render: ~2ms (3 DOM nodes, GPU-accelerated)
 * - Scroll handler: <1ms per event (passive listener, RAF throttled)
 * - Memory footprint: 3 shapes + 1 IntersectionObserver (~minimal)
 * - Frame rate: 60fps desktop, 30-40fps mobile (4x throttled)
 * - Bundle size: +1.8 KB gzipped
 * - CLS: 0.000 (zero layout shift)
 *
 * Tested on: Chrome 120, Firefox 121, Safari 17, Edge 120
 * Mobile: iPhone 12+, Pixel 7, DevTools emulation
 */
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation | Status |
|------|-------------|--------|------------|--------|
| **Desktop < 60fps** | Low | High | Implementation already showing 60fps in Task 5. If issue found, optimize RAF or reduce calc() complexity. | ⚠️ Test |
| **Mobile < 30fps** | Medium | High | Most likely risk given diverse Android hardware. Mitigation: reduce parallax on mobile, or disable entirely. | ⚠️ Test |
| **Lighthouse < 90** | Low | Medium | Task 5 showed 95+. Regression unlikely. If occurs, check TBT and CLS specifically. | ⚠️ Test |
| **CLS > 0.1** | Very Low | High | Absolute positioning should guarantee 0.0. If > 0, investigate perspective or shape rendering. | ⚠️ Test |
| **Memory leaks** | Low | High | $effect cleanup implemented in Task 3, but must validate. Heap snapshots will detect. | ⚠️ Test |
| **Bundle size > 50KB** | Very Low | Low | CSS approach with minimal JS. Expected < 5KB. If larger, investigate bundler duplication. | ⚠️ Test |
| **Safari iOS < 30fps** | Medium | Medium | Safari is conservative with GPU. May need mobile-specific reduction. Acceptable fallback. | ⚠️ Test |
| **IntersectionObserver issues** | Low | Low | Task 3 tested, working. Safari might have quirks but functional. Fallback: always-on listener. | ⚠️ Test |
| **Cross-browser inconsistencies** | Low | Medium | Pure CSS 3D is well-supported. Minor variations acceptable (58fps vs 60fps). | ⚠️ Test |
| **Real device availability** | High | Low | May not have all devices. Mitigation: thorough DevTools emulation + document limitations. | Acceptable |

---

## Dependencies

### Must Exist Before Execution

**Completed Implementation (Tasks 1-5):**
- [x] Hero3DBackground.svelte component (Task 1)
- [x] CSS 3D transforms with perspective (Task 2)
- [x] Scroll-based parallax with IntersectionObserver (Task 3)
- [x] Accessibility (prefers-reduced-motion) (Task 4)
- [x] Integration with Hero.svelte (Task 5)

**Testing Environment:**
- [x] Chrome browser with DevTools
- [x] Firefox browser (latest)
- [x] Safari browser (macOS, latest)
- [x] Production build working: `npm run build && npm run preview`

**Optional but Valuable:**
- [ ] Real iOS device (iPhone) - for definitive mobile testing
- [ ] Real Android device - for diverse hardware testing
- [ ] Fast network connection - for consistent Lighthouse results

### Knowledge Dependencies

**Required Knowledge:**
- Chrome DevTools Performance profiling
- Lighthouse metrics interpretation
- Memory profiling (heap snapshots)
- Understanding of frame rate, CLS, TBT concepts

**Reference Documentation:**
- Chrome DevTools Performance docs
- Lighthouse documentation
- Web Vitals guide (CLS, LCP, FCP)

---

## Implementation Checklist

**Pre-Execution:**
- [ ] Verify all Tasks 1-5 complete (check REPORT.md files)
- [ ] Production build working: `npm run build && npm run preview`
- [ ] Chrome DevTools familiar (Performance, Lighthouse, Memory tabs)
- [ ] Testing environment prepared (browsers ready, cache cleared)

**Phase 1: Environment Setup**
- [ ] Production build serving correctly
- [ ] Browser cache cleared
- [ ] Extensions disabled
- [ ] DevTools presets configured

**Phase 2: Baseline Static Performance**
- [ ] prefers-reduced-motion enabled
- [ ] Initial render profiled
- [ ] CLS checked with Layout Shift Regions
- [ ] Lighthouse baseline recorded

**Phase 3: Dynamic Performance (Full Animation)**
- [ ] prefers-reduced-motion disabled
- [ ] Slow scroll profiled (60fps verified)
- [ ] Fast scroll profiled (check frame drops)
- [ ] IntersectionObserver pause verified
- [ ] Lighthouse with animation recorded

**Phase 4: CPU Throttling**
- [ ] 4x throttling enabled
- [ ] Scroll performance >= 30fps verified
- [ ] Throttled Lighthouse run
- [ ] Decision: optimize or accept

**Phase 5: Bundle Size**
- [ ] Production build analyzed
- [ ] Hero3DBackground chunk size noted
- [ ] Total impact < 5KB confirmed (expected)

**Phase 6: Memory Leak Testing**
- [ ] Baseline snapshot taken
- [ ] Activity cycles completed (15 nav + 150 scroll)
- [ ] After-activity snapshot taken
- [ ] Comparison analyzed (no leaks confirmed)

**Phase 7: Real Mobile Device Testing**
- [ ] iOS device tested (if available) OR
- [ ] DevTools mobile emulation thoroughly tested
- [ ] FPS documented
- [ ] Touch responsiveness verified
- [ ] Battery impact checked

**Phase 8: Layout Stability (CLS)**
- [ ] Layout Shift Regions visual test (zero shifts)
- [ ] Lighthouse CLS = 0.000 verified
- [ ] Slow network CLS verified
- [ ] Slow CPU CLS verified

**Phase 9: Cross-Browser Performance**
- [ ] Firefox tested (55-60fps expected)
- [ ] Safari tested (50-60fps expected)
- [ ] Edge tested (60fps expected)
- [ ] All browsers: IntersectionObserver working
- [ ] All browsers: prefers-reduced-motion respected

**Phase 10: Optimization (Conditional)**
- [ ] IF any target not met: apply appropriate optimization
- [ ] Re-test after optimization
- [ ] Document changes made

**Phase 11: Documentation**
- [ ] solution.md updated with Performance Metrics section
- [ ] REPORT.md acceptance criteria all checked
- [ ] Hero3DBackground.svelte performance notes added
- [ ] Screenshots/evidence saved (Lighthouse report, etc.)

**Final Validation:**
- [ ] All acceptance criteria met (REPORT.md)
- [ ] All performance targets achieved
- [ ] Documentation complete
- [ ] Task ready to mark as COMPLETED

---

## Recommendation

**READY**

This task is ready for immediate execution. All prerequisites are in place:

**Strengths Supporting Readiness:**

1. **Solid Foundation:** Tasks 1-5 complete and verified. Implementation already showing strong performance (60fps, Lighthouse 95+, CLS 0.0 in Task 5 testing).

2. **Clear Methodology:** 11-phase testing plan with established tools and clear success criteria. Chrome DevTools and Lighthouse are mature, reliable tools.

3. **Realistic Expectations:** Not expecting to find major issues - this is validation and documentation, not troubleshooting. Prepared with optimization strategies if needed.

4. **Risk Mitigation:** All identified risks have clear testing protocols and fallback strategies. Most risks are low probability.

5. **Comprehensive Coverage:** Testing spans desktop/mobile, multiple browsers, various performance dimensions (rendering, scripting, memory, layout).

6. **Actionable Decision Tree:** Clear framework for when to optimize vs. accept results. Prioritized risk matrix (P0-P3) guides tradeoffs.

**Execution Strategy:**

1. **Sequential Phases:** Follow 11-phase plan in order (each builds on previous)
2. **Document as You Go:** Record metrics immediately after each phase
3. **Decision Points:** Stop and evaluate after critical phases (Phase 4 throttling, Phase 6 memory)
4. **Optimize if Needed:** If targets not met, apply appropriate strategy from decision tree
5. **Final Documentation:** Comprehensive performance report in solution.md

**Success Criteria for Task Completion:**

- [ ] All 8 acceptance criteria from REPORT.md checked off
- [ ] Frame rate: 60fps desktop, 30fps mobile (4x throttle)
- [ ] Lighthouse Performance >= 90
- [ ] CLS = 0.000 (zero layout shift)
- [ ] No memory leaks (verified via heap snapshots)
- [ ] Bundle size documented (expected < 5 KB)
- [ ] Cross-browser compatibility confirmed (Chrome, Firefox, Safari, Edge)
- [ ] Performance metrics documented in solution.md

**Estimated Time:** 2.5-3 hours

**Breakdown:**
- Setup + Baseline: 30 min
- Dynamic + Throttling: 45 min
- Bundle + Memory: 30 min
- Mobile + CLS: 45 min
- Cross-browser: 30 min
- Optimization (if needed): 0-60 min (hope for 0)
- Documentation: 20 min

**Confidence Level: HIGH**

Main execution is straightforward testing and documentation. Implementation quality (from Tasks 1-5) is high, so expecting clean test results. Primary value is validation and creating performance documentation for future reference.

**Potential Blockers:**

1. **Safari iOS < 30fps:** Medium probability. Mitigation ready (reduce mobile parallax).
2. **Low-end Android < 30fps:** Medium probability. Same mitigation.
3. **Real device availability:** High probability of limited access. Mitigation: thorough DevTools emulation, document limitation.

None are critical blockers - all have acceptable workarounds.

**Next Steps:**

1. Ensure production build working: `npm run build && npm run preview`
2. Start with Phase 1: Environment setup
3. Execute phases sequentially, documenting results
4. Apply optimizations only if targets not met
5. Complete with comprehensive documentation in solution.md
6. Mark task as COMPLETED in STARK framework

**Proceed with execution immediately.**

---

## Additional Notes

**Testing Best Practices:**

- Always test production builds for final metrics (dev has overhead)
- Run Lighthouse 3 times, take median score (variability is normal)
- Clear cache between test runs for consistency
- Test in incognito mode (avoid extension interference)
- Document test environment (CPU, RAM, OS, browser versions)

**Performance Philosophy:**

- 60fps is perceptual threshold for "smooth" on desktop
- 30fps is minimum acceptable on mobile (most users won't notice < 45fps)
- Lighthouse 90+ is Google's "good" threshold (SEO consideration)
- CLS 0.0 is achievable and should be target (not just < 0.1)
- Bundle size < 50KB is very conservative (actual < 5KB expected)

**Mobile Performance Reality:**

- Android fragmentation makes universal targets hard
- iPhone SE (2020) represents low-end but still capable device
- 4x CPU throttling in DevTools is aggressive (simulates very low-end)
- Real-world mobile likely 35-50fps (better than 4x throttled testing)

**Acceptable Tradeoffs:**

- Safari 55fps vs Chrome 60fps: imperceptible difference, acceptable
- Mobile 28fps on 4+ year old devices: edge case, acceptable
- Lighthouse 88-90: borderline, investigate but might accept if metric variance
- Bundle +5KB instead of +2KB: acceptable if justified (still << 50KB limit)

**Unacceptable Results (Must Fix):**

- CLS > 0.1: layout shift is poor UX, must eliminate
- Desktop < 50fps on modern hardware: too slow, investigate
- Memory leaks: critical for SPA, must fix
- Console errors: indicates bugs, must resolve

**Future Enhancements (Post-Task 6):**

- Automated performance regression testing in CI/CD
- Real User Monitoring (RUM) for production metrics
- Device tier detection for adaptive quality
- Performance budgets in build process
- Visual regression testing (Playwright/Chromatic)
