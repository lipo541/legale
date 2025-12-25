'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getClientSingleton } from '@/lib/supabase/client';
import type { 
  SoloSpecialist, 
  CompanySpecialist,
  SpecialistFilters 
} from '../types';

// ==================== Types ====================
interface UseSpecialistsDataProps {
  initialSoloSpecialists: SoloSpecialist[];
  initialCompanySpecialists: CompanySpecialist[];
  filters: SpecialistFilters;
  locale: string;
  sortBy: string;
}

interface UseSpecialistsDataReturn {
  soloSpecialists: SoloSpecialist[];
  companySpecialists: CompanySpecialist[];
  loading: boolean;
  error: Error | null;
  hasActiveFilters: boolean;
}

// ==================== Hook ====================
export function useSpecialistsData({
  initialSoloSpecialists,
  initialCompanySpecialists,
  filters,
  locale,
  sortBy,
}: UseSpecialistsDataProps): UseSpecialistsDataReturn {
  // Memoize initial data to prevent reference changes
  const stableInitialSolo = useMemo(() => initialSoloSpecialists, []);
  const stableInitialCompany = useMemo(() => initialCompanySpecialists, []);
  
  const [soloSpecialists, setSoloSpecialists] = useState<SoloSpecialist[]>(stableInitialSolo);
  const [companySpecialists, setCompanySpecialists] = useState<CompanySpecialist[]>(stableInitialCompany);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isFetching = useRef(false);
  const isFirstMount = useRef(true);

  // Check if any filter is active
  const hasActiveFilters = !!(
    filters.debouncedSearchTerm ||
    filters.selectedCity ||
    filters.selectedSpecialistType ||
    filters.selectedServices.length > 0 ||
    filters.selectedLanguages.length > 0
  );

  // Sort function - NOT in dependency array of fetchFilteredSpecialists
  const sortSpecialists = useCallback(<T extends { id: string; full_name: string }>(specialists: T[]): T[] => {
    const sorted = [...specialists];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => b.id.localeCompare(a.id));
      case 'oldest':
        return sorted.sort((a, b) => a.id.localeCompare(b.id));
      case 'a-z':
        return sorted.sort((a, b) => a.full_name.localeCompare(b.full_name, locale));
      case 'z-a':
        return sorted.sort((a, b) => b.full_name.localeCompare(a.full_name, locale));
      default:
        return sorted;
    }
  }, [sortBy, locale]);

  // Refs to use latest values without triggering re-renders
  const sortSpecialistsRef = useRef(sortSpecialists);
  sortSpecialistsRef.current = sortSpecialists;

  // Fetch filtered specialists
  const fetchFilteredSpecialists = useCallback(async () => {
    if (isFetching.current) return;

    // If no filters, use initial data (sorted)
    if (!hasActiveFilters) {
      setSoloSpecialists(sortSpecialistsRef.current(stableInitialSolo));
      setCompanySpecialists(sortSpecialistsRef.current(stableInitialCompany));
      return;
    }

    isFetching.current = true;
    setLoading(true);
    setError(null);

    try {
      const supabase = getClientSingleton();
      let allSpecialistIds: string[] = [];

      const {
        debouncedSearchTerm,
        selectedCity,
        selectedSpecialistType,
        selectedServices,
        selectedLanguages,
      } = filters;

      // 1. Filter by city
      if (selectedCity) {
        const { data: specialistCityData } = await supabase
          .from('specialist_cities')
          .select('specialist_id')
          .eq('city_id', selectedCity);
        allSpecialistIds = specialistCityData?.map(sc => sc.specialist_id) || [];
      }

      // 2. Filter by services
      if (selectedServices.length > 0) {
        const { data: specialistServicesData } = await supabase
          .from('specialist_services')
          .select('profile_id')
          .in('service_id', selectedServices);

        const serviceFilteredIds = specialistServicesData?.map(ss => ss.profile_id) || [];

        if (allSpecialistIds.length > 0) {
          allSpecialistIds = allSpecialistIds.filter(id => serviceFilteredIds.includes(id));
        } else if (!selectedCity) {
          allSpecialistIds = serviceFilteredIds;
        }
      }

      // 3. Search filter
      if (debouncedSearchTerm) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id')
          .or(`full_name.ilike.%${debouncedSearchTerm}%,role_title.ilike.%${debouncedSearchTerm}%,bio.ilike.%${debouncedSearchTerm}%`)
          .in('role', ['SPECIALIST', 'SOLO_SPECIALIST']);

        const { data: translationsData } = await supabase
          .from('specialist_translations')
          .select('specialist_id')
          .or(`full_name.ilike.%${debouncedSearchTerm}%,role_title.ilike.%${debouncedSearchTerm}%,bio.ilike.%${debouncedSearchTerm}%`);

        const searchFilteredIds = [...new Set([
          ...(profilesData?.map(p => p.id) || []),
          ...(translationsData?.map(t => t.specialist_id) || [])
        ])];

        if (allSpecialistIds.length > 0) {
          allSpecialistIds = allSpecialistIds.filter(id => searchFilteredIds.includes(id));
        } else if (!selectedCity && selectedServices.length === 0) {
          allSpecialistIds = searchFilteredIds;
        }
      }

      // 4. Filter by languages
      if (selectedLanguages.length > 0) {
        const { data: languageData } = await supabase
          .from('profiles')
          .select('id, languages')
          .in('role', ['SPECIALIST', 'SOLO_SPECIALIST']);

        const languageFilteredIds = languageData
          ?.filter(profile => {
            const profileLangs = profile.languages as string[] || [];
            return selectedLanguages.every(lang => profileLangs.includes(lang));
          })
          .map(p => p.id) || [];

        if (allSpecialistIds.length > 0) {
          allSpecialistIds = allSpecialistIds.filter(id => languageFilteredIds.includes(id));
        } else if (!selectedCity && selectedServices.length === 0 && !debouncedSearchTerm) {
          allSpecialistIds = languageFilteredIds;
        }
      }

      const hasFilters = selectedCity || selectedServices.length > 0 || debouncedSearchTerm || selectedLanguages.length > 0;

      // Fetch solo specialists
      if (!selectedSpecialistType || selectedSpecialistType === 'solo') {
        if (hasFilters && allSpecialistIds.length === 0) {
          setSoloSpecialists([]);
        } else {
          let soloQuery = supabase
            .from('profiles')
            .select('id, full_name, role_title, bio, avatar_url, slug, email, phone_number, info_activate')
            .ilike('role', '%solo%')
            .eq('verification_status', 'verified');

          if (allSpecialistIds.length > 0) {
            soloQuery = soloQuery.in('id', allSpecialistIds);
          }

          const { data: soloData } = await soloQuery;

          if (soloData && soloData.length > 0) {
            const { data: translations } = await supabase
              .from('specialist_translations')
              .select('specialist_id, slug, full_name, role_title, bio')
              .eq('language', locale)
              .in('specialist_id', soloData.map(s => s.id));

            const translationMap = new Map(
              translations?.map(t => [t.specialist_id, t]) || []
            );

            const mapped = soloData.map(specialist => {
              const trans = translationMap.get(specialist.id);
              return {
                ...specialist,
                slug: trans?.slug || specialist.slug,
                full_name: trans?.full_name || specialist.full_name,
                role_title: trans?.role_title || specialist.role_title,
                bio: trans?.bio || specialist.bio,
              };
            });

            setSoloSpecialists(sortSpecialistsRef.current(mapped));
          } else {
            setSoloSpecialists([]);
          }
        }
      } else {
        setSoloSpecialists([]);
      }

      // Fetch company specialists
      if (!selectedSpecialistType || selectedSpecialistType === 'company') {
        if (hasFilters && allSpecialistIds.length === 0) {
          setCompanySpecialists([]);
        } else {
          let companyQuery = supabase
            .from('profiles')
            .select('id, full_name, role_title, bio, avatar_url, company_id, slug, email, phone_number, info_activate')
            .eq('role', 'SPECIALIST')
            .not('company_id', 'is', null)
            .eq('verification_status', 'verified');

          if (allSpecialistIds.length > 0) {
            companyQuery = companyQuery.in('id', allSpecialistIds);
          }

          const { data: companyData } = await companyQuery;

          if (companyData && companyData.length > 0) {
            const companyIds = [...new Set(companyData.map(s => s.company_id).filter(Boolean))];

            const { data: companiesData } = await supabase
              .from('profiles')
              .select('id, full_name, company_slug, email, phone_number')
              .in('id', companyIds)
              .eq('role', 'COMPANY');

            const companyMap = new Map(
              companiesData?.map(c => [c.id, {
                name: c.full_name,
                slug: c.company_slug,
                email: c.email,
                phone: c.phone_number
              }]) || []
            );

            const { data: translations } = await supabase
              .from('specialist_translations')
              .select('specialist_id, slug, full_name, role_title, bio')
              .eq('language', locale)
              .in('specialist_id', companyData.map(s => s.id));

            const translationMap = new Map(
              translations?.map(t => [t.specialist_id, t]) || []
            );

            const mapped = companyData.map(s => {
              const companyInfo = companyMap.get(s.company_id);
              const trans = translationMap.get(s.id);
              return {
                id: s.id,
                full_name: trans?.full_name || s.full_name,
                role_title: trans?.role_title || s.role_title,
                bio: trans?.bio || s.bio,
                avatar_url: s.avatar_url,
                company: companyInfo?.name || 'Company',
                company_slug: companyInfo?.slug,
                company_email: companyInfo?.email,
                company_phone: companyInfo?.phone,
                slug: trans?.slug || s.slug,
                email: s.email,
                phone_number: s.phone_number,
                info_activate: s.info_activate,
              };
            });

            setCompanySpecialists(sortSpecialistsRef.current(mapped));
          } else {
            setCompanySpecialists([]);
          }
        }
      } else {
        setCompanySpecialists([]);
      }
    } catch (err) {
      console.error('Error fetching filtered specialists:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch specialists'));
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [
    hasActiveFilters,
    stableInitialSolo,
    stableInitialCompany,
    filters.debouncedSearchTerm,
    filters.selectedCity,
    filters.selectedSpecialistType,
    filters.selectedServices,
    filters.selectedLanguages,
    locale,
    // Note: sortSpecialistsRef used instead of sortSpecialists to avoid dependency
  ]);

  // Re-fetch when filters change (skip first mount - we have initial data)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchFilteredSpecialists();
  }, [fetchFilteredSpecialists]);

  // Re-sort when sort option changes (without refetch)
  useEffect(() => {
    setSoloSpecialists(prev => sortSpecialists([...prev]));
    setCompanySpecialists(prev => sortSpecialists([...prev]));
  }, [sortBy, sortSpecialists]);

  return {
    soloSpecialists,
    companySpecialists,
    loading,
    error,
    hasActiveFilters,
  };
}
