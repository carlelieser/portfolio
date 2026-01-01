# Task: Implement CSS 3D Transforms

**Solution:** stellar-banner-9d
**Task ID:** task-02-implement-css-3d-transforms
**Status:** Complete

---

## Description

Add CSS perspective container and transform styles to create depth effect with GPU acceleration. This task implements the core 3D visual foundation that creates the perception of depth in the hero banner by applying CSS 3D transforms to background elements.

---

## Analysis

### Technical Requirements

This task builds the fundamental 3D visual framework using pure CSS techniques. The implementation leverages CSS's built-in 3D rendering capabilities to create depth perception without requiring JavaScript libraries or WebGL, ensuring optimal performance and minimal bundle size impact.

**Key Technical Concepts:**

1. **CSS Perspective**: Creates the 3D viewing context by defining how far the viewer is from the z=0 plane. A perspective value between 1000px-1500px provides subtle depth without extreme distortion.

2. **Transform-style: preserve-3d**: Ensures child elements maintain their 3D transformations within the parent's 3D rendering context rather than being flattened.

3. **TranslateZ() Layering**: Creates depth by moving elements along the z-axis. Negative values (-200px to -50px) push elements back, creating a layered parallax effect.

4. **Subtle Rotation**: Small rotateX() and rotateY() values (< 5 degrees) add geometric interest while maintaining the "subtle" requirement.

5. **GPU Acceleration**: Using `will-change: transform` signals to the browser that these properties will be animated, triggering layer promotion for GPU-accelerated compositing.

6. **CSS Custom Properties**: Enables dynamic updating of transform values (for scroll/mouse parallax) without direct DOM manipulation.

### Integration Points

- **Hero3DBackground.svelte**: Component from Task 1 that will receive these CSS transforms
- **Hero.svelte**: Parent container that needs perspective applied
- **Existing theme**: Must integrate with current Tailwind CSS v4 setup and color scheme
- **Responsive design**: Transforms must adapt to different viewport sizes

### Performance Considerations

CSS 3D transforms are hardware-accelerated and highly performant because they:
- Trigger GPU compositing (moved to separate layer)
- Avoid layout and paint operations (only compositing)
- Can maintain 60fps on desktop, 30fps+ on mobile
- Have zero JavaScript overhead

### Browser Compatibility

CSS 3D transforms are well-supported across modern browsers:
- Chrome/Edge: Full support (unprefixed)
- Firefox: Full support (unprefixed)
- Safari: Full support (unprefixed, but occasionally has rendering quirks)
- Mobile browsers: iOS 9+, Android 5+

Potential issues:
- Safari may handle backface-visibility differently
- Some Android browsers may have limited transform-style support
- Performance varies on low-end mobile GPUs

### Dependencies on Other Tasks

- **Depends on Task 1**: Requires Hero3DBackground.svelte component to exist with geometric shapes to apply transforms to
- **Enables Task 3**: CSS custom properties set here will be dynamically updated by scroll parallax
- **Precedes Task 5**: Hero.svelte integration needs the CSS foundation established here

---

## Acceptance Criteria

From solution.md Task 2:

- [ ] Add `perspective` CSS property to hero section container (e.g., 1000px-1500px)
- [ ] Apply `transform-style: preserve-3d` to maintain 3D context
- [ ] Use `translateZ()` values ranging from -200px to -50px for layering
- [ ] Add subtle `rotateX()` and `rotateY()` transforms (< 5 degrees)
- [ ] Apply `will-change: transform` for performance optimization
- [ ] Use CSS custom properties for dynamic values
- [ ] Ensure proper backface-visibility handling

**Definition of Done:**
- [ ] 3D depth effect is clearly visible when viewing hero section
- [ ] No z-index conflicts with text or buttons
- [ ] Animations are smooth with no jank (60fps)
- [ ] Works across Chrome, Firefox, and Safari

---

## Execution Plan

### Step 1: Apply Perspective to Hero Container

**Action:** Add perspective CSS property to the parent hero section to establish 3D rendering context.

**Details:**
- Locate the main container `<div>` or `<section>` in Hero.svelte that wraps all hero content
- Add `style="perspective: 1200px;"` or use Tailwind CSS custom class
- Consider using CSS variable `--hero-perspective: 1200px` for easy adjustment
- Ensure perspective is applied to a container that wraps the 3D elements but not necessarily all hero content
- Test different perspective values (1000px, 1200px, 1500px) to find optimal depth

**Expected outcome:** Establishes the 3D viewing context; no visual change yet until transforms are applied to children.

