/**
 * Feature Flags for API Optimizations
 * Use these to safely enable/disable optimizations
 */

export const OPTIMIZATION_FLAGS = {
  // Enable optimized subscription service
  USE_OPTIMIZED_SUBSCRIPTION: 
    process.env.NODE_ENV === 'development' || 
    process.env.NEXT_PUBLIC_USE_OPTIMIZED_SUBSCRIPTION === 'true',
  
  // Enable optimized Supabase service
  USE_OPTIMIZED_SUPABASE: 
    process.env.NODE_ENV === 'development' || 
    process.env.NEXT_PUBLIC_USE_OPTIMIZED_SUPABASE === 'true',
  
  // Enable global API cache
  USE_GLOBAL_CACHE: 
    process.env.NODE_ENV === 'development' || 
    process.env.NEXT_PUBLIC_USE_GLOBAL_CACHE === 'true',
  
  // Enable performance monitoring
  ENABLE_PERFORMANCE_MONITORING: 
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_ENABLE_PERF_MONITORING === 'true'
};

/**
 * Helper function to check if optimizations are enabled
 */
export function isOptimizationEnabled(flag: keyof typeof OPTIMIZATION_FLAGS): boolean {
  return OPTIMIZATION_FLAGS[flag];
}

/**
 * Get optimization status for debugging
 */
export function getOptimizationStatus() {
  return {
    ...OPTIMIZATION_FLAGS,
    environment: process.env.NODE_ENV,
    buildTime: new Date().toISOString()
  };
} 