'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Calendar, Clock, ChevronLeft, ChevronRight, X, Zap, Sun, Moon, Sunrise, Sunset } from 'lucide-react'

interface DateTimePickerProps {
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
  label?: string
}

const MONTHS = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
]

const WEEKDAYS = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი']

const QUICK_TIMES = [
  { label: 'დილა', icon: Sunrise, hour: 9, minute: 0, color: 'amber' },
  { label: 'შუადღე', icon: Sun, hour: 12, minute: 0, color: 'yellow' },
  { label: 'საღამო', icon: Sunset, hour: 17, minute: 0, color: 'orange' },
  { label: 'ღამე', icon: Moon, hour: 20, minute: 0, color: 'indigo' },
]

export default function DateTimePicker({ value, onChange, disabled, label }: DateTimePickerProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Parse current value or use current date
  const currentDate = value ? new Date(value) : new Date()
  const [viewDate, setViewDate] = useState(new Date(currentDate))
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null)
  const [selectedHour, setSelectedHour] = useState(currentDate.getHours())
  const [selectedMinute, setSelectedMinute] = useState(currentDate.getMinutes())
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedDate) return

      const newDate = new Date(selectedDate)

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          newDate.setDate(newDate.getDate() - 1)
          handleDateSelect(newDate)
          break
        case 'ArrowRight':
          e.preventDefault()
          newDate.setDate(newDate.getDate() + 1)
          handleDateSelect(newDate)
          break
        case 'ArrowUp':
          e.preventDefault()
          newDate.setDate(newDate.getDate() - 7)
          handleDateSelect(newDate)
          break
        case 'ArrowDown':
          e.preventDefault()
          newDate.setDate(newDate.getDate() + 7)
          handleDateSelect(newDate)
          break
        case 'Enter':
          e.preventDefault()
          setIsOpen(false)
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedDate])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const prevMonthLastDay = new Date(year, month, 0)
    
    let firstDayOfWeek = firstDay.getDay()
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
    
    const days: (Date | null)[] = []
    
    // Add previous month's trailing days (faded)
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay.getDate() - i)
      days.push(date)
    }
    
    // Add current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day))
    }
    
    // Add next month's leading days (faded)
    const remainingCells = 42 - days.length // 6 weeks * 7 days
    for (let day = 1; day <= remainingCells; day++) {
      days.push(new Date(year, month + 1, day))
    }
    
    return days
  }, [viewDate])

  // Quick preset handlers
  const setNow = useCallback(() => {
    const now = new Date()
    setSelectedDate(now)
    setSelectedHour(now.getHours())
    setSelectedMinute(now.getMinutes())
    onChange(now.toISOString())
    setIsOpen(false)
  }, [onChange])

  const setQuickTime = useCallback((hour: number, minute: number, isToday: boolean = true) => {
    const date = isToday ? new Date() : new Date()
    if (!isToday) date.setDate(date.getDate() + 1)
    date.setHours(hour, minute, 0, 0)
    setSelectedDate(date)
    setSelectedHour(hour)
    setSelectedMinute(minute)
    setViewDate(date)
    onChange(date.toISOString())
  }, [onChange])

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
    setViewDate(date) // Keep calendar view on selected month
    const newDate = new Date(date)
    newDate.setHours(selectedHour, selectedMinute, 0, 0)
    onChange(newDate.toISOString())
  }, [selectedHour, selectedMinute, onChange])

  const handleTimeChange = useCallback((hour: number, minute: number) => {
    setSelectedHour(hour)
    setSelectedMinute(minute)
    if (selectedDate) {
      const newDate = new Date(selectedDate)
      newDate.setHours(hour, minute, 0, 0)
      onChange(newDate.toISOString())
    }
  }, [selectedDate, onChange])

  const previousMonth = useCallback(() => {
    setViewDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
  }, [])

  const nextMonth = useCallback(() => {
    setViewDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + 1)
      return newDate
    })
  }, [])

  const goToToday = useCallback(() => {
    const today = new Date()
    setViewDate(today)
    handleDateSelect(today)
  }, [handleDateSelect])

  const clearDate = useCallback(() => {
    setSelectedDate(null)
    onChange(null)
    setIsOpen(false)
  }, [onChange])

  const isSameDay = useCallback((date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear()
  }, [])

  const isToday = useCallback((date: Date) => {
    return isSameDay(date, new Date())
  }, [isSameDay])

  const isCurrentMonth = useCallback((date: Date) => {
    return date.getMonth() === viewDate.getMonth() && date.getFullYear() === viewDate.getFullYear()
  }, [viewDate])

  const formatDisplayValue = useCallback(() => {
    if (!selectedDate) return 'აირჩიეთ თარიღი და დრო'
    
    const day = selectedDate.getDate().toString().padStart(2, '0')
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0')
    const year = selectedDate.getFullYear()
    const hour = selectedHour.toString().padStart(2, '0')
    const minute = selectedMinute.toString().padStart(2, '0')
    
    return `${day}/${month}/${year} • ${hour}:${minute}`
  }, [selectedDate, selectedHour, selectedMinute])

  const getRelativeTime = useCallback(() => {
    if (!selectedDate) return null
    
    const now = new Date()
    const selected = new Date(selectedDate)
    selected.setHours(selectedHour, selectedMinute, 0, 0)
    
    const diffMs = selected.getTime() - now.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays} დღეში`
    if (diffDays < 0) return `${Math.abs(diffDays)} დღის წინ`
    if (diffHours > 0) return `${diffHours} საათში`
    if (diffHours < 0) return `${Math.abs(diffHours)} საათის წინ`
    if (diffMins > 0) return `${diffMins} წუთში`
    if (diffMins < 0) return `${Math.abs(diffMins)} წუთის წინ`
    return 'ახლა'
  }, [selectedDate, selectedHour, selectedMinute])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <div className="flex items-center gap-2">
        {label && (
          <label className={`text-[10px] font-medium uppercase tracking-wide ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {label}
          </label>
        )}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            group relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium 
            transition-all border-2 min-w-[220px] justify-between overflow-hidden
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-offset-2
            ${isDark
              ? 'bg-gradient-to-br from-white/10 to-white/5 text-white border-white/20 hover:border-white/40 focus:ring-white/20 focus:ring-offset-zinc-900'
              : 'bg-gradient-to-br from-black/5 to-black/10 text-black border-black/20 hover:border-black/40 focus:ring-black/20 focus:ring-offset-white'
            }
          `}
        >
          {/* Animated gradient background */}
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${
            isDark
              ? 'bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10'
              : 'bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-purple-500/5'
          }`} />
          
          <span className="relative flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="flex flex-col items-start">
              <span className="font-semibold">{formatDisplayValue()}</span>
              {selectedDate && (
                <span className={`text-[9px] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {getRelativeTime()}
                </span>
              )}
            </span>
          </span>
          {selectedDate && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation()
                clearDate()
              }}
              className={`relative p-1 rounded-lg transition-all ${
                isDark ? 'hover:bg-white/20' : 'hover:bg-black/20'
              }`}
              role="button"
              aria-label="Clear date"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className={`
            absolute top-full left-0 mt-2 z-50 rounded-2xl shadow-2xl border-2 overflow-hidden
            backdrop-blur-xl
            ${isDark 
              ? 'bg-zinc-900/95 border-white/20' 
              : 'bg-white/95 border-black/20'
            }
          `}
          style={{ minWidth: '380px' }}
        >
          {/* Quick Actions Bar */}
          <div className={`p-4 border-b-2 ${isDark ? 'border-white/10 bg-gradient-to-r from-emerald-500/10 to-blue-500/10' : 'border-black/10 bg-gradient-to-r from-emerald-500/5 to-blue-500/5'}`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                <Zap className="h-3.5 w-3.5" />
                სწრაფი არჩევა
              </p>
              <button
                onClick={setNow}
                className={`px-3 py-1 text-[10px] font-semibold rounded-lg transition-all ${
                  isDark
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-blue-500/50'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-blue-500/30'
                }`}
              >
                ახლა
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {QUICK_TIMES.map(({ label, icon: Icon, hour, minute, color }) => (
                <button
                  key={label}
                  onClick={() => setQuickTime(hour, minute)}
                  className={`
                    group relative px-2 py-2.5 text-[10px] font-semibold rounded-xl transition-all
                    flex flex-col items-center gap-1 overflow-hidden
                    ${isDark
                      ? `bg-${color}-500/20 text-${color}-400 hover:bg-${color}-500/30 hover:shadow-lg hover:shadow-${color}-500/30`
                      : `bg-${color}-500/10 text-${color}-600 hover:bg-${color}-500/20 hover:shadow-lg hover:shadow-${color}-500/20`
                    }
                  `}
                  style={{
                    background: isDark 
                      ? `linear-gradient(135deg, rgba(var(--${color}-500), 0.2), rgba(var(--${color}-600), 0.1))`
                      : `linear-gradient(135deg, rgba(var(--${color}-500), 0.1), rgba(var(--${color}-600), 0.05))`
                  }}
                >
                  <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>{label}</span>
                  <span className={`text-[8px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="p-4">
            {/* Month/Year Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={previousMonth}
                className={`p-2 rounded-xl transition-all ${
                  isDark
                    ? 'hover:bg-white/10 text-white/60 hover:text-white'
                    : 'hover:bg-black/10 text-black/60 hover:text-black'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <button
                onClick={goToToday}
                className={`text-sm font-bold tracking-wide transition-all px-4 py-1.5 rounded-xl ${
                  isDark
                    ? 'hover:bg-emerald-500/20 text-emerald-400'
                    : 'hover:bg-emerald-500/10 text-emerald-600'
                }`}
              >
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </button>
              
              <button
                onClick={nextMonth}
                className={`p-2 rounded-xl transition-all ${
                  isDark
                    ? 'hover:bg-white/10 text-white/60 hover:text-white'
                    : 'hover:bg-black/10 text-black/60 hover:text-black'
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map(day => (
                <div
                  key={day}
                  className={`text-center text-[10px] font-bold py-2 ${
                    isDark ? 'text-white/50' : 'text-black/50'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (!day) return null

                const isSelected = isSameDay(day, selectedDate)
                const isTodayDate = isToday(day)
                const inCurrentMonth = isCurrentMonth(day)
                const isHovered = isSameDay(day, hoveredDay)

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDateSelect(day)}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`
                      relative aspect-square text-xs font-semibold rounded-xl transition-all
                      ${isSelected
                        ? isDark
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/50 scale-105'
                          : 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-105'
                        : isTodayDate
                        ? isDark
                          ? 'bg-blue-500/30 text-blue-300 border-2 border-blue-400 hover:bg-blue-500/40'
                          : 'bg-blue-500/20 text-blue-700 border-2 border-blue-500 hover:bg-blue-500/30'
                        : inCurrentMonth
                        ? isDark
                          ? 'hover:bg-white/10 text-white/90 hover:scale-105'
                          : 'hover:bg-black/10 text-black/90 hover:scale-105'
                        : isDark
                        ? 'text-white/30 hover:bg-white/5 hover:text-white/50'
                        : 'text-black/30 hover:bg-black/5 hover:text-black/50'
                      }
                      ${isHovered && !isSelected ? 'ring-2 ring-emerald-400/50' : ''}
                    `}
                  >
                    {day.getDate()}
                    {isTodayDate && !isSelected && (
                      <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time Picker */}
          <div className={`p-4 border-t-2 ${isDark ? 'border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10' : 'border-black/10 bg-gradient-to-r from-purple-500/5 to-pink-500/5'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Clock className={`h-4 w-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                დროის არჩევა
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Hour */}
              <div className="flex-1">
                <label className={`text-[9px] font-semibold uppercase tracking-wide mb-1 block ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                  საათი
                </label>
                <select
                  value={selectedHour}
                  onChange={(e) => handleTimeChange(parseInt(e.target.value), selectedMinute)}
                  className={`
                    w-full px-3 py-2 text-sm font-semibold rounded-xl border-2 transition-all
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${isDark
                      ? 'bg-white/10 border-white/20 text-white focus:ring-purple-500 focus:border-purple-400 focus:ring-offset-zinc-900'
                      : 'bg-black/10 border-black/10 text-black focus:ring-purple-500 focus:border-purple-500 focus:ring-offset-white'
                    }
                  `}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i} style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
              
              <span className={`text-2xl font-bold mt-5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>:</span>
              
              {/* Minute */}
              <div className="flex-1">
                <label className={`text-[9px] font-semibold uppercase tracking-wide mb-1 block ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                  წუთი
                </label>
                <select
                  value={selectedMinute}
                  onChange={(e) => handleTimeChange(selectedHour, parseInt(e.target.value))}
                  className={`
                    w-full px-3 py-2 text-sm font-semibold rounded-xl border-2 transition-all
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${isDark
                      ? 'bg-white/10 border-white/20 text-white focus:ring-purple-500 focus:border-purple-400 focus:ring-offset-zinc-900'
                      : 'bg-black/10 border-black/10 text-black focus:ring-purple-500 focus:border-purple-500 focus:ring-offset-white'
                    }
                  `}
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i} style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
