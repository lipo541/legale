'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Specialization {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
}

interface SpecializationPickerProps {
  selectedSpecializationIds: string[];
  onSave: (specializationIds: string[]) => void;
}

export default function SpecializationPicker({ selectedSpecializationIds, onSave }: SpecializationPickerProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'ka';
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedSpecializationIds);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchSpecializations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('specializations')
        .select('*')
        .order(locale === 'en' ? 'name_en' : locale === 'ru' ? 'name_ru' : 'name_ka');

      if (error) {
        console.error('Error fetching specializations:', error);
      } else {
        setSpecializations(data || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [locale, supabase]);

  useEffect(() => {
    fetchSpecializations();
  }, [fetchSpecializations]);

  useEffect(() => {
    fetchSpecializations();
  }, [fetchSpecializations]);

  useEffect(() => {
    setSelectedIds(selectedSpecializationIds);
  }, [selectedSpecializationIds]);

  const toggleSpecialization = (specializationId: string) => {
    const newSelectedIds = selectedIds.includes(specializationId)
      ? selectedIds.filter(id => id !== specializationId)
      : [...selectedIds, specializationId];
    
    setSelectedIds(newSelectedIds);
    onSave(newSelectedIds);
  };

  const getSpecializationName = (spec: Specialization) => {
    if (locale === 'en') return spec.name_en;
    if (locale === 'ru') return spec.name_ru;
    return spec.name_ka;
  };

  if (loading) {
    return (
      <div className={`py-4 text-center ${isDark ? 'text-white/50' : 'text-black/50'}`}>
        <p className="text-sm font-light">{locale === 'en' ? 'Loading...' : locale === 'ru' ? 'Загрузка...' : 'იტვირთება...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {specializations.map((spec) => {
        const isSelected = selectedIds.includes(spec.id);
        return (
          <button
            key={spec.id}
            onClick={() => toggleSpecialization(spec.id)}
            className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200 ${
              isSelected
                ? 'bg-emerald-500/10 ring-2 ring-emerald-500/50 shadow-sm'
                : isDark
                ? 'bg-white/5 hover:bg-white/10 ring-1 ring-white/10'
                : 'bg-black/5 hover:bg-black/10 ring-1 ring-black/10'
            }`}
          >
            <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md transition-all ${
              isSelected
                ? 'bg-emerald-500'
                : isDark
                ? 'bg-white/10 ring-1 ring-white/20'
                : 'bg-black/10 ring-1 ring-black/20'
            }`}>
              {isSelected && (
                <Check 
                  className="h-3.5 w-3.5 text-white" 
                  strokeWidth={3} 
                />
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                isSelected
                  ? 'text-emerald-600'
                  : isDark ? 'text-white' : 'text-black'
              }`}>
                {getSpecializationName(spec)}
              </p>
            </div>
          </button>
        );
      })}
      
      {selectedIds.length > 0 && (
        <div className="mt-4 rounded-2xl bg-emerald-500/10 px-4 py-2.5 text-center">
          <p className="text-sm font-medium text-emerald-600">
            ✓ {locale === 'en' 
              ? `${selectedIds.length} ${selectedIds.length === 1 ? 'specialization' : 'specializations'} selected`
              : locale === 'ru'
              ? `Выбрано ${selectedIds.length} ${selectedIds.length === 1 ? 'специализация' : 'специализации'}`
              : `არჩეულია ${selectedIds.length} სპეციალიზაცია`
            }
          </p>
        </div>
      )}
    </div>
  );
}
