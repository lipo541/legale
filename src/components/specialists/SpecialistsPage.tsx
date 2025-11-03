'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import SpecialistsHero from './SpecialistsHero';
import SpecialistsStatistics from './statistics/SpecialistsStatistics';
import CompanySpecialistCard from './company-specialists/CompanySpecialistCard';
import SoloSpecialistCard from './solo-specialists/SoloSpecialistCard';
import SpecialistCardSkeleton from './SpecialistCardSkeleton';
import Breadcrumb from '@/components/common/Breadcrumb';
import { specialistsTranslations } from '@/translations/specialists';

interface SoloSpecialist {
  id: string;
  full_name: string;
  role_title: string | null;
  bio: string | null;
  avatar_url?: string | null;
  slug?: string;
}

interface CompanySpecialist {
  id: string;
  full_name: string;
  role_title: string | null;
  company: string;
  company_slug?: string;
  bio: string | null;
  avatar_url?: string | null;
  slug?: string;
}

export default function SpecialistsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ka';
  const t = specialistsTranslations[locale as keyof typeof specialistsTranslations] || specialistsTranslations.ka;

  const [soloSpecialists, setSoloSpecialists] = useState<SoloSpecialist[]>([]);
  const [companySpecialists, setCompanySpecialists] = useState<CompanySpecialist[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Statistics counts
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalSpecialists, setTotalSpecialists] = useState(0);
  const [totalServices, setTotalServices] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedSpecialistType, setSelectedSpecialistType] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // View mode state - start with 'grid' to avoid hydration mismatch
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sort state - start with 'newest' to avoid hydration mismatch
  const [sortBy, setSortBy] = useState<string>('newest');

  // Debounce search term (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load view mode from localStorage after mount
  useEffect(() => {
    const saved = localStorage.getItem('specialists-view-mode');
    if (saved === 'list' || saved === 'grid') {
      setViewMode(saved);
    }
  }, []);

  // Load sort preference from localStorage after mount
  useEffect(() => {
    const saved = localStorage.getItem('specialists-sort-by');
    if (saved) {
      setSortBy(saved);
    }
  }, []);

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('specialists-view-mode', viewMode);
  }, [viewMode]);

  // Save sort preference to localStorage
  useEffect(() => {
    localStorage.setItem('specialists-sort-by', sortBy);
  }, [sortBy]);

  // Sorting function - memoized to prevent recreation on every render
  const sortSpecialists = useCallback(<T extends { full_name: string; id: string }>(specialists: T[]): T[] => {
    const sorted = [...specialists];
    
    switch (sortBy) {
      case 'newest':
        // Assuming newer specialists have larger IDs (created later)
        return sorted.sort((a, b) => b.id.localeCompare(a.id));
      case 'oldest':
        // Older specialists have smaller IDs (created earlier)
        return sorted.sort((a, b) => a.id.localeCompare(b.id));
      case 'a-z':
        return sorted.sort((a, b) => a.full_name.localeCompare(b.full_name, locale));
      case 'z-a':
        return sorted.sort((a, b) => b.full_name.localeCompare(a.full_name, locale));
      default:
        return sorted;
    }
  }, [sortBy, locale]);

  const fetchSpecialists = useCallback(async () => {
    try {
      const supabase = createClient();
      
      console.log('Fetching specialists with filters:', { searchTerm: debouncedSearchTerm, selectedCity, selectedSpecialistType, selectedServices });
      
      let allSpecialistIds: string[] = [];
      
      // 1. Filter by city if selected
      if (selectedCity) {
        console.log('Filtering by city:', selectedCity);
        
        const { data: specialistCityData } = await supabase
          .from('specialist_cities')
          .select('specialist_id')
          .eq('city_id', selectedCity);

        console.log('Specialist city data:', specialistCityData);

        allSpecialistIds = specialistCityData?.map(sc => sc.specialist_id) || [];
        
        console.log('Filtered specialist IDs by city:', allSpecialistIds);
      }
      
      // 2. Filter by services if selected
      if (selectedServices.length > 0) {
        const { data: specialistServicesData } = await supabase
          .from('specialist_services')
          .select('profile_id')
          .in('service_id', selectedServices);

        const serviceFilteredIds = specialistServicesData?.map(ss => ss.profile_id) || [];
        
        if (allSpecialistIds.length > 0) {
          // Intersect with existing IDs
          allSpecialistIds = allSpecialistIds.filter(id => serviceFilteredIds.includes(id));
        } else if (selectedCity) {
          // If city filter was applied but no results, keep empty
          allSpecialistIds = [];
        } else {
          // Only service filter applied
          allSpecialistIds = serviceFilteredIds;
        }
      }
      
      // 3. Search in both profiles and translations if debouncedSearchTerm exists
      let searchFilteredIds: string[] = [];
      if (debouncedSearchTerm) {
        // Search in profiles table (for basic info)
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id')
          .or(`full_name.ilike.%${debouncedSearchTerm}%,role_title.ilike.%${debouncedSearchTerm}%,bio.ilike.%${debouncedSearchTerm}%`)
          .in('role', ['SPECIALIST', 'SOLO_SPECIALIST']);

        const profileIds = profilesData?.map(p => p.id) || [];

        // Search in specialist_translations table (for translated content)
        const { data: translationsData } = await supabase
          .from('specialist_translations')
          .select('specialist_id')
          .or(`full_name.ilike.%${debouncedSearchTerm}%,role_title.ilike.%${debouncedSearchTerm}%,bio.ilike.%${debouncedSearchTerm}%,philosophy.ilike.%${debouncedSearchTerm}%,teaching_writing_speaking.ilike.%${debouncedSearchTerm}%`);

        const translationIds = translationsData?.map(t => t.specialist_id) || [];

        // Combine both results (union)
        searchFilteredIds = [...new Set([...profileIds, ...translationIds])];
        
        if (allSpecialistIds.length > 0) {
          // Intersect with existing IDs
          allSpecialistIds = allSpecialistIds.filter(id => searchFilteredIds.includes(id));
        } else if (selectedCity || selectedServices.length > 0) {
          // If other filters were applied but no results, keep empty
          allSpecialistIds = [];
        } else {
          // Only search filter applied
          allSpecialistIds = searchFilteredIds;
        }
      }
      
      const hasFilters = selectedCity || selectedServices.length > 0 || debouncedSearchTerm;
      
      // 4. Fetch solo specialists based on type filter
      if (!selectedSpecialistType || selectedSpecialistType === 'solo') {
        let soloQuery = supabase
          .from('profiles')
          .select('id, full_name, role_title, bio, avatar_url, slug')
          .ilike('role', '%solo%')
          .eq('verification_status', 'verified');

        if (hasFilters && allSpecialistIds.length === 0) {
          setSoloSpecialists([]);
        } else {
          if (allSpecialistIds.length > 0) {
            soloQuery = soloQuery.in('id', allSpecialistIds);
          }

          const { data: soloData, error: soloError } = await soloQuery;

          if (soloError) {
            console.error('Error fetching solo specialists:', soloError);
          } else if (soloData && soloData.length > 0) {
            // Fetch slugs from specialist_translations for current locale
            const { data: soloTranslations } = await supabase
              .from('specialist_translations')
              .select('specialist_id, slug')
              .eq('language', locale)
              .in('specialist_id', soloData.map(s => s.id));

            // Create a map of specialist_id -> slug
            const slugMap = new Map(soloTranslations?.map(t => [t.specialist_id, t.slug]) || []);

            // Map specialists with the correct slug for current locale
            const soloWithSlugs = soloData.map(specialist => ({
              ...specialist,
              slug: slugMap.get(specialist.id) || specialist.slug // fallback to profiles.slug
            }));

            setSoloSpecialists(sortSpecialists(soloWithSlugs));
          } else {
            setSoloSpecialists([]);
          }
        }
      } else {
        setSoloSpecialists([]);
      }

      // 5. Fetch company specialists based on type filter
      if (!selectedSpecialistType || selectedSpecialistType === 'company') {
        let companyQuery = supabase
          .from('profiles')
          .select('id, full_name, role_title, bio, avatar_url, company_id, slug')
          .eq('role', 'SPECIALIST')
          .not('company_id', 'is', null)
          .eq('verification_status', 'verified');

        if (hasFilters && allSpecialistIds.length === 0) {
          setCompanySpecialists([]);
        } else {
          if (allSpecialistIds.length > 0) {
            companyQuery = companyQuery.in('id', allSpecialistIds);
          }

          const { data: companyData, error: companyError } = await companyQuery;

          if (companyError) {
            console.error('Error fetching company specialists:', companyError);
            setCompanySpecialists([]);
          } else if (companyData && companyData.length > 0) {
            const companyIds = [...new Set(companyData.map(s => s.company_id).filter(Boolean))];
            
            const { data: companiesData } = await supabase
              .from('profiles')
              .select('id, full_name, company_slug')
              .in('id', companyIds)
              .eq('role', 'COMPANY');
            
            const companyMap = new Map(companiesData?.map(c => [c.id, { name: c.full_name, slug: c.company_slug }]) || []);
            
            // Fetch slugs from specialist_translations for current locale
            const { data: companyTranslations } = await supabase
              .from('specialist_translations')
              .select('specialist_id, slug')
              .eq('language', locale)
              .in('specialist_id', companyData.map(s => s.id));

            // Create a map of specialist_id -> slug
            const slugMap = new Map(companyTranslations?.map(t => [t.specialist_id, t.slug]) || []);
            
            const mappedData = companyData.map((s: { id: string; full_name: string; role_title: string; bio: string; company_id: string; photo_url?: string; email?: string; phone_number?: string; avatar_url?: string; slug?: string }) => {
              const companyInfo = companyMap.get(s.company_id);
              return {
                id: s.id,
                full_name: s.full_name,
                role_title: s.role_title,
                bio: s.bio,
                avatar_url: s.avatar_url,
                company: companyInfo?.name || 'Company',
                company_slug: companyInfo?.slug,
                slug: slugMap.get(s.id) || s.slug // Use locale-specific slug
              };
            });
            
            setCompanySpecialists(sortSpecialists(mappedData));
          } else {
            setCompanySpecialists([]);
          }
        }
      } else {
        setCompanySpecialists([]);
      }
      
      // Fetch statistics counts - only verified
      const { count: companiesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'COMPANY')
        .eq('verification_status', 'verified');
      
      setTotalCompanies(companiesCount || 0);
      
      const { count: specialistsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .or('role.eq.SPECIALIST,role.ilike.%solo%')
        .eq('verification_status', 'verified');
      
      setTotalSpecialists(specialistsCount || 0);
      
      const { count: servicesCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true });
      
      setTotalServices(servicesCount || 0);
    } catch (error) {
      console.error('Catch error:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, selectedCity, selectedSpecialistType, selectedServices, sortSpecialists]);

  useEffect(() => {
    fetchSpecialists();
  }, [fetchSpecialists]);

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
        
        {/* Statistics Section */}
        <div className="mb-8">
          <SpecialistsStatistics 
            totalCompanies={totalCompanies}
            totalSpecialists={totalSpecialists}
            totalServices={totalServices}
            onSearchChange={setSearchTerm}
            onCityChange={setSelectedCity}
            onSpecialistTypeChange={setSelectedSpecialistType}
            onServicesChange={setSelectedServices}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        {/* Screen Reader Announcements */}
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true" 
          className="sr-only"
        >
          {!loading && `${soloSpecialists.length + companySpecialists.length} ${t.specialistsFound}`}
        </div>

        {/* Divider */}
        <div className="mb-8 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-white/20"></div>

        {/* Company Specialists Section */}
        <div className="mb-12">
          <h2 className="mb-4 text-base font-semibold sm:text-lg md:text-xl">
            {t.companySpecialists} ({companySpecialists.length})
          </h2>
          {loading ? (
            <div className={viewMode === 'grid' 
              ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-4"
            }>
              {Array.from({ length: 6 }).map((_, i) => (
                <SpecialistCardSkeleton key={i} viewMode={viewMode} />
              ))}
            </div>
          ) : companySpecialists.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-4"
            }>
              {companySpecialists.map((specialist) => (
                <CompanySpecialistCard key={specialist.id} specialist={specialist} viewMode={viewMode} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-base opacity-60">
              {t.noResultsDescription}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mb-8 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-white/20"></div>

        {/* Solo Specialists Section */}
        <div className="mb-12">
          <h2 className="mb-4 text-base font-semibold sm:text-lg md:text-xl">
            {t.soloSpecialists} ({soloSpecialists.length})
          </h2>
          {loading ? (
            <div className={viewMode === 'grid' 
              ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-4"
            }>
              {Array.from({ length: 6 }).map((_, i) => (
                <SpecialistCardSkeleton key={i} viewMode={viewMode} />
              ))}
            </div>
          ) : soloSpecialists.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-4"
            }>
              {soloSpecialists.map((specialist) => (
                <SoloSpecialistCard key={specialist.id} specialist={specialist} viewMode={viewMode} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-base opacity-60">
              {t.noResultsDescription}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