---

### Step 2: Set Transform-Style on 3D Elements Container

**Action:** Apply `transform-style: preserve-3d` to maintain 3D rendering context for nested elements.

**Details:**
- In Hero3DBackground.svelte, apply `transform-style: preserve-3d` to the wrapper element containing geometric shapes
- This ensures child elements maintain their 3D position rather than being flattened
- May need to apply to intermediate containers if shapes are nested
- Use Tailwind arbitrary value: `class="[transform-style:preserve-3d]"` or custom CSS

**Expected outcome:** Child elements will now respect parent's 3D context and their own transforms.

---

### Step 3: Implement TranslateZ Layering for Depth

**Action:** Apply varying `translateZ()` values to each geometric shape to create depth layers.

**Details:**
- Identify 3-4 geometric shapes created in Task 1 (cards, circles, squares)
- Apply different `translateZ()` values to each:
  - Layer 1 (furthest): `translateZ(-200px)`
  - Layer 2: `translateZ(-150px)`
  - Layer 3: `translateZ(-100px)`
  - Layer 4 (closest): `translateZ(-50px)`
- Use CSS custom properties for each layer: `--layer-1-z: -200px`, etc.
- Apply via `style` attribute or scoped `<style>` block in component
- Ensure elements further back (more negative Z) appear smaller due to perspective

**Expected outcome:** Shapes appear at different depths, creating clear layering effect when viewed.

---

### Step 4: Add Subtle Rotation Transforms

**Action:** Apply small rotateX() and rotateY() values to add geometric dimension to shapes.

**Details:**
- Add rotation transforms to shapes to enhance 3D appearance
- Keep rotations subtle (between -5deg to +5deg) to maintain professional look
- Vary rotations per shape for visual interest:
  - Shape 1: `rotateX(2deg) rotateY(-3deg)`
  - Shape 2: `rotateX(-3deg) rotateY(2deg)`
  - Shape 3: `rotateX(1deg) rotateY(4deg)`
  - Shape 4: `rotateX(-2deg) rotateY(-1deg)`
- Combine with translateZ: `transform: translateZ(-150px) rotateX(2deg) rotateY(-3deg);`
- Use CSS custom properties: `--rotate-x: 2deg; --rotate-y: -3deg;`

**Expected outcome:** Shapes have subtle angular tilt, enhancing 3D perception without being distracting.

---

### Step 5: Configure GPU Acceleration with will-change

**Action:** Apply `will-change: transform` to signal browser for layer promotion and GPU compositing.

**Details:**
- Add `will-change: transform` to each animated shape element
- Apply to Hero3DBackground wrapper as well if entire component animates
- Be selective: only apply to elements that will actually animate (transforms change)
- Consider removing will-change after animation completes (if one-time) to free resources
- In Tailwind: use arbitrary value `class="[will-change:transform]"`

**Expected outcome:** Browser promotes elements to their own compositing layer, ensuring smooth 60fps rendering.

---

### Step 6: Set Up CSS Custom Properties for Dynamic Updates

**Action:** Implement CSS variables to enable runtime updates from JavaScript (for future scroll/mouse parallax).

**Details:**
- Define CSS custom properties in Hero3DBackground.svelte:
  ```css
  :root {
    --hero-3d-scroll-offset: 0;
    --hero-3d-mouse-x: 0;
    --hero-3d-mouse-y: 0;
  }
  ```
- Reference these in transform values:
  ```css
  transform: translateZ(calc(var(--layer-1-z) + var(--hero-3d-scroll-offset) * 1px))
             rotateX(calc(var(--rotate-x) + var(--hero-3d-mouse-y) * 0.01deg))
             rotateY(calc(var(--rotate-y) + var(--hero-3d-mouse-x) * 0.01deg));
  ```
- Set initial values to 0 (no effect until Task 3 updates them)
- Use Svelte's reactive `$effect` or `style:` directive to update CSS variables

**Expected outcome:** CSS variables are set up and ready for dynamic updates; transforms work with static initial values.

---

### Step 7: Handle Backface Visibility

**Action:** Set appropriate `backface-visibility` to prevent rendering glitches during rotation.

**Details:**
- Apply `backface-visibility: hidden` to shapes that rotate
- This prevents the "back" of elements from showing through during 3D rotation
- Particularly important for Safari which can render backfaces inconsistently
- May improve performance by allowing browser to skip rendering hidden faces
- Use Tailwind: `class="[backface-visibility:hidden]"`

