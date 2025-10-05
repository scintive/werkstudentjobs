# Design System Documentation

This project uses a comprehensive design system with reusable CSS classes for consistent, beautiful UI components.

## 📝 Typography

### Headings
```tsx
<h1 className="text-display">Display Text</h1>           // 2rem, bold, tight tracking
<h1 className="text-heading-1">Heading 1</h1>           // 1.75rem, bold
<h2 className="text-heading-2">Heading 2</h2>           // 1.5rem, bold
<h3 className="text-heading-3">Heading 3</h3>           // 1.25rem, semibold
<h4 className="text-heading-4">Heading 4</h4>           // 1.125rem, semibold
```

### Body Text
```tsx
<p className="text-body-large">Large body text</p>      // 1rem
<p className="text-body">Regular body text</p>          // 0.9375rem
<p className="text-body-small">Small body text</p>      // 0.875rem
<p className="text-caption">Caption text</p>            // 0.8125rem, medium weight
<p className="text-label">Label text</p>                // 0.875rem, semibold
```

## 🔘 Buttons

### Button Styles
```tsx
<button className="btn btn-primary">Primary</button>           // Blue gradient
<button className="btn btn-secondary">Secondary</button>       // Gray with border
<button className="btn btn-ghost">Ghost</button>               // Transparent
<button className="btn btn-success">Success</button>           // Green gradient
<button className="btn btn-danger">Danger</button>             // Red gradient
```

### Button Sizes
```tsx
<button className="btn btn-primary btn-sm">Small</button>      // Smaller padding
<button className="btn btn-primary">Default</button>           // Standard size
<button className="btn btn-primary btn-lg">Large</button>      // Larger padding
```

### Icon Buttons
```tsx
<button className="btn-icon btn-primary">
  <Icon className="w-5 h-5" />
</button>

<button className="btn-icon btn-ghost btn-sm">              // Small icon button
  <Icon className="w-4 h-4" />
</button>
```

## 📦 Cards

### Basic Cards
```tsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Card Title</h3>
    <p className="card-subtitle">Subtitle text</p>
  </div>
  <div className="card-body">Card content here</div>
</div>

<div className="card card-elevated">                     // Card with shadow
  Content here
</div>
```

## 🏷️ Badges

### Badge Variants
```tsx
<span className="badge badge-primary">Primary</span>          // Blue
<span className="badge badge-success">Success</span>          // Green
<span className="badge badge-warning">Warning</span>          // Yellow
<span className="badge badge-danger">Danger</span>            // Red
<span className="badge badge-purple">Purple</span>            // Purple
<span className="badge badge-emerald">Emerald</span>          // Emerald
```

### Badge Sizes
```tsx
<span className="badge badge-primary badge-sm">Small</span>
<span className="badge badge-primary">Default</span>
<span className="badge badge-primary badge-lg">Large</span>
```

## 🎨 Icon Containers

### Icon Container Variants
```tsx
<div className="icon-container icon-container-md icon-container-primary">
  <Icon className="w-5 h-5" />
</div>

<div className="icon-container icon-container-lg icon-container-success">
  <Icon className="w-6 h-6" />
</div>

<div className="icon-container icon-container-sm icon-container-purple">
  <Icon className="w-4 h-4" />
</div>
```

### Available Colors
- `icon-container-primary` - Blue gradient
- `icon-container-success` - Green gradient
- `icon-container-purple` - Purple gradient
- `icon-container-emerald` - Emerald gradient

### Available Sizes
- `icon-container-sm` - 2rem × 2rem
- `icon-container-md` - 2.5rem × 2.5rem
- `icon-container-lg` - 3rem × 3rem

## 📊 Progress Bars

```tsx
<div className="progress-bar">
  <div className="progress-bar-fill" style={{ width: '75%' }} />
</div>

<div className="progress-bar progress-bar-success">     // Green variant
  <div className="progress-bar-fill" style={{ width: '60%' }} />
</div>

<div className="progress-bar progress-bar-warning">     // Yellow variant
  <div className="progress-bar-fill" style={{ width: '40%' }} />
</div>

<div className="progress-bar progress-bar-danger">      // Red variant
  <div className="progress-bar-fill" style={{ width: '20%' }} />
</div>
```

