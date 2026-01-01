# Task: Create Background 3D Layer Component

**Solution:** stellar-banner-9d
**Task ID:** task-01-create-background-3d-layer
**Status:** Complete

---

## Description

Build a new Svelte component that serves as the 3D background layer for the hero banner. This component will render geometric shapes with depth using CSS 3D transforms, positioned behind the hero text content. The component must be configurable, performant, and integrate seamlessly with the existing SvelteKit + TypeScript + Tailwind CSS stack.

---

## Analysis

### Component Architecture

This task establishes the foundation for the entire 3D hero banner animation. The Hero3DBackground component will be a standalone, reusable effect component that:

1. **Separation of Concerns**: Isolates 3D visual effects from hero content logic
2. **Composability**: Accepts props for customization without requiring code changes
3. **Performance**: Uses CSS Grid or absolute positioning to avoid layout recalculations
4. **Type Safety**: Fully typed with TypeScript for maintainability

### Technical Approach

**Layering Strategy:**
- Use 3-4 geometric shapes (rectangles, circles, or abstract forms)
- Each shape positioned with unique `translateZ()` values to create depth
- Shapes layered from back to front (-200px to -50px translateZ range)
- Absolute positioning to prevent layout shifts

**Styling Strategy:**
- Subtle gradients matching site theme colors (based on existing Tailwind config)
- Semi-transparent shapes (opacity 0.1-0.3) to remain subtle
- Optional blur effects for depth-of-field illusion
- CSS custom properties for reactive updates in later tasks

**Component Props:**
- `colors`: Array of gradient colors (defaults to theme colors)
- `opacity`: Base opacity value (0-1)
- `blurAmount`: Optional blur filter value
- Allow flexibility for iteration without code changes

### Integration Considerations

**File Structure:**
```
src/lib/components/effects/Hero3DBackground.svelte
```

This creates a new `/effects/` directory for effect components, establishing a pattern for future visual enhancements.

**Dependencies:**
- Svelte 5 (already in project)
- TypeScript (already in project)
- Tailwind CSS v4 (already in project)
- No new npm dependencies required

**Potential Challenges:**
1. **Z-index management**: Must ensure shapes render behind text but above background
2. **Performance**: Must avoid triggering layout/paint on every frame
3. **Responsive design**: Shapes must adapt to different viewport sizes
4. **Theme integration**: Colors must complement existing design system

---

## Acceptance Criteria

- [ ] Create `src/lib/components/effects/Hero3DBackground.svelte`
- [ ] Component accepts props for customization (colors, opacity, blur amount)
- [ ] Uses CSS Grid or absolute positioning to layer 3-4 geometric shapes
- [ ] Each shape has unique `translateZ()` value for depth
- [ ] Shapes use subtle gradients matching site theme colors
- [ ] Component is fully typed with TypeScript
- [ ] No layout shift when component mounts

---

## Execution Plan

### Step 1: Create Component Directory and File
Create the new `/effects/` directory structure and the Hero3DBackground.svelte component file.

**Actions:**
- Create directory: `src/lib/components/effects/`
- Create file: `src/lib/components/effects/Hero3DBackground.svelte`
- Verify paths align with existing project structure

**Expected outcome:** Empty component file ready for implementation

---

### Step 2: Define Component Props Interface
Establish TypeScript interface for component props to ensure type safety.

**Actions:**
- Define `Hero3DBackgroundProps` interface with:
  - `colors?: string[]` - Array of gradient colors (optional, with defaults)
  - `opacity?: number` - Base opacity (0-1, default 0.2)
  - `blurAmount?: string` - CSS blur filter value (optional, e.g., "10px")
- Use Svelte 5 runes syntax (`$props()`)
- Provide sensible defaults for all props

**Expected outcome:** Fully typed component props with documentation

---

### Step 3: Implement Container Structure
Create the main container element with absolute positioning to prevent layout shifts.

**Actions:**
- Create wrapper `<div>` with absolute positioning
- Set `inset-0` (Tailwind) to fill parent container
- Add `pointer-events-none` to prevent interfering with clicks
- Set `overflow-hidden` to clip shapes outside bounds
- Add `z-index` lower than hero text content

