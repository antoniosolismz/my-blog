# ctOS 2.0 Theme - Watch Dogs Inspired

An advanced cyberpunk/hacker aesthetic theme for Hugo Blog, inspired by the ctOS system from Watch Dogs.

## Features

### Visual Effects
- **Animated Grid Background** - Subtle moving grid pattern with neon green accents
- **CRT Scanlines** - Authentic CRT monitor scanline effect
- **Glitch Animations** - Random glitch effects on headings
- **Neon Glow** - Dynamic glow effects on interactive elements
- **Chromatic Aberration** - Color separation on glitch effects

### UI Elements
- **Angled Corners** - ctOS-style clip-path corners on cards and panels
- **Bracketed Headings** - Headings styled with `[ HEADING ]` format
- **System Labels** - Terminal-style labels and identifiers
- **HUD Overlays** - Corner brackets and status indicators
- **Data Panels** - Elevated panels with gradient backgrounds

### Interactive Effects (JavaScript)
- **Boot Sequence** - System initialization animation on first visit
- **Data Corruption** - Random glitch effects on text
- **Mouse Tracker** - Subtle neon cursor follower
- **Live Clock** - ctOS-style time display in corner

### Color Palette
- Primary: Neon Green (#39FF14)
- Secondary: Cyan (#00E5FF)
- Alert: Orange (#FF6600)
- Danger: Red (#FF1744)
- Background: Pure Black (#000000)

## Files

### CSS
- `assets/css/ctos.css` - Main theme stylesheet (8KB minified)

### JavaScript
- `assets/js/ctos.js` - Interactive effects and animations

### Configuration
- `layouts/partials/custom-head.html` - Injects ctOS CSS
- `config.toml` - Includes ctOS JS in additionalScripts

## Customization

### Disable Boot Sequence
To disable the boot animation, remove or comment out in `assets/js/ctos.js`:
```javascript
addSystemBoot();
```

### Adjust Colors
Edit color variables in `assets/css/ctos.css`:
```css
:root {
  --ctos-green: #39FF14;  /* Change primary color */
  --ctos-cyan: #00E5FF;   /* Change secondary color */
}
```

### Disable Effects
Remove unwanted animations by commenting out in `assets/js/ctos.js`:
```javascript
// addDataCorruption();  // Disable text glitching
// addHUDElements();     // Disable corner HUD
// addMouseTracker();    // Disable cursor tracker
```

### Mobile Optimization
The theme automatically disables certain effects on mobile:
- Simplified backgrounds
- Removed bracketed headings
- Reduced animations

## Performance

- **CSS**: ~8KB minified and fingerprinted
- **JS**: ~3KB minified
- **No external dependencies**
- **GPU-accelerated animations**
- **Respects `prefers-reduced-motion`**

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Graceful degradation on older browsers (effects disabled, base styles remain).

## Accessibility

- All text meets WCAG AA contrast requirements (4.5:1 minimum)
- Respects `prefers-reduced-motion` for users with motion sensitivity
- Semantic HTML maintained
- Screen reader friendly

## Credits

Inspired by the ctOS system from Ubisoft's Watch Dogs franchise.
