'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react'

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

export default function DateTimePicker({ value, onChange, disabled, label }: DateTimePickerProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // View mode: 'calendar' | 'month' | 'year'
  const [viewMode, setViewMode] = useState<'calendar' | 'month' | 'year'>('calendar')

  // Parse current value or use current date
  const currentDate = value ? new Date(value) : new Date()
  const [viewDate, setViewDate] = useState(new Date(currentDate))
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null)
  const [selectedHour, setSelectedHour] = useState(currentDate.getHours())
  const [selectedMinute, setSelectedMinute] = useState(currentDate.getMinutes())
  
  // Local input state for time pickers
  const [hourInput, setHourInput] = useState(currentDate.getHours().toString().padStart(2, '0'))
  const [minuteInput, setMinuteInput] = useState(currentDate.getMinutes().toString().padStart(2, '0'))

  // Sync with external value changes
  useEffect(() => {
    if (value) {
      const date = new Date(value)
      setSelectedDate(date)
      setViewDate(date)
      setSelectedHour(date.getHours())
      setSelectedMinute(date.getMinutes())
      setHourInput(date.getHours().toString().padStart(2, '0'))
      setMinuteInput(date.getMinutes().toString().padStart(2, '0'))
    } else {
      setSelectedDate(null)
      const now = new Date()
      setSelectedHour(now.getHours())
      setSelectedMinute(now.getMinutes())
      setHourInput(now.getHours().toString().padStart(2, '0'))
      setMinuteInput(now.getMinutes().toString().padStart(2, '0'))
    }
  }, [value])

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
    
    // Add previous month's trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay.getDate() - i)
      days.push(date)
    }
    
    // Add current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day))
    }
    
    // Add next month's leading days
    const remainingCells = 42 - days.length
    for (let day = 1; day <= remainingCells; day++) {
      days.push(new Date(year, month + 1, day))
    }
    
    return days
  }, [viewDate])

  // Generate year range for year picker
  const yearRange = useMemo(() => {
    const currentYear = viewDate.getFullYear()
    const startYear = Math.floor(currentYear / 12) * 12
    return Array.from({ length: 12 }, (_, i) => startYear + i)
  }, [viewDate])

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
    setViewDate(date)
    const newDate = new Date(date)
    newDate.setHours(selectedHour, selectedMinute, 0, 0)
    onChange(newDate.toISOString())
    setViewMode('calendar')
  }, [selectedHour, selectedMinute, onChange])

  const handleMonthSelect = useCallback((monthIndex: number) => {
    const newDate = new Date(viewDate)
    newDate.setMonth(monthIndex)
    setViewDate(newDate)
    setViewMode('calendar')
  }, [viewDate])

  const handleYearSelect = useCallback((year: number) => {
    const newDate = new Date(viewDate)
    newDate.setFullYear(year)
    setViewDate(newDate)
    setViewMode('month')
  }, [viewDate])

  const handleTimeChange = useCallback((hour: number, minute: number) => {
    setSelectedHour(hour)
    setSelectedMinute(minute)
    setHourInput(hour.toString().padStart(2, '0'))
    setMinuteInput(minute.toString().padStart(2, '0'))
    
    // Use selectedDate or create new date with today
    const dateToUse = selectedDate || new Date()
    const newDate = new Date(dateToUse)
    newDate.setHours(hour, minute, 0, 0)
    
    // Update selectedDate if it was null
    if (!selectedDate) {
      setSelectedDate(newDate)
      setViewDate(newDate)
    }
    
    onChange(newDate.toISOString())
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

  const previousYearRange = useCallback(() => {
    setViewDate(prev => {
      const newDate = new Date(prev)
      newDate.setFullYear(newDate.getFullYear() - 12)
      return newDate
    })
  }, [])

  const nextYearRange = useCallback(() => {
    setViewDate(prev => {
      const newDate = new Date(prev)
      newDate.setFullYear(newDate.getFullYear() + 12)
      return newDate
    })
  }, [])

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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <div className="flex items-center gap-2">
        {label && (
          <label className={`text-xs font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            {label}
          </label>
        )}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium 
            transition-all min-w-[280px] justify-between
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isDark
              ? 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20'
              : 'bg-black/5 text-black border border-black/10 hover:bg-black/10 hover:border-black/20'
            }
          `}
        >
          <span className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4" />
            <span>{formatDisplayValue()}</span>
          </span>
          {selectedDate && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation()
                clearDate()
              }}
              className={`p-1 rounded-lg transition-colors ${
                isDark ? 'hover:bg-white/20' : 'hover:bg-black/20'
              }`}
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
            absolute top-full left-0 mt-2 z-50 rounded-xl shadow-2xl overflow-hidden
            ${isDark 
              ? 'bg-[#1c1c1e] border border-white/10' 
              : 'bg-white border border-black/10'
            }
          `}
          style={{ width: '240px' }}
        >
          {/* Header */}
          <div className={`px-2 py-1.5 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <div className="flex items-center justify-between">
              <button
                onClick={viewMode === 'calendar' ? previousMonth : previousYearRange}
                className={`p-0.5 rounded-md transition-colors ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                }`}
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setViewMode(viewMode === 'month' ? 'calendar' : 'month')}
                  className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md transition-colors flex items-center gap-0.5 ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                  }`}
                >
                  {viewMode === 'calendar' ? MONTHS[viewDate.getMonth()] : 'თვე'}
                  {viewMode === 'calendar' && <ChevronDown className="h-2.5 w-2.5" />}
                </button>
                <button
                  onClick={() => setViewMode(viewMode === 'year' ? 'calendar' : 'year')}
                  className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md transition-colors flex items-center gap-0.5 ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                  }`}
                >
                  {viewMode === 'year' 
                    ? `${yearRange[0]}-${yearRange[11]}` 
                    : viewDate.getFullYear()
                  }
                  {viewMode !== 'year' && <ChevronDown className="h-2.5 w-2.5" />}
                </button>
              </div>
              
              <button
                onClick={viewMode === 'calendar' ? nextMonth : nextYearRange}
                className={`p-0.5 rounded-md transition-colors ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                }`}
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-2">
            {viewMode === 'calendar' && (
              <>
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                  {WEEKDAYS.map(day => (
                    <div
                      key={day}
                      className={`text-center text-[9px] font-medium py-0.5 ${
                        isDark ? 'text-white/50' : 'text-black/50'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-0.5">
                  {calendarDays.map((day) => {
                    if (!day) return null

                    const isSelected = isSameDay(day, selectedDate)
                    const isTodayDate = isToday(day)
                    const inCurrentMonth = isCurrentMonth(day)

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => handleDateSelect(day)}
                        className={`
                          aspect-square text-[11px] font-medium rounded-md transition-all
                          ${isSelected
                            ? 'bg-blue-500 text-white'
                            : isTodayDate
                            ? isDark
                              ? 'bg-white/10 text-white border border-white/20'
                              : 'bg-black/10 text-black border border-black/20'
                            : inCurrentMonth
                            ? isDark
                              ? 'hover:bg-white/10 text-white'
                              : 'hover:bg-black/10 text-black'
                            : isDark
                            ? 'text-white/30 hover:bg-white/5'
                            : 'text-black/30 hover:bg-black/5'
                          }
                        `}
                      >
                        {day.getDate()}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {viewMode === 'month' && (
              <div className="grid grid-cols-3 gap-1">
                {MONTHS.map((month, index) => {
                  const isCurrentMonth = index === viewDate.getMonth()
                  return (
                    <button
                      key={month}
                      onClick={() => handleMonthSelect(index)}
                      className={`
                        py-1.5 text-[10px] font-medium rounded-md transition-all
                        ${isCurrentMonth
                          ? 'bg-blue-500 text-white'
                          : isDark
                          ? 'hover:bg-white/10 text-white'
                          : 'hover:bg-black/10 text-black'
                        }
                      `}
                    >
                      {month}
                    </button>
                  )
                })}
              </div>
            )}

            {viewMode === 'year' && (
              <div className="grid grid-cols-3 gap-1">
                {yearRange.map((year) => {
                  const isCurrentYear = year === viewDate.getFullYear()
                  return (
                    <button
                      key={year}
                      onClick={() => handleYearSelect(year)}
                      className={`
                        py-1.5 text-[10px] font-medium rounded-md transition-all
                        ${isCurrentYear
                          ? 'bg-blue-500 text-white'
                          : isDark
                          ? 'hover:bg-white/10 text-white'
                          : 'hover:bg-black/10 text-black'
                        }
                      `}
                    >
                      {year}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Time Picker */}
          {viewMode === 'calendar' && (
            <div className={`px-2 py-2 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              <div className="flex items-center justify-center gap-1">
                {/* Hour */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleTimeChange(selectedHour === 0 ? 23 : selectedHour - 1, selectedMinute)}
                    className={`p-1 rounded-md transition-colors ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                    }`}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={hourInput}
                    onChange={(e) => {
                      const input = e.target.value.replace(/\D/g, '')
                      setHourInput(input)
                      if (input === '') return
                      const val = parseInt(input)
                      if (!isNaN(val) && val <= 23) {
                        setSelectedHour(val)
                        if (selectedDate) {
                          const newDate = new Date(selectedDate)
                          newDate.setHours(val, selectedMinute, 0, 0)
                          onChange(newDate.toISOString())
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        const newHour = selectedHour === 23 ? 0 : selectedHour + 1
                        handleTimeChange(newHour, selectedMinute)
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        const newHour = selectedHour === 0 ? 23 : selectedHour - 1
                        handleTimeChange(newHour, selectedMinute)
                      }
                    }}
                    onClick={(e) => {
                      const input = e.target as HTMLInputElement
                      input.select()
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value)
                      if (isNaN(val) || val < 0 || val > 23) {
                        handleTimeChange(0, selectedMinute)
                      } else {
                        handleTimeChange(val, selectedMinute)
                      }
                    }}
                    className={`
                      w-12 px-2 py-1.5 text-center text-base font-semibold rounded-md border transition-all
                      ${isDark
                        ? 'bg-[#2c2c2e] border-white/10 text-white focus:border-blue-500'
                        : 'bg-[#f2f2f7] border-black/10 text-black focus:border-blue-500'
                      }
                      focus:outline-none focus:ring-1 focus:ring-blue-500
                    `}
                    maxLength={2}
                    placeholder="00"
                  />
                  <button
                    type="button"
                    onClick={() => handleTimeChange(selectedHour === 23 ? 0 : selectedHour + 1, selectedMinute)}
                    className={`p-1 rounded-md transition-colors ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                    }`}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                
                <span className={`text-lg font-bold ${isDark ? 'text-white/50' : 'text-black/50'}`}>:</span>
                
                {/* Minute */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleTimeChange(selectedHour, selectedMinute === 0 ? 59 : selectedMinute - 1)}
                    className={`p-1 rounded-md transition-colors ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                    }`}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={minuteInput}
                    onChange={(e) => {
                      const input = e.target.value.replace(/\D/g, '')
                      setMinuteInput(input)
                      if (input === '') return
                      const val = parseInt(input)
                      if (!isNaN(val) && val <= 59) {
                        setSelectedMinute(val)
                        if (selectedDate) {
                          const newDate = new Date(selectedDate)
                          newDate.setHours(selectedHour, val, 0, 0)
                          onChange(newDate.toISOString())
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        const newMin = selectedMinute === 59 ? 0 : selectedMinute + 1
                        handleTimeChange(selectedHour, newMin)
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        const newMin = selectedMinute === 0 ? 59 : selectedMinute - 1
                        handleTimeChange(selectedHour, newMin)
                      } else if (e.key === 'Enter') {
                        e.preventDefault()
                        setIsOpen(false)
                      }
                    }}
                    onClick={(e) => {
                      const input = e.target as HTMLInputElement
                      input.select()
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value)
                      if (isNaN(val) || val < 0 || val > 59) {
                        handleTimeChange(selectedHour, 0)
                      } else {
                        handleTimeChange(selectedHour, val)
                      }
                    }}
                    className={`
                      w-12 px-2 py-1.5 text-center text-base font-semibold rounded-md border transition-all
                      ${isDark
                        ? 'bg-[#2c2c2e] border-white/10 text-white focus:border-blue-500'
                        : 'bg-[#f2f2f7] border-black/10 text-black focus:border-blue-500'
                      }
                      focus:outline-none focus:ring-1 focus:ring-blue-500
                    `}
                    maxLength={2}
                    placeholder="00"
                  />
                  <button
                    type="button"
                    onClick={() => handleTimeChange(selectedHour, selectedMinute === 59 ? 0 : selectedMinute + 1)}
                    className={`p-1 rounded-md transition-colors ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                    }`}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
              
              {/* Quick minute presets */}
              <div className="flex items-center justify-center gap-1 mt-2">
                {[0, 15, 30, 45].map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => handleTimeChange(selectedHour, min)}
                    className={`
                      px-2 py-0.5 text-[10px] font-medium rounded-md transition-all
                      ${selectedMinute === min
                        ? 'bg-blue-500 text-white'
                        : isDark
                        ? 'bg-white/5 text-white/70 hover:bg-white/10'
                        : 'bg-black/5 text-black/70 hover:bg-black/10'
                      }
                    `}
                  >
                    :{min.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
