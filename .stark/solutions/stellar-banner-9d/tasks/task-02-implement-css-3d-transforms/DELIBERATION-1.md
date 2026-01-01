# Deliberation 1

**Task:** Implement CSS 3D Transforms
**Created:** 2025-12-15T21:30:00Z

---

## Review of Prior Thinking

This is the first deliberation for this task. The REPORT.md provides a comprehensive 10-step execution plan covering:

1. Applying perspective to the hero container (1000px-1500px)
2. Setting transform-style: preserve-3d on the 3D elements container
3. Implementing translateZ() layering for depth (-200px to -50px range)
4. Adding subtle rotation transforms (< 5 degrees)
5. Configuring GPU acceleration with will-change
6. Setting up CSS custom properties for dynamic updates
7. Handling backface-visibility
8. Cross-browser testing (Chrome, Firefox, Safari)
9. Performance profiling (60fps target)
10. Code cleanup and documentation

The approach builds on Task 1 (Hero3DBackground.svelte component) by adding the CSS 3D foundation that will enable scroll-based parallax in Task 3.

**Key insights from Task 1 deliberation:**
- Hero section uses simple structure with gradient background
- Color system is OKLCH-based with theme awareness
- Absolute positioning strategy chosen (shapes layer behind content)
- Pure CSS approach prioritized for performance and maintainability
- Task 1 created 3 geometric shapes ready for 3D transforms

---

## New Insights

### 1. Perspective Container Strategy

The REPORT.md suggests applying perspective to the hero section container. After reviewing Task 1's findings:

**Critical Decision Point: Where to apply perspective?**

**Option A: Hero section itself**
```svelte
<section class="[perspective:1200px]" ...>
```
- **Pro:** Minimal changes, one container for all 3D context
- **Pro:** All hero children can participate in 3D space
- **Con:** Might affect unintended elements (CTAs, text)

**Option B: Wrapper around Hero3DBackground only**
```svelte
<div class="[perspective:1200px] [transform-style:preserve-3d]">
  <Hero3DBackground />
</div>
```
- **Pro:** Isolates 3D context to background only
- **Pro:** More control over what participates in 3D
- **Con:** Adds extra DOM element

**Option C: Hero3DBackground component root**
```svelte
<!-- Inside Hero3DBackground.svelte -->
<div class="absolute inset-0 [perspective:1200px] [transform-style:preserve-3d]" ...>
```
- **Pro:** Self-contained, no Hero.svelte modifications needed
- **Pro:** 3D context is encapsulated within the component
- **Con:** Perspective origin might not align with hero section center

**Recommendation: Option A (Hero section perspective)**

Rationale:
- Task 3 (scroll parallax) will need access to the 3D context for updating transforms
- Applying perspective to the hero section makes the entire hero a 3D stage
- Easier to coordinate between content and background if they share 3D context
- Can use `transform-style: flat` on content to exclude it from 3D if needed

### 2. CSS Custom Properties Architecture

The REPORT.md proposes CSS custom properties for dynamic scroll/mouse updates. Based on Task 1's implementation:

**Proposed CSS Variables Structure:**

```css
/* Global 3D context variables (updated by scroll/mouse listeners) */
--hero-3d-scroll-offset: 0;
--hero-3d-mouse-x: 0;
--hero-3d-mouse-y: 0;

/* Per-shape static configuration */
--shape-1-z: -200px;
--shape-1-rot-x: 2deg;
--shape-1-rot-y: -3deg;

--shape-2-z: -150px;
--shape-2-rot-x: -1deg;
--shape-2-rot-y: 2deg;

--shape-3-z: -100px;
--shape-3-rot-x: 1deg;
--shape-3-rot-y: 1deg;

/* Parallax multipliers (different per layer) */
--shape-1-parallax: 0.5;
--shape-2-parallax: 0.8;
--shape-3-parallax: 1.2;
```

**Transform Composition:**
```css
transform:
  translateZ(calc(var(--shape-1-z) + var(--hero-3d-scroll-offset) * var(--shape-1-parallax) * 1px))
  rotateX(calc(var(--shape-1-rot-x) + var(--hero-3d-mouse-y) * 0.02deg))
  rotateY(calc(var(--shape-1-rot-y) + var(--hero-3d-mouse-x) * 0.02deg));
```

**Key Insight:** By using calc() with multipliers, different shapes can respond at different rates to the same input, creating authentic parallax depth.