**Expected outcome:** Clean rendering without flickering or showing element backs during rotation.

---

### Step 8: Test Cross-Browser Rendering

**Action:** Verify 3D transforms render correctly across Chrome, Firefox, and Safari.

**Details:**
- Open Hero section in Chrome DevTools, verify depth layers are visible
- Test in Firefox Developer Edition, check for rendering differences
- Test in Safari (macOS), watch for backface-visibility issues
- Use browser DevTools 3D View (Chrome) to visualize layer depth
- Check for any visual glitches, z-fighting, or clipping issues
- Verify text remains readable and CTAs are not obscured
- Test at different viewport sizes (desktop, tablet, mobile)

**Expected outcome:** Consistent 3D rendering across all three browsers with no visual artifacts.

---

### Step 9: Performance Profiling

**Action:** Profile rendering performance to ensure 60fps target is met.

**Details:**
- Open Chrome DevTools Performance tab
- Record 3-5 seconds of hero section viewing (static, no scrolling yet)
- Check for:
  - Frame rate: should be consistent 60fps
  - Compositing layers: elements should be on separate layers (green in Layers tab)
  - No layout thrashing or excessive paint operations
  - Memory usage: should be minimal (< 10MB for hero)
- Use Firefox Performance profiler as second opinion
- Test on CPU throttled (4x slowdown) to simulate low-end devices

**Expected outcome:** Solid 60fps with GPU-accelerated compositing, no layout or paint overhead.

---

### Step 10: Code Cleanup and Documentation

**Action:** Clean up implementation, add comments, and document the CSS approach.

**Details:**
- Add JSDoc comments explaining perspective, transform-style, and why specific values were chosen
- Document CSS custom properties and their intended use
- Add inline comments for non-obvious transform calculations
- Ensure code follows project style guide (Prettier, ESLint)
- Remove any debugging code or console.logs
- Verify TypeScript types are correct (if any props were added)

**Expected outcome:** Clean, well-documented code ready for team review and Task 3 (scroll parallax).

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Safari rendering inconsistencies with 3D transforms | Medium | Medium | Test early in Safari, use backface-visibility: hidden, add vendor prefixes if needed |
| Perspective value too strong creates cartoonish effect | Medium | Low | Start with conservative 1200px, iterate based on visual feedback, make easily adjustable via CSS variable |
| Z-index conflicts with existing hero text/CTAs | Low | High | Use negative translateZ only, keep text at z=0, test thoroughly with button interactions |
| Performance issues on low-end mobile devices | Medium | Medium | Use will-change judiciously, test on throttled CPU, consider disabling on mobile if needed |
| Transform calculations conflict with Tailwind utilities | Low | Low | Use arbitrary values syntax, prefer scoped `<style>` blocks for complex transforms |
| CSS custom properties not updating properly in Svelte | Low | Medium | Test reactive updates early, use style: directive or manual CSS variable setting |
| Depth effect too subtle to be noticeable | Medium | Low | Test with different perspective values (800px-1500px), adjust translateZ range if needed |
| Browser doesn't support transform-style: preserve-3d | Very Low | Medium | Extremely rare in modern browsers; provide 2D fallback if detected (feature query) |

---

## Dependencies

### Prerequisites (must exist before this task):
- **Task 1 completed**: Hero3DBackground.svelte component with geometric shapes created and integrated
- **Hero.svelte accessible**: Need to apply perspective to parent container
- **Development environment running**: SvelteKit dev server to preview changes
- **Browser DevTools available**: For testing and performance profiling

### Enables (tasks that depend on this):
- **Task 3 - Scroll Parallax**: CSS custom properties set up here will be updated by scroll listeners
- **Task 5 - Integration**: CSS 3D foundation must be stable before final integration testing
- **Task 6 - Performance Testing**: Baseline 3D performance established here will be compared after adding interactivity

### External Dependencies:
- Tailwind CSS v4: For arbitrary value syntax and responsive utilities
- Modern browser with CSS 3D transform support (Chrome 12+, Firefox 10+, Safari 4+)
- Svelte 5: For reactive style updates using runes or style: directive

---

## Notes

- This task focuses purely on static 3D transforms; no animation or interactivity yet
- The CSS custom properties are set up for future use but won't have visible effect until Task 3
- If visual effect is too subtle, consider increasing translateZ range or adjusting perspective
- If too pronounced, reduce rotation angles or increase perspective distance
- Keep accessibility in mind: even though this is decorative, ensure it doesn't interfere with content
- Document any browser-specific workarounds discovered during testing for future reference