**Expected outcome:** Container that fills hero section without affecting layout

---

### Step 4: Create Geometric Shape Elements
Implement 3-4 div elements representing geometric shapes with unique styling.

**Actions:**
- Create 3-4 `<div>` elements within container
- Use absolute positioning for each shape
- Assign different sizes (e.g., 400px, 600px, 500px, 300px)
- Position shapes at different coordinates (top, left, bottom, right)
- Add rounded corners (`border-radius`) for softer appearance
- Apply different rotation angles for visual variety

**Expected outcome:** Multiple shapes positioned across the hero background

---

### Step 5: Apply CSS 3D Transforms for Depth
Add `translateZ()` transforms to each shape to create depth layers.

**Actions:**
- Apply `transform: translateZ()` to each shape with unique values:
  - Shape 1: `translateZ(-200px)`
  - Shape 2: `translateZ(-150px)`
  - Shape 3: `translateZ(-100px)`
  - Shape 4: `translateZ(-50px)`
- Add subtle `rotateX()` and `rotateY()` (1-3 degrees) for dimension
- Use CSS custom properties for transform values (enables reactivity later)
- Add `will-change: transform` for GPU acceleration

**Expected outcome:** Shapes appear at different depth levels

---

### Step 6: Apply Gradient Styling
Add subtle gradient backgrounds to shapes using theme colors.

**Actions:**
- Apply `background: linear-gradient()` to each shape
- Use Tailwind theme colors or accept via props
- Vary gradient directions for visual interest (to bottom right, to top left, etc.)
- Apply opacity from props (default 0.2)
- Optional: Add backdrop-filter blur if `blurAmount` prop provided

**Expected outcome:** Shapes have subtle, themed gradient backgrounds

---

### Step 7: Add JSDoc Documentation
Document the component and its props for maintainability.

**Actions:**
- Add JSDoc comment at top of component explaining purpose
- Document each prop with type and description
- Add usage example in comments
- Note performance considerations

**Expected outcome:** Well-documented component code

---

### Step 8: Test Component in Isolation
Verify component renders correctly before integration.

**Actions:**
- Create temporary test route or use existing dev environment
- Import and render Hero3DBackground component
- Test with default props
- Test with custom props (colors, opacity, blur)
- Verify no console errors
- Check TypeScript compilation succeeds

**Expected outcome:** Component renders successfully with no errors

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Z-index conflicts with existing hero elements | Medium | High | Test integration early; use CSS layers or scoped z-index values |
| Shapes don't show depth perception | Medium | Medium | Experiment with translateZ values and perspective in parent; iterate on positioning |
| TypeScript type errors in Svelte 5 | Low | Low | Follow Svelte 5 runes documentation; use proper prop typing syntax |
| Component causes layout shift | Low | High | Use absolute positioning from start; test with Lighthouse CLS metric |
| Gradients don't match theme | Medium | Low | Reference existing Tailwind config; accept colors via props for flexibility |
| Performance overhead from filters | Low | Medium | Make blur optional; test performance impact; disable on mobile if needed |
| Component too complex for "subtle" requirement | Medium | Medium | Start minimal; iterate up; easy to simplify shapes or reduce opacity |

---

## Dependencies

**Must exist before execution:**
- Existing project at `/Users/devplex/Documents/Projects/Development/carlelieser/carlos-santos-site/`
- SvelteKit project structure with `src/lib/components/` directory
- TypeScript configuration
- Tailwind CSS v4 setup
- Svelte 5 installed and configured

**Must be true:**
- Tailwind config contains theme colors to reference
- Build system supports Svelte component creation
- No naming conflicts with existing components

**Will be created by this task:**
- New `/effects/` directory
- Hero3DBackground.svelte component

**Required for subsequent tasks:**
- This component must be complete before Task 5 (integration with Hero.svelte)
- Component structure must support Task 3 (scroll-based parallax via CSS custom properties)