### 3. Performance Optimization Strategy

**GPU Acceleration Best Practices:**

Based on browser rendering pipeline research:

1. **Compositing Triggers:**
   - `transform: translateZ()` (any non-zero Z value)
   - `will-change: transform` (signals upcoming changes)
   - `backface-visibility: hidden` (simplifies rendering)

2. **Layer Management:**
   - Each shape should be on its own compositing layer
   - Avoid creating unnecessary layers (memory cost)
   - Use Chrome DevTools Layers panel to verify

3. **Transform Combination:**
   - Combine all transforms in a single property
   - Browser optimizes single transform better than multiple
   - Order: translate → rotate → scale (standard convention)

**Anti-patterns to avoid:**
- Animating layout properties (top, left, width, height)
- Using `position: fixed` with transforms (can cause conflicts)
- Applying will-change to too many elements (defeats purpose)
- Mixing 2D and 3D transforms (use translate3d instead of translateX/Y)

### 4. Browser-Specific Considerations

**Safari-Specific Issues:**

Research and Task 1 insights reveal Safari needs special attention:

1. **Backface-visibility quirks:**
   - Safari sometimes renders backfaces even when hidden
   - Adding `-webkit-backface-visibility: hidden` explicitly helps
   - Test with rotations > 90 degrees to verify

2. **Transform-style flattening:**
   - Safari can flatten preserve-3d in certain scenarios
   - Avoid applying opacity or filters to preserve-3d containers
   - Keep 3D context chain unbroken (no flat interruptions)

3. **Perspective origin:**
   - Safari may interpret perspective-origin differently
   - Test with default (50% 50%) before customizing
   - Use pixel values instead of percentages if issues occur

**Firefox-Specific:**
- Generally robust with 3D transforms
- May have different anti-aliasing on rotated elements
- Test text readability if any text participates in 3D

**Mobile Browsers:**
- iOS Safari: same quirks as desktop but more sensitive to performance
- Chrome Android: generally consistent with desktop Chrome
- Consider disabling or simplifying 3D on older devices (budget phones)

### 5. TranslateZ Value Selection

The REPORT.md suggests -200px to -50px. Here's the mathematical reasoning:

**Perspective Math:**
With `perspective: 1200px`:
- Element at `translateZ(-200px)`: appears at 0.833x scale (83.3% size)
- Element at `translateZ(-150px)`: appears at 0.875x scale (87.5% size)
- Element at `translateZ(-100px)`: appears at 0.917x scale (91.7% size)
- Element at `translateZ(-50px)`: appears at 0.958x scale (95.8% size)

Formula: `scale = (perspective - |translateZ|) / perspective`

**Insight:** The size difference between layers is subtle (12-16% range). This creates depth without extreme distortion, aligning with the "subtle" requirement.

**Alternative values for testing:**
- **More dramatic:** -300px to -75px (75% to 94% scale, 19% difference)
- **More subtle:** -120px to -30px (90% to 97.5% scale, 7.5% difference)

**Recommendation:** Start with -200px to -50px as planned. If too subtle, increase range; if too dramatic, reduce range.

### 6. Rotation Value Psychology

**Why < 5 degrees?**

Research on visual perception and 3D interfaces:

1. **Depth cues without distraction:**
   - 1-3 degrees: barely noticeable, subliminal depth
   - 3-5 degrees: noticeable but professional, subtle tilt
   - 5-10 degrees: attention-grabbing, design element
   - 10+ degrees: dominant visual feature

2. **Geometric harmony:**
   - Varied rotations (some positive, some negative) create natural asymmetry
   - Combining rotateX and rotateY creates richer 3D perception than single axis
   - Small angles avoid text rendering issues (sub-pixel anti-aliasing artifacts)

**Proposed rotation values:**
- Shape 1: `rotateX(2deg) rotateY(-3deg)` (5deg resultant)
- Shape 2: `rotateX(-3deg) rotateY(2deg)` (opposite orientation)
- Shape 3: `rotateX(1deg) rotateY(4deg)` (minimal X, more Y)

**Reasoning:** Varied angles create visual interest; opposite signs create depth tension; staying under 5deg each maintains subtlety.

### 7. Z-Index Hierarchy Management

Task 1 established absolute positioning for Hero3DBackground. Now we need clear z-index strategy:

