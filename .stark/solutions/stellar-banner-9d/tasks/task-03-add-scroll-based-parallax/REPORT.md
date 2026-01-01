# Task: Add Scroll-Based Parallax Animation

**Solution:** stellar-banner-9d
**Task ID:** task-03-add-scroll-based-parallax
**Status:** Complete

---

## Description

Implement subtle scroll-based parallax animation using Svelte's reactivity to update transforms based on scroll position. This will create a dynamic parallax effect where the 3D background layers move at different speeds when the user scrolls, enhancing the depth perception and visual engagement of the hero banner.

---

## Analysis

### Technical Requirements

This task builds on the foundation established in Task 1 (Hero3DBackground component) and Task 2 (CSS 3D transforms). The parallax effect needs to:

1. **Track Scroll Position**: Monitor the window scroll Y position efficiently without causing performance issues
2. **Calculate Parallax Offsets**: Apply different transformation rates to each layer based on their depth (z-index/translateZ values)
3. **Update Reactively**: Use Svelte's reactive system to update CSS custom properties that control the transforms
4. **Optimize Performance**:
   - Use requestAnimationFrame for smooth updates
   - Throttle scroll events to prevent excessive calculations
   - Only apply parallax when hero section is in viewport (IntersectionObserver)
5. **Lifecycle Management**: Properly clean up event listeners and observers on component unmount

### Implementation Approach

**Option 1: Svelte Store with Scroll Listener (Recommended)**
- Create a derived store that tracks scroll position
- Use `$effect` rune to set up scroll listener with RAF throttling
- Update CSS custom properties via reactive bindings
- Pros: Clean separation, reusable, follows Svelte 5 patterns
- Cons: Slight overhead of store system

**Option 2: Component-Level State with `$state` Rune**
- Use `$state` to track scroll position directly in Hero3DBackground
- Implement scroll listener in `$effect` with RAF
- Update style bindings directly
- Pros: Simpler, more direct, less abstraction
- Cons: Less reusable, tied to component

**Option 3: Svelte Action (use: directive)**
- Create a custom action for parallax behavior
- Encapsulate scroll logic in reusable action
- Pros: Highly reusable, clean separation of concerns
- Cons: More complex setup, might be overkill for single use

**Selected Approach**: Option 2 (Component-Level State) for simplicity and directness, with Option 3 as fallback if reusability becomes needed.

### Performance Considerations

1. **Scroll Event Throttling**: Scroll events fire very frequently (often 60+ times per second). We need to:
   - Use `requestAnimationFrame` to sync with browser paint cycles
   - Debounce calculations to run at most once per frame
   - Avoid expensive calculations in the scroll handler

2. **IntersectionObserver**: Only apply parallax when hero is visible:
   - Set up observer to detect when hero section enters/exits viewport
   - Pause scroll listener when hero is not in view
   - Resume when it re-enters (if user scrolls back up)

3. **Transform Calculation**:
   - Pre-calculate parallax multipliers for each layer
   - Use simple arithmetic (avoid trigonometry or complex math)
   - Update CSS custom properties (very efficient in modern browsers)

4. **GPU Acceleration**:
   - Ensure transforms use `translateZ()` or `translate3d()` to trigger GPU
   - Avoid changing properties that cause layout recalculation

### Parallax Rate Calculation

For natural parallax, layers further back (larger negative translateZ) should move more slowly:

```javascript
// Example calculation
const baseScrollSpeed = 0.5; // Adjust for subtlety
const layerDepth = -100; // From translateZ value
const parallaxOffset = scrollY * (1 + layerDepth / 1000) * baseScrollSpeed;
```

Layers closer to viewer (smaller negative translateZ) move faster, creating depth illusion.

### Accessibility Integration

Must respect `prefers-reduced-motion` from Task 4:
- Check media query state before applying parallax
- If reduced motion preferred, disable scroll listener entirely
- Static 3D depth is maintained, but no movement occurs

---

## Acceptance Criteria

- [ ] Create Svelte store or component state for scroll Y position
- [ ] Add scroll event listener with throttling/requestAnimationFrame
- [ ] Calculate parallax offset based on scroll position (different rates per layer)
- [ ] Update CSS custom properties reactively
- [ ] Parallax effect only active within hero section viewport
- [ ] Proper cleanup of scroll listeners on component unmount
- [ ] Use IntersectionObserver to pause when hero not in view

