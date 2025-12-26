'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getClientSingleton } from '@/lib/supabase/client';
import type { 
  Company,
  UseCompaniesDataProps,
  UseCompaniesDataReturn 
} from '../types';

// ==================== Hook ====================
export function useCompaniesData({
  initialCompanies,
  filters,
  locale,
  sortBy,
}: UseCompaniesDataProps): UseCompaniesDataReturn {
  // Use ref to store initial data without triggering re-renders
  const initialDataRef = useRef(initialCompanies);
  
  // Initialize with initial data directly (already sorted from SSR)
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isFetching = useRef(false);
  const didMount = useRef(false);

  // Extract individual filter values to avoid object reference issues
  const {
    debouncedSearchTerm,
    selectedCompany,
    selectedSpecialization,
    selectedCity,
  } = filters;

  // Check if any filter is active
  const hasActiveFilters = !!(
    debouncedSearchTerm ||
    selectedCompany ||
    selectedSpecialization ||
    selectedCity
  );

  // Sort function
  const sortCompanies = useCallback((companiesList: Company[]): Company[] => {
    const sorted = [...companiesList];
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
  const sortCompaniesRef = useRef(sortCompanies);
  sortCompaniesRef.current = sortCompanies;

  // Fetch filtered companies
  const fetchFilteredCompanies = useCallback(async () => {
    if (isFetching.current) return;

    // If no filters, use initial data (sorted)
    if (!hasActiveFilters) {
      setCompanies(sortCompaniesRef.current(initialDataRef.current));
      return;
    }

    isFetching.current = true;
    setLoading(true);
    setError(null);

    try {
      const supabase = getClientSingleton();
      let filteredCompanies = [...initialDataRef.current];

      // 1. Company filter (direct)
      if (selectedCompany) {
        filteredCompanies = filteredCompanies.filter(c => c.id === selectedCompany);
      }

      // 2. City filter
      if (selectedCity) {
        // Get city ID from cities table (search in all language fields)
        const { data: cityData } = await supabase
          .from('cities')
          .select('id')
          .or(`name_ka.eq.${selectedCity},name_en.eq.${selectedCity},name_ru.eq.${selectedCity}`)
          .single();

        if (cityData) {
          // Get company IDs that have this city
          const { data: companyCities } = await supabase
            .from('company_cities')
            .select('company_id')
            .eq('city_id', cityData.id);

          const companyIdsWithCity = new Set(companyCities?.map(cc => cc.company_id) || []);
          filteredCompanies = filteredCompanies.filter(c => companyIdsWithCity.has(c.id));
        } else {
          filteredCompanies = [];
        }
      }

      // 3. Specialization filter
      if (selectedSpecialization) {
        const { data: companySpecializations } = await supabase
          .from('company_specializations')
          .select('company_id')
          .eq('specialization_id', selectedSpecialization);

        const companyIdsWithSpec = new Set(companySpecializations?.map(cs => cs.company_id) || []);
        filteredCompanies = filteredCompanies.filter(c => companyIdsWithSpec.has(c.id));
      }

      // 4. Search filter (complex - searches across entities)
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const matchingCompanyIds = new Set<string>();

        // Search in company name (local - from SSR data)
        filteredCompanies.forEach(company => {
          if (company.full_name.toLowerCase().includes(searchLower)) {
            matchingCompanyIds.add(company.id);
          }
          if (company.summary?.toLowerCase().includes(searchLower)) {
            matchingCompanyIds.add(company.id);
          }
        });

        // Search in cities (all languages)
        const { data: allCities } = await supabase
          .from('cities')
          .select('id, name_ka, name_en, name_ru');

        const cityMatches = allCities?.filter(city => 
          city.name_ka?.toLowerCase().includes(searchLower) ||
          city.name_en?.toLowerCase().includes(searchLower) ||
          city.name_ru?.toLowerCase().includes(searchLower)
        ) || [];

        if (cityMatches.length > 0) {
          const cityIds = cityMatches.map(c => c.id);
          const { data: companyCities } = await supabase
            .from('company_cities')
            .select('company_id')
            .in('city_id', cityIds);
          
          companyCities?.forEach(cc => matchingCompanyIds.add(cc.company_id));
        }

        // Search in specializations (all languages)
        const { data: allSpecs } = await supabase
          .from('specializations')
          .select('id, name_ka, name_en, name_ru');

        const specializationMatches = allSpecs?.filter(spec =>
          spec.name_ka?.toLowerCase().includes(searchLower) ||
          spec.name_en?.toLowerCase().includes(searchLower) ||
          spec.name_ru?.toLowerCase().includes(searchLower)
        ) || [];

        if (specializationMatches.length > 0) {
          const specIds = specializationMatches.map(s => s.id);
          const { data: companySpecs } = await supabase
            .from('company_specializations')
            .select('company_id')
            .in('specialization_id', specIds);
          
          companySpecs?.forEach(cs => matchingCompanyIds.add(cs.company_id));
        }

        // Search in specialists (full_name)
        const { data: allSpecialists } = await supabase
          .from('profiles')
          .select('company_id, full_name')
          .eq('role', 'SPECIALIST')
          .not('company_id', 'is', null);

        const specialistMatches = allSpecialists?.filter(s =>
          s.full_name.toLowerCase().includes(searchLower)
        ) || [];

        specialistMatches.forEach(s => {
          if (s.company_id) matchingCompanyIds.add(s.company_id);
        });

        // Filter companies by matching IDs
        filteredCompanies = filteredCompanies.filter(c => matchingCompanyIds.has(c.id));
      }

      // Sort and set results
      setCompanies(sortCompaniesRef.current(filteredCompanies));

    } catch (err) {
      console.error('Error filtering companies:', err);
      setError(err instanceof Error ? err : new Error('Failed to filter companies'));
      // Fallback to initial data on error
      setCompanies(sortCompaniesRef.current(initialDataRef.current));
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  // Use individual filter values in dependencies, not the filters object
  }, [debouncedSearchTerm, selectedCompany, selectedSpecialization, selectedCity, hasActiveFilters]);

  // Trigger fetch when filters change (skip initial mount)
  useEffect(() => {
    // Skip first mount - we already have initial data
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    fetchFilteredCompanies();
  }, [fetchFilteredCompanies]);

  // Re-sort when sortBy changes (without re-fetching)
  useEffect(() => {
    // Skip first mount
    if (!didMount.current) return;
    setCompanies(prev => sortCompaniesRef.current(prev));
  }, [sortBy]);

  return {
    companies,
    loading,
    error,
    hasActiveFilters,
  };
}