**Proposed Z-Index Stack:**
```
z-index: 30 → Hero CTAs and interactive elements
z-index: 20 → Hero text content (h1, p)
z-index: 10 → Gradient overlay (if any)
z-index: 0  → Hero3DBackground component
z-index: -1 → (reserved for future background layers)
```

**Implementation:**
```svelte
<!-- Hero.svelte -->
<section class="relative [perspective:1200px]">
  <!-- 3D Background at z-0 -->
  <Hero3DBackground />

  <!-- Content at z-10+ -->
  <div class="relative z-10">
    <h1 class="relative z-20">...</h1>
    <div class="relative z-30">
      <a>CTAs</a>
    </div>
  </div>
</section>
```

**Key principle:** All content gets `relative` positioning with explicit z-index to ensure proper stacking.

### 8. Accessibility Implications

While Task 4 handles prefers-reduced-motion, this task must set the foundation:

**Current task scope (Task 2):**
- Implement static 3D transforms (no animation yet)
- No accessibility concerns for static depth effect
- Ensure text remains readable (contrast, no obscuring)

**Preparation for Task 4:**
- Use CSS custom properties that can be easily disabled
- Structure transforms so they can be conditionally applied
- Keep 3D effect optional (can be removed via class or prop)

**Testing checklist for Task 2:**
- [ ] Text contrast still passes WCAG AA (4.5:1 for body text)
- [ ] Shapes don't obscure CTAs or clickable areas
- [ ] No visual interference with keyboard focus indicators
- [ ] Screen readers ignore decorative 3D elements (aria-hidden)

---

## Questions Resolved

**Q: Where should the perspective property be applied?**
**A:** On the hero `<section>` element itself. This creates a unified 3D context for both the background and any future enhancements while keeping implementation simple.

**Q: What exact perspective value should be used?**
**A:** Start with 1200px. This balances subtle depth (not too dramatic) with noticeable effect (not too flat). Can be adjusted via CSS variable for easy iteration.

**Q: How should CSS custom properties be structured?**
**A:** Three-tier system: (1) global input variables (scroll, mouse), (2) per-shape configuration (base transforms), (3) per-shape multipliers (parallax rates). This enables Task 3's dynamic updates while keeping this task's implementation clean.

**Q: Which elements should get will-change: transform?**
**A:** Only the geometric shapes inside Hero3DBackground. NOT the hero section itself or text content. Limit to 3-4 elements to avoid memory overhead.

**Q: Should backface-visibility be set?**
**A:** Yes, to `hidden`. This prevents Safari rendering quirks and can improve performance by allowing the browser to skip rendering shape backs.

**Q: How to combine transforms correctly?**
**A:** Single transform property with space-separated functions: `transform: translateZ(-150px) rotateX(2deg) rotateY(-3deg);`. Order matters for some effects, but for our use case (independent translate and rotate), order is flexible.

**Q: What happens if perspective is applied incorrectly?**
**A:** If applied to the wrong element, children won't inherit the 3D context. If applied too low in the tree, some elements will be flattened. Chrome DevTools Layers panel can diagnose this.

**Q: How do translateZ values interact with perspective?**
**A:** The formula is `apparent_scale = (perspective - |translateZ|) / perspective`. Negative Z moves away from viewer, making elements smaller. Our values (-200 to -50) create 83-96% sizing, a 13% range.

---

## Open Questions

**Q1: Should perspective-origin be customized?**
- Default is `perspective-origin: 50% 50%` (center)
- Could shift to create asymmetric depth effect
- Example: `perspective-origin: 30% 40%` shifts vanishing point left-up
- **Decision needed:** Test with default first. Only customize if depth feels off-center.

**Q2: Should shapes use translate3d() or separate translateZ()?**
- `translate3d(0, 0, -150px)` vs `translateZ(-150px)`
- translate3d forces GPU acceleration even without Z value
- Might be more explicit/readable
- **Decision needed:** Use translateZ() for clarity, as we're only moving on Z axis. Browser optimization is equivalent.

**Q3: Should there be a 4th shape or stay with 3?**
- REPORT.md suggests 3-4 shapes
- Task 1 implemented 3 shapes
- Adding a 4th could enhance depth perception
- Risk: visual clutter, performance cost
- **Decision needed:** Implement transforms for 3 shapes first. Add 4th only if depth perception is insufficient during testing.

