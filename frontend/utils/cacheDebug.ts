// Cache debugging utilities

export const debugCache = () => {
  if (typeof window === 'undefined') return;
  
  console.log('🔍 Cache Debug Information:');
  
  // Check localStorage cache version
  const cacheVersion = localStorage.getItem('bookmark_cache_version');
  console.log('📋 Cache Version:', cacheVersion);
  
  // Check if global cache functions are available
  const hasClearFunction = typeof (window as any).clearBookmarkCache === 'function';
  const hasStatsFunction = typeof (window as any).getBookmarkCacheStats === 'function';
  
  console.log('🔧 Global Cache Functions:');
  console.log('  - clearBookmarkCache:', hasClearFunction ? '✅ Available' : '❌ Not available');
  console.log('  - getBookmarkCacheStats:', hasStatsFunction ? '✅ Available' : '❌ Not available');
  
  // Get cache stats if available
  if (hasStatsFunction) {
    try {
      const stats = (window as any).getBookmarkCacheStats();
      console.log('📊 Cache Statistics:', stats);
    } catch (error) {
      console.log('❌ Error getting cache stats:', error);
    }
  }
  
  // Check browser cache
  console.log('🌐 Browser Cache:');
  console.log('  - Hard refresh recommended: Ctrl+F5 or Cmd+Shift+R');
  console.log('  - Clear browser cache if issues persist');
  
  // Check for any cached content in memory
  console.log('💾 Memory Cache:');
  console.log('  - Frontend cache is stored in React state/refs');
  console.log('  - Use clearBookmarkCache() to clear if available');
};

// Make debug function available globally
if (typeof window !== 'undefined') {
  (window as any).debugCache = debugCache;
  console.log('🔧 Cache debug function available: debugCache()');
}
