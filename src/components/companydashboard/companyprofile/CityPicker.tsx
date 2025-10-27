'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { MapPin, X, Check, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
  const locale = pathname?.split('/')[1] || 'ka';
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

  // Group cities by 3 per row
  const groupedCities: City[][] = [];
  for (let i = 0; i < filteredCities.length; i += 3) {
    groupedCities.push(filteredCities.slice(i, i + 3));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-5xl h-[85vh] rounded-3xl border shadow-2xl flex flex-col ${
        isDark ? 'bg-black border-white/10' : 'bg-white border-black/10'
      }`}>
        {/* Header - Fixed */}
        <div className={`flex-shrink-0 border-b p-8 ${
          isDark ? 'border-white/10' : 'border-black/10'
        }`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className={`text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                {locale === 'en' ? 'Select Cities' : 'აირჩიეთ ქალაქები'}
              </h3>
              <p className={`mt-2 text-sm font-light ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                {locale === 'en' 
                  ? 'Select the cities where your company operates'
                  : 'მონიშნეთ ქალაქები სადაც თქვენი კომპანია მუშაობს'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className={`rounded-full p-2 transition-all hover:scale-110 ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
              }`}
            >
              <X className={`h-5 w-5 ${isDark ? 'text-white/70' : 'text-black/70'}`} strokeWidth={1.5} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${
              isDark ? 'text-white/30' : 'text-black/30'
            }`} strokeWidth={2} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'en' ? 'Search for a city...' : 'მოძებნეთ ქალაქი...'}
              className={`w-full rounded-2xl border-0 pl-11 pr-4 py-3.5 text-sm font-light transition-all focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-white/5 text-white placeholder:text-white/30 focus:bg-white/10 focus:ring-white/20'
                  : 'bg-black/5 text-black placeholder:text-black/30 focus:bg-black/10 focus:ring-black/20'
              }`}
            />
          </div>

          {/* Selected Count */}
          {selectedIds.length > 0 && (
            <div className="mt-4 rounded-2xl bg-emerald-500/10 px-4 py-2.5 text-center">
              <p className="text-sm font-medium text-emerald-600">
                ✓ {locale === 'en' 
                  ? `${selectedIds.length} ${selectedIds.length === 1 ? 'city' : 'cities'} selected`
                  : `არჩეულია ${selectedIds.length} ქალაქი`
                }
              </p>
            </div>
          )}
        </div>

        {/* Cities Grid - Scrollable with fixed height */}
        <div className="flex-1 overflow-y-auto p-8 min-h-0">
          {loading ? (
            <div className={`py-12 text-center ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              <p className="text-sm font-light">{locale === 'en' ? 'Loading...' : 'იტვირთება...'}</p>
            </div>
          ) : filteredCities.length === 0 ? (
            <div className={`py-12 text-center ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              <p className="text-sm font-light">{locale === 'en' ? 'No cities found' : 'ქალაქი ვერ მოიძებნა'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedCities.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-3 gap-3">
                  {row.map((city) => {
                    const isSelected = selectedIds.includes(city.id);
                    return (
                      <button
                        key={city.id}
                        onClick={() => toggleCity(city.id)}
                        className={`group relative flex items-center gap-3 rounded-2xl px-4 py-4 text-left transition-all duration-200 ${
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
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isSelected
                              ? 'text-emerald-600'
                              : isDark ? 'text-white' : 'text-black'
                          }`}>
                            {locale === 'en' ? city.name_en : locale === 'ru' ? city.name_ru : city.name_ka}
                          </p>
                          {city.region && (
                            <p className={`text-xs truncate font-light ${
                              isSelected
                                ? 'text-emerald-600/70'
                                : isDark ? 'text-white/40' : 'text-black/40'
                            }`}>
                              {city.region}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions - Fixed */}
        <div className={`flex-shrink-0 border-t p-8 ${
          isDark ? 'border-white/10' : 'border-black/10'
        }`}>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 rounded-2xl bg-emerald-500 px-6 py-3.5 font-semibold text-white shadow-lg transition-all hover:bg-emerald-600 hover:shadow-xl active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                <MapPin className="h-5 w-5" strokeWidth={2} />
                {locale === 'en' ? `Add (${selectedIds.length})` : `დამატება (${selectedIds.length})`}
              </span>
            </button>
            <button
              onClick={onClose}
              className={`flex-1 rounded-2xl px-6 py-3.5 font-medium transition-all hover:shadow-md active:scale-[0.98] ${
                isDark 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-black/5 text-black hover:bg-black/10'
              }`}
            >
              {locale === 'en' ? 'Cancel' : 'გაუქმება'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