**Q4: How aggressively should will-change be used?**
- Conservative: Only on shapes that will animate in Task 3
- Aggressive: On all 3D elements for maximum performance
- Trade-off: Memory usage vs rendering speed
- **Decision needed:** Apply to all 3 shapes (low count, high benefit). Monitor memory in DevTools.

**Q5: Should mobile devices get reduced 3D effect?**
- Could halve translateZ values on mobile (less dramatic depth)
- Could disable rotation on mobile (simpler geometry)
- Could disable 3D entirely on very small screens (< 375px)
- **Decision needed:** Implement same values across devices initially. Task 6 (performance testing) will determine if mobile needs simplification.

**Q6: How should the implementation handle non-supporting browsers?**
- 3D transforms have 98%+ support, but legacy browsers exist
- Could use @supports for graceful degradation
- Fallback: 2D layout with opacity variation instead of depth
- **Decision needed:** Given target is modern browsers, no fallback needed. Document minimum browser versions.

**Q7: Should transform-style: preserve-3d go on Hero section or Hero3DBackground?**
- Hero section: enables 3D for all children (future-proof)
- Hero3DBackground: isolates 3D to just the background component
- Mixing approaches could cause Safari flattening issues
- **Decision needed:** Apply to both: perspective on Hero section, preserve-3d on Hero3DBackground root. This maintains 3D chain.

---

## Confidence Assessment

| Aspect | Confidence | Notes |
|--------|------------|-------|
| **Understanding** | **High** | CSS 3D transforms are well-documented. Perspective math is clear. Browser quirks are known. Task 1 context provides good foundation. |
| **Approach** | **High** | Pure CSS strategy is proven. Integration points are clear (Hero.svelte, Hero3DBackground.svelte). Step-by-step plan is detailed and logical. |
| **Risks identified** | **High** | Known risks: Safari quirks, z-index conflicts, perspective value selection. All have clear mitigations. No major unknowns. |
| **Performance concerns** | **High** | CSS 3D transforms are GPU-accelerated and performant. will-change strategy is sound. No JavaScript overhead at this stage. Main risk is over-application. |
| **Visual outcome** | **Medium** | Transform values are mathematically sound but visual appeal is subjective. May need iteration on perspective, translateZ range, or rotation angles. Easy to adjust. |
| **Browser compatibility** | **High** | 3D transforms work in all modern browsers (Chrome 12+, Firefox 10+, Safari 4+). Safari has known quirks with documented solutions. Mobile support is strong. |
| **Integration complexity** | **High** | Changes are minimal and non-invasive: add perspective to Hero, apply transforms to shapes. No refactoring required. Z-index strategy is clear. |
| **Testing approach** | **High** | Clear testing strategy: Chrome DevTools Layers/Performance, cross-browser visual testing, 60fps verification. Success criteria are measurable. |

**Overall confidence: HIGH**

This task is well-scoped, technically sound, and builds cleanly on Task 1. The main uncertainty is visual tuning (perspective value, translateZ range, rotation angles), but all parameters are easily adjustable via CSS variables.

---

## Detailed Technical Plan

### Implementation Sequence

**Phase 1: Hero Section Perspective (5 min)**

1. Modify Hero.svelte to add perspective
2. Add transform-style if needed
3. Verify no visual changes yet (correct - needs child transforms)

**Phase 2: Hero3DBackground Transform Foundation (10 min)**

1. Add transform-style: preserve-3d to component root
2. Define CSS custom properties for each shape's base transforms
3. Apply static transforms to verify depth effect works

**Phase 3: Shape-Specific Transforms (15 min)**

1. Apply translateZ values: -200px, -150px, -100px
2. Add subtle rotations: varied per shape, < 5deg each
3. Test visual depth perception in browser

**Phase 4: Performance Optimization (10 min)**

1. Add will-change: transform to shapes
2. Set backface-visibility: hidden
3. Verify GPU acceleration in Chrome DevTools Layers

**Phase 5: CSS Custom Properties Setup (15 min)**

1. Define global input variables (scroll-offset, mouse-x/y)
2. Define per-shape configuration variables
3. Implement calc() expressions for dynamic transforms
4. Set initial values to 0 (no effect until Task 3)

**Phase 6: Cross-Browser Testing (20 min)**

1. Test in Chrome (primary development browser)
2. Test in Firefox (verify rendering consistency)
3. Test in Safari (check for quirks, backface issues)
4. Document any browser-specific fixes needed

