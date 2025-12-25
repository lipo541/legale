// ============================================================================
// SPECIALISTS MODULE - BARREL EXPORTS
// ============================================================================
// Following Feature-Based Architecture pattern (see docs/STRUCTURE.md)

// Types
export * from './types';

// Hooks
export * from './hooks';

// Main client component
export { default as SpecialistsPageClient } from './SpecialistsPageClient';

// UI Components (from components/ folder)
export * from './components';

// Statistics
export { default as SpecialistsStatistics } from './statistics/SpecialistsStatistics';

// Detail page
export { default as SpecialistDetailPage } from './specialist-detail/SpecialistDetailPage';