## 📑 Tabs

```tsx
<div className="tab-nav">
  <button className="tab-button active">
    <Icon className="w-5 h-5" />
    Active Tab
  </button>
  <button className="tab-button">
    <Icon className="w-5 h-5" />
    Inactive Tab
  </button>
</div>
```

## 📝 Inputs

```tsx
<input type="text" className="input" placeholder="Enter text..." />

<input type="text" className="input input-sm" placeholder="Small input" />

<input type="text" className="input input-lg" placeholder="Large input" />
```

## 💬 Info Boxes / Alerts

```tsx
<div className="info-box info-box-primary">
  <InfoIcon className="info-box-icon" />
  <div className="info-box-content">
    This is an informational message.
  </div>
</div>

<div className="info-box info-box-success">
  <CheckIcon className="info-box-icon" />
  <div className="info-box-content">Success message</div>
</div>

<div className="info-box info-box-warning">
  <AlertIcon className="info-box-icon" />
  <div className="info-box-content">Warning message</div>
</div>

<div className="info-box info-box-danger">
  <XIcon className="info-box-icon" />
  <div className="info-box-content">Error message</div>
</div>
```

## 🔗 Links

```tsx
<a href="#" className="link">Standard link</a>
<a href="#" className="link link-muted">Muted link</a>
```

## 🛠️ Utilities

```tsx
<div className="surface">White background with border</div>

<div className="surface-elevated">White background with shadow</div>

<hr className="divider" />                              // Horizontal divider

<div className="skeleton" style={{ height: '2rem' }} />  // Loading skeleton
```

## 🎯 Usage Examples

### Modern Card with Icon Header
```tsx
<div className="card">
  <div className="flex items-center gap-3 mb-4">
    <div className="icon-container icon-container-md icon-container-primary">
      <Target className="w-5 h-5" />
    </div>
    <div>
      <h3 className="text-heading-4">Card Title</h3>
      <p className="text-caption">Subtitle here</p>
    </div>
  </div>
  <div className="text-body">
    Card content goes here with proper typography.
  </div>
</div>
```

### Action Buttons Row
```tsx
<div className="flex items-center gap-3">
  <button className="btn btn-primary">
    <Save className="w-5 h-5" />
    Save Changes
  </button>
  <button className="btn btn-secondary">
    Cancel
  </button>
  <button className="btn-icon btn-ghost">
    <Settings className="w-5 h-5" />
  </button>
</div>
```

### Info Card with Progress
```tsx
<div className="card">
  <div className="flex items-center justify-between mb-3">
    <h4 className="text-heading-4">Task Completion</h4>
    <span className="badge badge-success">75%</span>
  </div>
  <div className="progress-bar progress-bar-success mb-4">
    <div className="progress-bar-fill" style={{ width: '75%' }} />
  </div>
  <div className="info-box info-box-primary">
    <Info className="info-box-icon" />
    <div className="info-box-content">
      You're making great progress!
    </div>
  </div>
</div>
```

## 🎨 Color Palette

The design system uses consistent colors:

- **Primary**: Blue (#2563EB - #1D4ED8)
- **Success**: Green (#10B981 - #059669)
- **Warning**: Amber (#F59E0B - #D97706)
- **Danger**: Red (#EF4444 - #DC2626)
- **Purple**: Purple (#9333EA - #7E22CE)
- **Emerald**: Emerald (#10B981 - #059669)

## 📱 Responsive Design

All components are responsive and include mobile-optimized sizing:

- Typography scales down on mobile
- Buttons adjust padding on small screens
- Cards reduce padding on mobile

## ✨ Best Practices

1. **Consistency**: Use design system classes instead of custom Tailwind utilities
2. **Semantic HTML**: Use appropriate HTML elements with design system classes
3. **Accessibility**: All interactive elements have proper focus states
4. **Performance**: CSS is optimized and reusable across components

## 🔄 Migration Guide

### Before (Tailwind inline classes):
```tsx
<button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Click me
</button>
```

### After (Design system):
```tsx
<button className="btn btn-primary">
  Click me
</button>
```

Benefits:
- ✅ Cleaner code
- ✅ Consistent design
- ✅ Easier maintenance
- ✅ Better animations and transitions
- ✅ Built-in accessibility