**Phase 7: Performance Profiling (15 min)**

1. Chrome DevTools Performance: record 5s, check 60fps
2. Chrome DevTools Layers: verify compositing layers
3. Test with CPU throttling (4x slowdown)
4. Verify no layout thrashing or excessive paint

**Phase 8: Code Documentation (10 min)**

1. Add JSDoc comments explaining perspective choice
2. Document CSS variable purpose and usage
3. Explain transform value rationale
4. Note browser compatibility considerations

**Total estimated time: 1.5-2 hours**

---

## Risk Assessment - Detailed

### Risk 1: Safari Rendering Quirks with 3D Transforms

**Probability:** Medium (Safari is known for 3D inconsistencies)
**Impact:** Medium (visual glitches could degrade experience)

**Specific issues to watch for:**
- Backface visibility: shapes showing "through" themselves during rotation
- Perspective flattening: losing 3D context unexpectedly
- Anti-aliasing artifacts: jagged edges on rotated elements
- Opacity + 3D: combining can cause flattening in Safari

**Mitigation strategy:**
1. Set `-webkit-backface-visibility: hidden` explicitly
2. Avoid applying opacity to preserve-3d containers (apply to children instead)
3. Test early and often in Safari during development
4. Use Chrome DevTools Device Mode to simulate iOS Safari
5. Have fallback: if Safari issues are severe, consider disabling 3D on Safari via browser detection (last resort)

**Validation:**
- Manual testing in Safari (macOS and iOS)
- Visual inspection for backface bleeding, flattening, artifacts
- Compare side-by-side with Chrome to identify discrepancies

---

### Risk 2: Perspective Value Doesn't Create Desired Depth Effect

**Probability:** Medium (subjective visual judgment)
**Impact:** Medium (could look too flat or too exaggerated)

**Specific scenarios:**
- Too high (> 1500px): depth effect too subtle, shapes barely differ in size
- Too low (< 1000px): depth effect too dramatic, distortion becomes noticeable
- Perspective origin misaligned: asymmetric depth that feels unbalanced

**Mitigation strategy:**
1. Start with 1200px (middle of suggested range)
2. Implement as CSS custom property `--hero-perspective: 1200px` for easy adjustment
3. Test visually with 3 values: 1000px, 1200px, 1500px
4. Get peer feedback on which feels most "subtle yet noticeable"
5. Document final choice and rationale

**Validation:**
- Visual review in browser at different perspective values
- Screenshot comparison of the 3 options
- Stakeholder/team feedback session
- Ensure depth is noticeable but not distracting

---

### Risk 3: Z-Index Conflicts Obscure Hero Content

**Probability:** Low (absolute positioning + z-index management should prevent)
**Impact:** High (would break hero section UX)

**Specific scenarios:**
- Shapes render in front of text (wrong z-index)
- CTAs become unclickable (pointer-events issue)
- Focus indicators hidden behind shapes (accessibility issue)

**Mitigation strategy:**
1. Set Hero3DBackground to `z-index: 0`
2. Set all hero content to `relative` with `z-index: 10+`
3. Use `pointer-events: none` on Hero3DBackground
4. Test tab navigation to ensure focus order is correct
5. Test all interactive elements (buttons, links) for clickability

**Validation:**
- Visual inspection: ensure text is always in front
- Keyboard navigation test: tab through all interactive elements
- Click test: verify all buttons/links work
- DevTools Elements panel: inspect computed z-index values

---

### Risk 4: TranslateZ Values Create Insufficient or Excessive Depth

**Probability:** Medium (values are estimated, need visual validation)
**Impact:** Low to Medium (can be easily adjusted)

**Specific scenarios:**
- Too subtle: -50px to -20px might be imperceptible
- Too extreme: -400px to -100px might look cartoonish
- Wrong spacing: uneven distribution might cluster shapes visually

**Mitigation strategy:**
1. Implement with planned values: -200px, -150px, -100px, -50px
2. Implement as CSS variables for easy adjustment: `--shape-1-z: -200px`
3. Prepare alternative value sets for testing:
   - More dramatic: -300px, -200px, -120px, -60px
   - More subtle: -150px, -110px, -70px, -30px
4. Visual testing with all three sets
5. Use Chrome 3D View to visualize layer separation

