'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { MapPin, X, Check, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const cityPickerTranslations = {
  ka: {
    selectCities: 'აირჩიეთ ქალაქები',
    selectCitiesDescription: 'მონიშნეთ ქალაქები სადაც მუშაობთ',
    search: 'ძებნა...',
    citiesSelected: 'არჩეულია',
    city: 'ქალაქი',
    loading: 'იტვირთება...',
    noCitiesFound: 'ქალაქი ვერ მოიძებნა',
    add: 'დამატება',
    cancel: 'გაუქმება'
  },
  en: {
    selectCities: 'Select Cities',
    selectCitiesDescription: 'Select the cities where you operate',
    search: 'Search...',
    citiesSelected: 'selected',
    city: 'city',
    loading: 'Loading...',
    noCitiesFound: 'No cities found',
    add: 'Add',
    cancel: 'Cancel'
  },
  ru: {
    selectCities: 'Выберите города',
    selectCitiesDescription: 'Отметьте города, где вы работаете',
    search: 'Поиск...',
    citiesSelected: 'выбрано',
    city: 'город',
    loading: 'Загрузка...',
    noCitiesFound: 'Город не найден',
    add: 'Добавить',
    cancel: 'Отмена'
  }
}

interface City {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  region: string | null;
}

interface CityPickerProps {
  onClose: () => void;
  onSave: (cityIds: string[]) => void;
  selectedCityIds: string[];
}

export default function CityPicker({ onClose, onSave, selectedCityIds }: CityPickerProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const pathname = usePathname();
  const locale = (pathname?.split('/')[1] || 'ka') as 'ka' | 'en' | 'ru';
  const t = cityPickerTranslations[locale] || cityPickerTranslations.ka;
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedCityIds);
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();

  const fetchCities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order(locale === 'en' ? 'name_en' : locale === 'ru' ? 'name_ru' : 'name_ka');

      if (error) {
        console.error('Error fetching cities:', error);
      } else {
        setCities(data || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [locale, supabase]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const toggleCity = (cityId: string) => {
    setSelectedIds(prev => 
      prev.includes(cityId) 
        ? prev.filter(id => id !== cityId)
        : [...prev, cityId]
    );
  };

  const handleSave = () => {
    onSave(selectedIds);
    onClose();
  };

  // Filter cities based on search query
  const filteredCities = cities.filter(city => 
    city.name_ka.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (city.name_ru && city.name_ru.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (city.region && city.region.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/60 backdrop-blur-sm pb-20 lg:pb-0 px-2 lg:px-4">
      <div className={`w-full max-w-4xl max-h-[70vh] lg:max-h-[70vh] rounded-t-xl lg:rounded-xl border shadow-2xl flex flex-col ${
        isDark ? 'bg-black border-white/10' : 'bg-white border-black/10'
      }`}>
        {/* Header - Fixed */}
        <div className={`flex-shrink-0 border-b p-3 lg:p-4 ${
          isDark ? 'border-white/10' : 'border-black/10'
        }`}>
          <div className="flex items-start justify-between mb-2 lg:mb-3">
            <div>
              <h3 className={`text-base lg:text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                {t.selectCities}
              </h3>
              <p className={`mt-0.5 text-[10px] lg:text-xs font-light ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                {t.selectCitiesDescription}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`rounded-full p-1 lg:p-1.5 transition-all hover:scale-110 ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
              }`}
            >
              <X className={`h-4 w-4 ${isDark ? 'text-white/70' : 'text-black/70'}`} strokeWidth={1.5} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className={`absolute left-2.5 lg:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${
              isDark ? 'text-white/30' : 'text-black/30'
            }`} strokeWidth={2} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search}
              className={`w-full rounded-lg border-0 pl-8 lg:pl-9 pr-3 py-2 text-xs font-light transition-all focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-white/5 text-white placeholder:text-white/30 focus:bg-white/10 focus:ring-white/20'
                  : 'bg-black/5 text-black placeholder:text-black/30 focus:bg-black/10 focus:ring-black/20'
              }`}
            />
          </div>

          {/* Selected Count */}
          {selectedIds.length > 0 && (
            <div className={`mt-2 rounded-lg px-2.5 py-1.5 text-center ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
              <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                ✓ {t.citiesSelected} {selectedIds.length} {selectedIds.length === 1 ? t.city : t.city}
              </p>
            </div>
          )}
        </div>

        {/* Cities Grid - Scrollable with fixed height */}
        <div className="flex-1 overflow-y-auto p-2 lg:p-4 min-h-0">
          {loading ? (
            <div className={`py-6 text-center ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              <p className="text-xs font-light">{t.loading}</p>
            </div>
          ) : filteredCities.length === 0 ? (
            <div className={`py-6 text-center ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              <p className="text-xs font-light">{t.noCitiesFound}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 lg:gap-2">
                {filteredCities.map((city) => {
                  const isSelected = selectedIds.includes(city.id);
                  return (
                    <button
                      key={city.id}
                      onClick={() => toggleCity(city.id)}
                      className={`group relative flex items-center gap-1.5 lg:gap-2 rounded-lg px-2 lg:px-2.5 py-1.5 lg:py-2 text-left transition-all duration-200 ${
                        isSelected
                          ? isDark 
                            ? 'bg-white/20 ring-1 ring-white/40'
                            : 'bg-black/20 ring-1 ring-black/40'
                          : isDark
                          ? 'bg-white/5 hover:bg-white/10 ring-1 ring-white/10'
                          : 'bg-black/5 hover:bg-black/10 ring-1 ring-black/10'
                      }`}
                    >
                      <div className={`flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded transition-all ${
                        isSelected
                          ? isDark ? 'bg-white' : 'bg-black'
                          : isDark
                          ? 'bg-white/10 ring-1 ring-white/20'
                          : 'bg-black/10 ring-1 ring-black/20'
                      }`}>
                        {isSelected && (
                          <Check 
                            className={`h-2 w-2 ${isDark ? 'text-black' : 'text-white'}`}
                            strokeWidth={3} 
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${
                          isDark ? 'text-white' : 'text-black'
                        }`}>
                          {locale === 'en' ? city.name_en : locale === 'ru' ? city.name_ru : city.name_ka}
                        </p>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Footer Actions - Fixed/Sticky */}
        <div className={`flex-shrink-0 border-t p-2 pb-safe lg:p-3 bg-inherit ${
          isDark ? 'border-white/10' : 'border-black/10'
        }`}>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={selectedIds.length === 0}
              className={`flex-1 rounded-lg px-3 py-1.5 lg:py-2 text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark 
                  ? 'bg-white text-black hover:bg-white/90' 
                  : 'bg-black text-white hover:bg-black/90'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                <span>{t.add} ({selectedIds.length})</span>
              </span>
            </button>
            <button
              onClick={onClose}
              className={`flex-1 rounded-lg px-3 py-1.5 lg:py-2 text-xs font-medium transition-all active:scale-[0.98] ${
                isDark 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-black/5 text-black hover:bg-black/10'
              }`}
            >
              {t.cancel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
