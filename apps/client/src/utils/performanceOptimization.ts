import { PerformanceMetrics } from '../types';

/**
 * Performance optimization utilities
 */

// Performance monitoring
export class PerformanceMonitor {
    private static metrics: PerformanceMetrics[] = [];
    private static maxMetrics = 100; // Keep last 100 metrics

    /**
     * Record page load performance
     */
    static recordPageLoad(pageName: string, userId?: string): void {
        if (typeof window === 'undefined' || !window.performance) return;

        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (!navigation) return;

        const metric: PerformanceMetrics = {
            timestamp: new Date().toISOString(),
            metrics: {
                pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
                apiResponseTime: navigation.responseEnd - navigation.requestStart,
                renderTime: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                memoryUsage: (performance as any).memory?.usedJSHeapSize / (1024 * 1024), // MB
            },
            page: pageName,
            userId,
        };

        this.addMetric(metric);
    }

    /**
     * Record custom performance metric
     */
    static recordMetric(pageName: string, metricName: string, value: number, userId?: string): void {
        const metric: PerformanceMetrics = {
            timestamp: new Date().toISOString(),
            metrics: {
                pageLoadTime: 0,
                apiResponseTime: 0,
                renderTime: value,
            },
            page: `${pageName}:${metricName}`,
            userId,
        };

        this.addMetric(metric);
    }

    /**
     * Get performance metrics
     */
    static getMetrics(): PerformanceMetrics[] {
        return [...this.metrics];
    }

    /**
     * Get average metrics for a page
     */
    static getAverageMetrics(pageName: string): Partial<PerformanceMetrics['metrics']> | null {
        const pageMetrics = this.metrics.filter((m) => m.page === pageName);
        if (pageMetrics.length === 0) return null;

        const sum = pageMetrics.reduce(
            (acc, m) => ({
                pageLoadTime: acc.pageLoadTime + m.metrics.pageLoadTime,
                apiResponseTime: acc.apiResponseTime + m.metrics.apiResponseTime,
                renderTime: acc.renderTime + m.metrics.renderTime,
                memoryUsage: acc.memoryUsage + (m.metrics.memoryUsage || 0),
            }),
            { pageLoadTime: 0, apiResponseTime: 0, renderTime: 0, memoryUsage: 0 }
        );

        const count = pageMetrics.length;
        return {
            pageLoadTime: sum.pageLoadTime / count,
            apiResponseTime: sum.apiResponseTime / count,
            renderTime: sum.renderTime / count,
            memoryUsage: sum.memoryUsage / count,
        };
    }

    /**
     * Clear metrics
     */
    static clearMetrics(): void {
        this.metrics = [];
    }

    private static addMetric(metric: PerformanceMetrics): void {
        this.metrics.push(metric);
        if (this.metrics.length > this.maxMetrics) {
            this.metrics.shift();
        }
    }
}

// Debounce function for performance
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for performance
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return function executedFunction(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

// Memoization for expensive calculations
export function memoize<T extends (...args: any[]) => any>(func: T): T {
    const cache = new Map<string, ReturnType<T>>();

    return ((...args: Parameters<T>): ReturnType<T> => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key)!;
        }

        const result = func(...args);
        cache.set(key, result);
        return result;
    }) as T;
}

// Lazy loading helper
export function lazyLoad<T>(loader: () => Promise<T>): () => Promise<T> {
    let promise: Promise<T> | null = null;

    return () => {
        if (!promise) {
            promise = loader();
        }
        return promise;
    };
}

// Virtual scrolling helper
export interface VirtualScrollConfig {
    itemHeight: number;
    containerHeight: number;
    overscan?: number; // Number of items to render outside viewport
}

export function calculateVirtualScroll(
    scrollTop: number,
    totalItems: number,
    config: VirtualScrollConfig
): {
    startIndex: number;
    endIndex: number;
    offsetY: number;
} {
    const { itemHeight, containerHeight, overscan = 3 } = config;

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleItems = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(totalItems - 1, startIndex + visibleItems + overscan * 2);
    const offsetY = startIndex * itemHeight;

    return { startIndex, endIndex, offsetY };
}

// Image lazy loading
export function setupLazyImages(): void {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const img = entry.target as HTMLImageElement;
                    const src = img.dataset.src;
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach((img) => {
            imageObserver.observe(img);
        });
    }
}

// Memory leak prevention
export class ResourceCleanup {
    private static cleanupFunctions: Array<() => void> = [];

    static register(cleanup: () => void): void {
        this.cleanupFunctions.push(cleanup);
    }

    static cleanup(): void {
        this.cleanupFunctions.forEach((fn) => {
            try {
                fn();
            } catch (error) {
                console.error('Cleanup error:', error);
            }
        });
        this.cleanupFunctions = [];
    }
}

// Bundle size analyzer helper
export function analyzeBundleSize(): void {
    if (process.env.NODE_ENV === 'development') {
        console.log('Bundle Analysis:');
        console.log('- React:', (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED ? 'Loaded' : 'Not loaded');
        console.log('- Performance API:', typeof window !== 'undefined' && window.performance ? 'Available' : 'Not available');
    }
}

// Code splitting helper
export async function loadComponent<T>(
    loader: () => Promise<{ default: T }>
): Promise<T> {
    try {
        const module = await loader();
        return module.default;
    } catch (error) {
        console.error('Failed to load component:', error);
        throw error;
    }
}

// Cache management
export class CacheManager {
    private static cache = new Map<string, { data: any; expires: number }>();

    static set(key: string, data: any, ttl: number = 300000): void {
        // Default 5 minutes
        const expires = Date.now() + ttl;
        this.cache.set(key, { data, expires });
    }

    static get<T>(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }

        return item.data as T;
    }

    static clear(): void {
        this.cache.clear();
    }

    static clearExpired(): void {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expires) {
                this.cache.delete(key);
            }
        }
    }
}

// Performance budget checker
export interface PerformanceBudget {
    pageLoadTime: number; // ms
    apiResponseTime: number; // ms
    renderTime: number; // ms
    bundleSize?: number; // KB
}

export function checkPerformanceBudget(
    metrics: PerformanceMetrics['metrics'],
    budget: PerformanceBudget
): {
    passed: boolean;
    violations: string[];
} {
    const violations: string[] = [];

    if (metrics.pageLoadTime > budget.pageLoadTime) {
        violations.push(`Page load time exceeded: ${metrics.pageLoadTime}ms > ${budget.pageLoadTime}ms`);
    }

    if (metrics.apiResponseTime > budget.apiResponseTime) {
        violations.push(`API response time exceeded: ${metrics.apiResponseTime}ms > ${budget.apiResponseTime}ms`);
    }

    if (metrics.renderTime > budget.renderTime) {
        violations.push(`Render time exceeded: ${metrics.renderTime}ms > ${budget.renderTime}ms`);
    }

    return {
        passed: violations.length === 0,
        violations,
    };
}