**Validation:**
- Chrome DevTools Layers panel: 3D visualization of depth
- Side-by-side comparison of value sets
- Measure apparent size differences (should be 10-20% between closest and farthest)
- Peer feedback on visual appeal

---

### Risk 5: Performance Degradation on Low-End Devices

**Probability:** Low (CSS 3D is well-optimized, but mobile GPUs vary)
**Impact:** Medium (could cause jank, poor UX on budget phones)

**Specific scenarios:**
- Frame drops below 30fps on mobile (unacceptable)
- High memory usage from compositing layers
- Battery drain from continuous GPU usage
- Older Android devices with poor GPU support

**Mitigation strategy:**
1. Apply will-change only to animated elements (3 shapes max)
2. Use GPU-accelerated properties exclusively (transform only)
3. Test with Chrome DevTools CPU throttling (4x slowdown)
4. Consider disabling 3D on older devices via media queries or feature detection
5. Implement IntersectionObserver to pause when hero not in view (Task 3)

**Validation:**
- Performance profiling with CPU throttling
- Test on real mobile device (iOS and Android if available)
- Monitor memory usage in DevTools Memory panel
- Lighthouse performance audit (target: >= 90 score)
- Test on BrowserStack for older device simulation

---

### Risk 6: CSS Custom Properties Don't Update Reactively

**Probability:** Low (Svelte handles CSS variables well, but edge cases exist)
**Impact:** Medium (would block Task 3 scroll parallax)

**Specific scenarios:**
- Style binding doesn't trigger browser repaint
- CSS variables scoped incorrectly (not accessible to shapes)
- Calc() expressions don't recalculate on variable change
- Race condition between JS update and CSS application

**Mitigation strategy:**
1. Use Svelte's `style:` directive for reliable CSS variable binding
2. Set CSS variables on a container element that wraps shapes
3. Test reactivity early: create a test input to manually change variables
4. Use Chrome DevTools Animation panel to verify updates
5. Ensure variables are set as inline styles, not in `<style>` blocks

**Validation:**
- Manual test: change CSS variable via DevTools, observe shape movement
- Svelte reactivity test: bind variable to input, verify transform updates
- Performance test: ensure updates don't trigger layout thrashing
- Console logging: verify JavaScript is updating variables correctly

---

## Implementation Checklist

Based on REPORT.md steps and this deliberation:

**Step 1: Apply Perspective to Hero Container**
- [ ] Open Hero.svelte
- [ ] Locate the main `<section>` element
- [ ] Add `style="perspective: 1200px;"` or use Tailwind arbitrary value
- [ ] Add CSS custom property: `--hero-perspective: 1200px`
- [ ] Verify in browser DevTools that perspective is applied

**Step 2: Set Transform-Style on 3D Elements Container**
- [ ] Open Hero3DBackground.svelte
- [ ] Add `transform-style: preserve-3d` to the root container div
- [ ] Use Tailwind arbitrary value: `class="[transform-style:preserve-3d]"`
- [ ] Verify no visual change yet (correct - needs child transforms)

**Step 3: Implement TranslateZ Layering for Depth**
- [ ] Define CSS custom properties: `--shape-1-z`, `--shape-2-z`, `--shape-3-z`
- [ ] Set values: -200px, -150px, -100px (or -50px if 4 shapes)
- [ ] Apply to each shape: `style="transform: translateZ(var(--shape-1-z));"`
- [ ] View in browser: shapes should appear at different depths/sizes

**Step 4: Add Subtle Rotation Transforms**
- [ ] Define rotation variables: `--shape-1-rot-x`, `--shape-1-rot-y`, etc.
- [ ] Set values: varied per shape, between -5deg and +5deg
- [ ] Combine with translateZ: `transform: translateZ(...) rotateX(...) rotateY(...);`
- [ ] Verify shapes have subtle angular tilt

**Step 5: Configure GPU Acceleration with will-change**
- [ ] Add `will-change: transform` to each shape element
- [ ] Use Tailwind: `class="[will-change:transform]"`
- [ ] Open Chrome DevTools Layers panel
- [ ] Verify each shape is on its own compositing layer (green)

**Step 6: Set Up CSS Custom Properties for Dynamic Updates**
- [ ] Define global input variables: `--hero-3d-scroll-offset: 0`, `--hero-3d-mouse-x: 0`, `--hero-3d-mouse-y: 0`
- [ ] Define per-shape parallax multipliers: `--shape-1-parallax`, etc.
- [ ] Update transform calc() expressions to include dynamic components
- [ ] Test by manually changing variables in DevTools (shapes should move)

