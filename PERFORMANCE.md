# Performance Optimization Guide

## Core Web Vitals Targets (2026)
- **LCP (Largest Contentful Paint)**: < 800ms
- **INP (Interaction to Next Paint)**: < 200ms
- **CLS (Cumulative Layout Shift)**: < 0.05

## Current Optimizations

### ✅ Implemented
- **Lazy Loading**: `LazyImage.astro` and `OptimizedImage.astro` components
- **Image Optimization**: Sharp-based optimization script
- **Font Loading**: `font-display: swap` for web fonts
- **Critical CSS**: Above-the-fold styles inlined
- **Service Worker**: Network-first caching strategy
- **PWA**: App manifest and offline support

### 🚀 Available Scripts
```bash
# Optimize all images
npm run optimize:images

# Build with performance monitoring
npm run build

# Preview production build
npm run preview
```

## Performance Components

### LazyImage.astro
Basic lazy loading with `loading="lazy"`:
```astro
<LazyImage src="/image.jpg" alt="Description" width="800" height="600" />
```

### OptimizedImage.astro
Advanced lazy loading with blur placeholder:
```astro
<OptimizedImage
  src="/image.jpg"
  alt="Description"
  placeholder="/blur.jpg"
  width="800"
  height="600"
/>
```

## Image Optimization Pipeline

1. **Source Images**: Place in `public/images/`
2. **Run Optimization**: `npm run optimize:images`
3. **Output**: `public/images/optimized/` (WebP + optimized JPEG)
4. **Usage**: Use optimized paths in components

## Monitoring Performance

### Lighthouse Scores Target
- **Performance**: 95+
- **Accessibility**: 100
- **Best Practices**: 95+
- **SEO**: 100

### Key Metrics to Monitor
- First Contentful Paint (FCP)
- Time to Interactive (TTI)
- Total Blocking Time (TBT)
- Bundle size analysis

## Future Enhancements

### Planned
- [ ] Critical CSS extraction
- [ ] Image CDN integration
- [ ] WebP/AVIF support detection
- [ ] Font subsetting
- [ ] Bundle analysis reports
- [ ] Performance budgets