'use client';

import React, { useCallback } from 'react';
import Breadcrumb from '@/components/common/Breadcrumb';
import { specialistsTranslations } from '@/translations/specialists';
// Components (from ./components barrel)
import { 
  SpecialistsHero,
  SpecialistCardSkeleton,
  CompanySpecialistCard,
  SoloSpecialistCard 
} from './components';
// Statistics
import SpecialistsStatistics from './statistics/SpecialistsStatistics';
// Hooks
import { 
  useSpecialistsFilters, 
  useSpecialistsView,
  useSpecialistsData
} from './hooks';
// Types
import type { 
  SpecialistsPageClientProps, 
  SoloSpecialist, 
  CompanySpecialist 
} from './types';

// ============================================================================
// SPECIALISTS PAGE CLIENT COMPONENT
// ============================================================================

export default function SpecialistsPageClient({ 
  locale, 
  initialData 
}: SpecialistsPageClientProps) {
  const t = specialistsTranslations[locale as keyof typeof specialistsTranslations] || specialistsTranslations.ka;
  
  // Pre-fetched data from server
  const { stats, cities = [], services = [] } = initialData;
  const { totalCompanies, totalSpecialists, totalServices } = stats;
  
  // Use optimized hooks
  const filters = useSpecialistsFilters();
  const { viewMode, setViewMode, sortBy, setSortBy } = useSpecialistsView();
  
  // Stable callback wrappers to prevent infinite loops in Statistics component
  const handleSpecialistTypeChange = useCallback((type: string | null) => {
    filters.setSelectedSpecialistType(type as 'solo' | 'company' | null);
  }, [filters.setSelectedSpecialistType]);

  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort as 'newest' | 'oldest' | 'a-z' | 'z-a');
  }, [setSortBy]);
  
  // Use centralized data hook
  const {
    soloSpecialists,
    companySpecialists,
    loading,
    hasActiveFilters,
  } = useSpecialistsData({
    initialSoloSpecialists: initialData.soloSpecialists,
    initialCompanySpecialists: initialData.companySpecialists,
    filters: {
      searchTerm: filters.searchTerm,
      debouncedSearchTerm: filters.debouncedSearchTerm,
      selectedCity: filters.selectedCity,
      selectedSpecialistType: filters.selectedSpecialistType,
      selectedServices: filters.selectedServices,
      selectedLanguages: filters.selectedLanguages,
    },
    locale,
    sortBy,
  });

  // Computed values
  const totalResults = soloSpecialists.length + companySpecialists.length;
  const hasOtherFilters = filters.selectedCity || 
    filters.selectedLanguages.length > 0 || 
    filters.selectedServices.length > 0 || 
    filters.debouncedSearchTerm;

  // Grid/List class helper
  const getGridClass = () => viewMode === 'grid' 
    ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
    : "flex flex-col gap-4";

  // Render skeleton loader
  const renderSkeletons = () => (
    <div className={getGridClass()}>
      {Array.from({ length: 6 }).map((_, i) => (
        <SpecialistCardSkeleton key={i} viewMode={viewMode} />
      ))}
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="text-center py-12 text-base opacity-60">
      {t.noResultsDescription}
    </div>
  );

  // Render specialists section
  const renderSection = (
    title: string, 
    specialists: (SoloSpecialist | CompanySpecialist)[], 
    type: 'solo' | 'company'
  ) => (
    <div className="mb-12">
      <h2 className="mb-4 text-base font-semibold sm:text-lg md:text-xl">
        {title} ({specialists.length})
      </h2>
      {loading ? renderSkeletons() : specialists.length > 0 ? (
        <div className={getGridClass()}>
          {type === 'solo' 
            ? specialists.map((specialist) => (
                <SoloSpecialistCard 
                  key={specialist.id} 
                  specialist={specialist as SoloSpecialist} 
                  viewMode={viewMode}
                />
              ))
            : specialists.map((specialist) => (
                <CompanySpecialistCard 
                  key={specialist.id} 
                  specialist={specialist as CompanySpecialist} 
                  viewMode={viewMode}
                />
              ))
          }
        </div>
      ) : renderEmptyState()}
    </div>
  );

  // Render content based on filter state
  const renderContent = () => {
    // Unified filtered results - when filters active without type filter
    if (hasOtherFilters && !filters.selectedSpecialistType) {
      return (
        <div className="mb-12">
          <h2 className="mb-4 text-base font-semibold sm:text-lg md:text-xl">
            {t.filteredResults} ({totalResults})
          </h2>
          {loading ? renderSkeletons() : totalResults > 0 ? (
            <div className={getGridClass()}>
              {soloSpecialists.map((specialist) => (
                <SoloSpecialistCard 
                  key={specialist.id} 
                  specialist={specialist}
                  viewMode={viewMode}
                />
              ))}
              {companySpecialists.map((specialist) => (
                <CompanySpecialistCard 
                  key={specialist.id} 
                  specialist={specialist}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : renderEmptyState()}
        </div>
      );
    }

    // Solo only
    if (filters.selectedSpecialistType === 'solo') {
      return renderSection(t.soloSpecialists, soloSpecialists, 'solo');
    }

    // Company only
    if (filters.selectedSpecialistType === 'company') {
      return renderSection(t.companySpecialists, companySpecialists, 'company');
    }

    // Default view - both sections
    return (
      <>
        {renderSection(t.companySpecialists, companySpecialists, 'company')}
        <div className="mb-8 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-white/20" />
        {renderSection(t.soloSpecialists, soloSpecialists, 'solo')}
      </>
    );
  };

  return (
    <div className="min-h-screen py-8 md:py-12 lg:py-16">
      <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-10">
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={[{ label: t.breadcrumb }]} />
        
        {/* Hero Section */}
        <SpecialistsHero 
          locale={locale}
          totalSpecialists={totalSpecialists}
        />
        
        {/* Statistics & Filters Section */}
        <div className="mb-8">
          <SpecialistsStatistics 
            totalCompanies={totalCompanies}
            totalSpecialists={totalSpecialists}
            totalServices={totalServices}
            cities={cities}
            services={services}
            onSearchChange={filters.setSearchTerm}
            onCityChange={filters.setSelectedCity}
            onSpecialistTypeChange={handleSpecialistTypeChange}
            onServicesChange={filters.setSelectedServices}
            onLanguagesChange={filters.setSelectedLanguages}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortBy={sortBy}
            onSortChange={handleSortChange}
          />
        </div>

        {/* Screen Reader Announcements */}
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true" 
          className="sr-only"
        >
          {!loading && `${totalResults} ${t.specialistsFound}`}
        </div>

        {/* Divider */}
        <div className="mb-8 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-white/20" />

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
}