**Step 7: Handle Backface Visibility**
- [ ] Add `backface-visibility: hidden` to all shapes
- [ ] Use Tailwind: `class="[backface-visibility:hidden]"`
- [ ] Test in Safari: verify no backface bleeding on rotation

**Step 8: Test Cross-Browser Rendering**
- [ ] Test in Chrome: verify depth layers visible, no glitches
- [ ] Test in Firefox: check for rendering consistency
- [ ] Test in Safari: watch for backface/flattening issues
- [ ] Use browser DevTools 3D View to visualize layers
- [ ] Document any browser-specific fixes applied

**Step 9: Performance Profiling**
- [ ] Open Chrome DevTools Performance tab
- [ ] Record 5 seconds of static viewing (no scrolling yet)
- [ ] Verify frame rate is 60fps
- [ ] Check Layers panel: shapes on separate layers
- [ ] Test with 4x CPU throttling: verify >= 30fps
- [ ] Run Lighthouse audit: Performance score >= 90

**Step 10: Code Cleanup and Documentation**
- [ ] Add JSDoc comments explaining perspective value choice
- [ ] Document CSS custom properties and their purpose
- [ ] Add inline comments for transform calculations
- [ ] Explain browser compatibility notes (Safari quirks)
- [ ] Remove any debugging code or console.logs
- [ ] Verify code follows project style guide (Prettier/ESLint)

---

## Recommendation

**READY**

This task is ready for immediate execution. The technical approach is solid, risks are well-understood with clear mitigations, and the implementation path is detailed and achievable.

**Key factors supporting readiness:**

1. **Clear Foundation:** Task 1 is complete, providing the Hero3DBackground component with geometric shapes ready for transforms
2. **Proven Technology:** CSS 3D transforms are well-supported, performant, and extensively documented
3. **Low Complexity:** Implementation is straightforward CSS application, no complex logic or algorithms
4. **Easy Iteration:** All values (perspective, translateZ, rotations) are adjustable via CSS variables
5. **Measurable Success:** Clear criteria (60fps, visible depth, cross-browser consistency)
6. **Minimal Risk:** All identified risks have clear mitigations and validation strategies

**Execution Strategy:**

1. **Sequential Implementation:** Follow the 10-step plan in REPORT.md exactly
2. **Visual Validation at Each Step:** After each step, check browser to verify expected outcome
3. **Early Safari Testing:** Test in Safari by Step 4 to catch quirks early
4. **Performance Check After Step 5:** Verify GPU acceleration is working before continuing
5. **Iteration Window:** Steps 1-4 have adjustable parameters; be prepared to tweak values based on visual feedback

**Success Criteria for Task Completion:**

- [ ] 3D depth effect is clearly visible in the hero section
- [ ] Shapes appear at different sizes/depths (parallax layering obvious)
- [ ] No z-index conflicts (text and CTAs in front of shapes)
- [ ] Solid 60fps performance (verified in Chrome DevTools)
- [ ] Consistent rendering across Chrome, Firefox, and Safari
- [ ] CSS custom properties set up and tested (manually changeable in DevTools)
- [ ] No layout shift, no visual glitches, no console errors
- [ ] Code is clean, documented, and follows project conventions

**Blockers/Dependencies:**

- **Task 1 must be complete:** Hero3DBackground.svelte must exist with shapes
- **Development server running:** Need to preview changes in real-time
- **Browsers available for testing:** Chrome, Firefox, Safari

**Estimated Time:** 1.5-2 hours including testing and documentation

**Next Steps:**

1. Verify Task 1 is complete (check that Hero3DBackground.svelte exists and renders)
2. Execute Step 1: Apply perspective to Hero.svelte
3. Proceed sequentially through Steps 2-10
4. Test thoroughly at Steps 6 (after CSS variables) and 9 (performance profiling)
5. Update REPORT.md with actual values chosen (perspective, translateZ, rotations)

**Confidence Level:** VERY HIGH

This is a well-defined, low-risk task with a clear implementation path. The main variables are aesthetic (perspective value, depth amount, rotation degrees), which are easily tunable. No technical blockers anticipated.

**Proceed with execution.**
