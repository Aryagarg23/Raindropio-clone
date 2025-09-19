// Frontend cache utilities for debugging and management

// Global cache clearing function for browser console access
declare global {
  interface Window {
    clearBookmarkCache: () => void;
    getBookmarkCacheStats: () => any;
  }
}

// This will be populated by the useBookmarkActions hook
let globalCacheClearFunction: (() => void) | null = null;
let globalCacheStatsFunction: (() => any) | null = null;

export const setGlobalCacheFunctions = (
  clearFn: () => void,
  statsFn: () => any
) => {
  globalCacheClearFunction = clearFn;
  globalCacheStatsFunction = statsFn;
  
  // Make functions available globally for debugging
  if (typeof window !== 'undefined') {
    window.clearBookmarkCache = clearFn;
    window.getBookmarkCacheStats = statsFn;
    
    console.log('🔧 Cache utilities available:');
    console.log('  - clearBookmarkCache() - Clear all cached content');
    console.log('  - getBookmarkCacheStats() - Get cache statistics');
  }
};

export const clearGlobalCacheFunctions = () => {
  globalCacheClearFunction = null;
  globalCacheStatsFunction = null;
  
  if (typeof window !== 'undefined') {
    delete window.clearBookmarkCache;
    delete window.getBookmarkCacheStats;
  }
};
