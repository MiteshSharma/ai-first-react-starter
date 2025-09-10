import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';

/**
 * Web Vitals performance monitoring configuration
 */
interface PerformanceConfig {
  endpoint?: string;
  apiKey?: string;
  enabled: boolean;
  debug: boolean;
}

/**
 * Initialize performance monitoring with Web Vitals
 */
export const initPerformanceMonitoring = (): void => {
  const config: PerformanceConfig = {
    endpoint: process.env.REACT_APP_WEB_VITALS_ENDPOINT,
    apiKey: process.env.REACT_APP_ANALYTICS_ID,
    enabled: process.env.REACT_APP_PERFORMANCE_MONITORING === 'true',
    debug: process.env.REACT_APP_ENV === 'development',
  };

  if (!config.enabled) {
    if (config.debug) {
      console.log('Performance monitoring disabled');
    }
    return;
  }

  // Function to send metrics to analytics endpoint
  const sendToAnalytics = (metric: Metric) => {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      rating: metric.rating,
      navigationType: metric.navigationType,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    if (config.debug) {
      console.log('Web Vital:', metric.name, metric.value, metric.rating);
    }

    // Send to analytics endpoint if configured
    if (config.endpoint && config.apiKey) {
      fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body,
      }).catch((error) => {
        console.error('Failed to send performance metric:', error);
      });
    }

    // Send to Google Analytics if gtag is available
    if (typeof window.gtag === 'function') {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true,
      });
    }
  };

  // Collect all Web Vitals metrics
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);

  if (config.debug) {
    console.log('Performance monitoring initialized');
  }
};

/**
 * Custom performance mark for measuring specific operations
 */
export const performanceMark = (name: string): void => {
  if (window.performance && window.performance.mark) {
    window.performance.mark(name);
  }
};

/**
 * Measure performance between two marks
 */
export const performanceMeasure = (name: string, startMark: string, endMark?: string): number | null => {
  if (window.performance && window.performance.measure) {
    try {
      window.performance.measure(name, startMark, endMark);
      const measure = window.performance.getEntriesByName(name, 'measure')[0];
      return measure ? measure.duration : null;
    } catch (error) {
      console.error('Performance measure failed:', error);
      return null;
    }
  }
  return null;
};

/**
 * Get navigation timing information
 */
export const getNavigationTiming = () => {
  if (!window.performance || !window.performance.timing) {
    return null;
  }

  const timing = window.performance.timing;
  const navigation = window.performance.navigation;

  return {
    // Network timing
    dns: timing.domainLookupEnd - timing.domainLookupStart,
    tcp: timing.connectEnd - timing.connectStart,
    ssl: timing.connectEnd - timing.secureConnectionStart,
    ttfb: timing.responseStart - timing.requestStart,
    download: timing.responseEnd - timing.responseStart,
    
    // Processing timing
    domInteractive: timing.domInteractive - timing.navigationStart,
    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
    domComplete: timing.domComplete - timing.navigationStart,
    loadEvent: timing.loadEventEnd - timing.navigationStart,
    
    // Navigation info
    navigationType: navigation.type,
    redirectCount: navigation.redirectCount,
  };
};

/**
 * Monitor resource loading performance
 */
export const monitorResourcePerformance = (): void => {
  if (!window.performance || !window.performance.getEntriesByType) {
    return;
  }

  const resources = window.performance.getEntriesByType('resource');
  const slowResources = resources.filter((resource: any) => resource.duration > 1000);
  
  if (slowResources.length > 0) {
    console.warn('Slow loading resources detected:', slowResources);
    
    // Send slow resource alerts if needed
    slowResources.forEach((resource: any) => {
      if (process.env.REACT_APP_ENV === 'development') {
        console.log(`Slow resource: ${resource.name} took ${resource.duration}ms`);
      }
    });
  }
};

/**
 * Monitor memory usage (Chrome only)
 */
export const monitorMemoryUsage = (): void => {
  if ('memory' in window.performance) {
    const memory = (window.performance as any).memory;
    
    const memoryInfo = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100),
    };

    if (process.env.REACT_APP_ENV === 'development') {
      console.log('Memory usage:', memoryInfo);
    }

    // Alert if memory usage is high
    if (memoryInfo.usagePercentage > 90) {
      console.warn('High memory usage detected:', memoryInfo);
    }

    return memoryInfo;
  }
  
  return null;
};

/**
 * Performance observer for long tasks
 */
export const observeLongTasks = (): void => {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn('Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
            });
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      console.error('Long task observer failed:', error);
    }
  }
};

/**
 * Track custom performance metrics
 */
export const trackCustomMetric = (name: string, value: number, unit = 'ms'): void => {
  const metric = {
    name,
    value,
    unit,
    timestamp: Date.now(),
    url: window.location.href,
  };

  if (process.env.REACT_APP_ENV === 'development') {
    console.log('Custom metric:', metric);
  }

  // Send to analytics if available
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'custom_metric', {
      event_category: 'Performance',
      event_label: name,
      value: Math.round(value),
      custom_map: { metric_unit: unit },
    });
  }
};

/**
 * Initialize all performance monitoring
 */
export const initAllPerformanceMonitoring = (): void => {
  initPerformanceMonitoring();
  observeLongTasks();
  
  // Monitor resources after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      monitorResourcePerformance();
      monitorMemoryUsage();
    }, 1000);
  });
};

// Global type declarations
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}