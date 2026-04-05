# Analytics & Monitoring Guide

## Current Analytics Implementation

### ✅ Implemented Features
- **Web Vitals Tracking**: LCP, FID, CLS, FCP, TTFB
- **User Interactions**: First interaction tracking
- **Theme Usage**: Light/dark mode preferences
- **Search Analytics**: Query tracking and results
- **Custom Events**: Extensible event system

### 📊 Tracked Metrics

#### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 800ms target
- **INP (Interaction to Next Paint)**: < 200ms target
- **CLS (Cumulative Layout Shift)**: < 0.05 target

#### User Behavior
- Theme preference changes
- Search queries and results
- First user interaction
- Page engagement

#### Technical Metrics
- JavaScript errors
- Loading performance
- Cache effectiveness

## Analytics Integration

### Current Setup
```astro
<!-- In Layout.astro -->
<Analytics client:load />
```

### Event Tracking
```javascript
// Track custom events
window.nmTrackEvent('event_name', {
  property: 'value',
  count: 42
});

// Search tracking (automatic)
window.dispatchEvent(new CustomEvent('nm-search-performed', {
  detail: { query: 'search term', results: 5 }
}));
```

## Monitoring & Alerts

### Performance Monitoring
- Web Vitals automatically tracked
- Console logging in development
- Error boundary reporting

### Error Tracking
- JavaScript errors logged
- Network failures monitored
- Service worker issues tracked

## Privacy Considerations

### Data Collection
- No personal information collected
- Anonymous usage analytics only
- Respects Do Not Track settings
- GDPR compliant (no cookies required)

### Data Storage
- Local event processing
- No external data transmission (yet)
- Development-only console logging

## Future Enhancements

### Planned Analytics Features
- [ ] External analytics provider integration
- [ ] A/B testing framework
- [ ] User journey tracking
- [ ] Performance regression alerts
- [ ] Real user monitoring (RUM)

### Monitoring Improvements
- [ ] Error reporting service
- [ ] Performance dashboards
- [ ] Automated alerting
- [ ] Uptime monitoring

## Development Commands

```bash
# View analytics events (development)
# Check browser console for nm-analytics-event

# Test Web Vitals
# Load page and check console for metric logs

# Monitor performance
# Use browser DevTools Performance tab
```