---

## Execution Plan

### Step 1: Set Up Scroll State Tracking

**Action**: Create reactive state to track scroll position and viewport visibility

**Implementation**:
```typescript
// In Hero3DBackground.svelte
let scrollY = $state(0);
let isInViewport = $state(true);
let rafId = $state<number | null>(null);
```

**Validation**: State variables are properly typed and initialized

---

### Step 2: Implement IntersectionObserver

**Action**: Set up observer to track when hero section is in viewport

**Implementation**:
```typescript
$effect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      isInViewport = entries[0].isIntersecting;
    },
    { threshold: 0.1 }
  );

  // Observe hero container element
  const heroElement = document.querySelector('[data-hero-section]');
  if (heroElement) observer.observe(heroElement);

  return () => observer.disconnect();
});
```

**Validation**: Observer properly tracks hero visibility and cleans up on unmount

---

### Step 3: Create Throttled Scroll Listener with RAF

**Action**: Implement performant scroll tracking using requestAnimationFrame

**Implementation**:
```typescript
$effect(() => {
  if (!isInViewport) return;

  let ticking = false;

  const handleScroll = () => {
    if (!ticking) {
      rafId = requestAnimationFrame(() => {
        scrollY = window.scrollY;
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', handleScroll);
    if (rafId) cancelAnimationFrame(rafId);
  };
});
```

**Validation**:
- Scroll listener fires efficiently (check DevTools Performance)
- RAF properly throttles updates
- Passive listener improves scroll performance
- Cleanup prevents memory leaks

---

### Step 4: Calculate Parallax Offsets for Each Layer

**Action**: Create derived values for parallax offsets based on scroll position and layer depth

**Implementation**:
```typescript
// Define layer depths (matching translateZ values from Task 2)
const layers = [
  { id: 'layer-1', depth: -200, speed: 0.3 },
  { id: 'layer-2', depth: -150, speed: 0.5 },
  { id: 'layer-3', depth: -100, speed: 0.7 },
  { id: 'layer-4', depth: -50, speed: 0.9 }
];

// Calculate offsets using $derived
const parallaxOffsets = $derived(
  layers.map(layer => ({
    id: layer.id,
    offsetY: scrollY * layer.speed,
    offsetX: scrollY * layer.speed * 0.3 // Subtle horizontal shift
  }))
);
```

**Validation**:
- Offsets calculate correctly for each scroll position
- Different layers move at visually distinct rates
- Movement is subtle and not distracting

---

### Step 5: Apply Parallax via CSS Custom Properties

**Action**: Update component template to use calculated offsets

**Implementation**:
```svelte
{#each parallaxOffsets as layer}
  <div
    class="parallax-layer"
    data-layer={layer.id}
    style:--parallax-y="{layer.offsetY}px"
    style:--parallax-x="{layer.offsetX}px"
  >
    <!-- Layer content -->
  </div>
{/each}

<style>
  .parallax-layer {
    transform:
      translateZ(var(--layer-depth))
      translateY(var(--parallax-y))
      translateX(var(--parallax-x));
    will-change: transform;
  }
</style>
```

**Validation**:
- CSS custom properties update reactively
- Transforms apply smoothly
- No visual glitches or jumps

---

### Step 6: Add Boundary Constraints

**Action**: Limit parallax effect to hero section bounds (prevent infinite scrolling offsets)

**Implementation**:
```typescript
const MAX_SCROLL_EFFECT = 500; // Max scroll distance to consider

const parallaxOffsets = $derived(
  layers.map(layer => {
    const clampedScroll = Math.min(scrollY, MAX_SCROLL_EFFECT);
    return {
      id: layer.id,
      offsetY: clampedScroll * layer.speed,
      offsetX: clampedScroll * layer.speed * 0.3
    };
  })
);
```

**Validation**:
- Parallax stops increasing after hero section scrolls out of view
- Effect feels natural and intentional

---

### Step 7: Performance Testing

**Action**: Profile scroll performance and optimize

**Testing Steps**:
1. Open Chrome DevTools Performance tab
2. Start recording
3. Scroll through hero section multiple times
4. Stop recording and analyze:
   - Frame rate (target: 60fps)
   - Function call frequency
   - RAF scheduling
   - No long tasks (> 50ms)

**Optimization if needed**:
- Increase throttle interval if too many calculations
- Simplify offset calculations
- Reduce number of layers if performance issues

**Validation**:
- 60fps maintained on desktop during scroll
- No dropped frames or jank
- CPU usage minimal (< 10% on modern hardware)

---

### Step 8: Integration Testing

**Action**: Test parallax with existing hero content

**Test Cases**:
1. Scroll down slowly - smooth parallax movement
2. Scroll up - parallax reverses correctly
3. Fast scroll - no visual glitches
4. Scroll past hero - effect stops appropriately
5. Resize window - parallax adjusts correctly
6. Mobile device - effect works or gracefully degrades

**Validation**:
- All test cases pass
- No interference with hero text or CTAs
- Effect enhances rather than distracts

---

### Step 9: Code Documentation

**Action**: Add comprehensive JSDoc comments

**Documentation to include**:
- Scroll tracking logic explanation
- RAF throttling pattern
- IntersectionObserver usage
- Parallax calculation formula
- Performance considerations

**Validation**:
- All functions have JSDoc comments
- Complex logic is well-explained
- Future maintainers can understand approach

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Performance degradation on low-end devices** | Medium | High | Implement IntersectionObserver to pause when not visible; use passive scroll listeners; test on throttled CPU |
| **Scroll jank or dropped frames** | Medium | High | Use RAF throttling; minimize calculations in scroll handler; profile early and often |
| **Memory leaks from event listeners** | Low | Medium | Proper cleanup in `$effect` return function; test mounting/unmounting |
| **Browser inconsistencies with smooth scrolling** | Low | Medium | Test across browsers early; use standardized APIs (IntersectionObserver, RAF) |
| **Parallax feels too aggressive or distracting** | Medium | Medium | Start with very subtle multipliers; make configurable; get early feedback |
| **Integration breaks existing hero layout** | Low | High | Test thoroughly before committing; use isolated CSS custom properties |
| **Accessibility violation (motion sickness)** | Low | High | Will be addressed in Task 4 with prefers-reduced-motion; keep effect subtle |
| **Mobile performance issues** | High | Medium | Test early on mobile; consider disabling or simplifying on small screens |

---

## Dependencies

### Must Exist Before Execution

1. **Task 1 Complete**: Hero3DBackground.svelte component must exist with layered elements
2. **Task 2 Complete**: CSS 3D transforms and perspective must be applied
3. **Layer Identification**: Each parallax layer must have unique identifier (data attribute or class)
4. **Depth Values**: translateZ values must be defined for offset calculation

### Technical Dependencies

1. **Svelte 5**: Requires `$state`, `$derived`, and `$effect` runes
2. **Modern Browser APIs**:
   - IntersectionObserver (supported in all modern browsers)
   - requestAnimationFrame (universal support)
   - CSS custom properties (universal support)
3. **Hero Section DOM Reference**: Need way to identify hero container element

### Knowledge Dependencies

1. Understanding of Svelte 5 reactivity system
2. Knowledge of RAF throttling patterns
3. Familiarity with IntersectionObserver API
4. Understanding of CSS transform performance implications

---

## Definition of Done

- [ ] Scroll position tracked efficiently with RAF throttling
- [ ] Parallax offsets calculate correctly for each layer
- [ ] CSS custom properties update reactively on scroll
- [ ] IntersectionObserver pauses effect when hero not visible
- [ ] Event listeners and observers clean up on unmount
- [ ] Performance maintains 60fps on desktop during scroll
- [ ] No memory leaks (verified with DevTools Memory profiler)
- [ ] Effect is subtle and enhances depth perception
- [ ] Code is documented with JSDoc comments
- [ ] Integration testing passes all cases
- [ ] Ready for Task 4 (accessibility implementation)

---

## Notes

- Keep parallax multipliers very subtle (0.3-0.9 range) to maintain "subtle" requirement
- Consider adding easing function for smoother parallax feel (optional enhancement)
- May need to adjust parallax rates after visual testing - make configurable
- Document parallax rate constants for easy tuning
- Consider creating a small utility function for parallax calculation if logic becomes complex
