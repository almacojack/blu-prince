import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Clock, MapPin, Calendar, Compass, ChevronLeft, ChevronRight, Settings2 } from "lucide-react";

export interface SpacetimeValue {
  datetime: Date;
  timezone: string;
  location?: {
    lat: number;
    lng: number;
    name?: string;
  };
}

interface SpacetimePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: SpacetimeValue;
  onSelect: (value: SpacetimeValue) => void;
  showLocation?: boolean;
  allowPast?: boolean;
  allowFuture?: boolean;
  theme?: "steampunk" | "cyberpunk" | "minimal" | "artsy";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function SpacetimePicker({
  open,
  onOpenChange,
  value,
  onSelect,
  showLocation = true,
  allowPast = true,
  allowFuture = true,
  theme = "steampunk"
}: SpacetimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(value?.datetime || new Date());
  const [selectedHour, setSelectedHour] = useState(value?.datetime?.getHours() || 12);
  const [selectedMinute, setSelectedMinute] = useState(value?.datetime?.getMinutes() || 0);
  const [timezone, setTimezone] = useState(value?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [location, setLocation] = useState(value?.location);
  const [viewMode, setViewMode] = useState<"date" | "time" | "location">("date");
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const themeStyles = {
    steampunk: {
      bg: "bg-gradient-to-br from-amber-950 via-amber-900 to-yellow-900",
      accent: "text-amber-400",
      border: "border-amber-600/50",
      button: "bg-amber-800/50 hover:bg-amber-700/50 border-amber-600",
      glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
      dial: "bg-gradient-to-br from-amber-800 to-amber-950 border-2 border-amber-600",
      gear: "text-amber-500/30"
    },
    cyberpunk: {
      bg: "bg-gradient-to-br from-purple-950 via-slate-900 to-cyan-950",
      accent: "text-cyan-400",
      border: "border-cyan-500/50",
      button: "bg-cyan-900/50 hover:bg-cyan-800/50 border-cyan-500",
      glow: "shadow-[0_0_15px_rgba(6,182,212,0.3)]",
      dial: "bg-gradient-to-br from-slate-800 to-slate-950 border-2 border-cyan-500",
      gear: "text-cyan-500/20"
    },
    minimal: {
      bg: "bg-slate-900",
      accent: "text-white",
      border: "border-slate-700",
      button: "bg-slate-800 hover:bg-slate-700 border-slate-600",
      glow: "",
      dial: "bg-slate-800 border border-slate-700",
      gear: "text-slate-700"
    },
    artsy: {
      bg: "bg-gradient-to-br from-stone-100 via-rose-50 to-amber-50",
      accent: "text-rose-600",
      border: "border-stone-300",
      button: "bg-white hover:bg-rose-50 border-rose-300 text-rose-700",
      glow: "shadow-md",
      dial: "bg-white border-2 border-rose-300 shadow-inner",
      gear: "text-rose-200"
    }
  };

  const styles = themeStyles[theme];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleConfirm = () => {
    const datetime = new Date(selectedDate);
    datetime.setHours(selectedHour, selectedMinute, 0, 0);
    
    onSelect({
      datetime,
      timezone,
      location
    });
    onOpenChange(false);
  };

  const navigateMonth = (delta: number) => {
    let newMonth = viewMonth + delta;
    let newYear = viewYear;
    
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    
    setViewMonth(newMonth);
    setViewYear(newYear);
  };

  const selectDay = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day);
    const now = new Date();
    
    if (!allowPast && newDate < now) return;
    if (!allowFuture && newDate > now) return;
    
    setSelectedDate(newDate);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const days = [];
    const now = new Date();
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10" />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day);
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const isToday = now.toDateString() === date.toDateString();
      const isPast = date < now && !allowPast;
      const isFuture = date > now && !allowFuture;
      const isDisabled = isPast || isFuture;
      
      days.push(
        <motion.button
          key={day}
          whileHover={!isDisabled ? { scale: 1.1 } : {}}
          whileTap={!isDisabled ? { scale: 0.95 } : {}}
          onClick={() => !isDisabled && selectDay(day)}
          disabled={isDisabled}
          data-testid={`day-${day}`}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
            transition-all duration-200 min-h-[44px] min-w-[44px]
            ${isSelected ? `${styles.button} ${styles.glow} ${styles.accent}` : ""}
            ${isToday && !isSelected ? `ring-2 ring-offset-2 ring-offset-transparent ${styles.border}` : ""}
            ${isDisabled ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10 cursor-pointer"}
          `}
        >
          {day}
        </motion.button>
      );
    }
    
    return days;
  };

  const GearDecoration = () => (
    <svg 
      className={`absolute ${styles.gear} pointer-events-none`}
      viewBox="0 0 100 100"
      style={{ width: "120px", height: "120px", right: "-20px", bottom: "-20px" }}
    >
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "center" }}
      >
        <path d="M50 15 L53 25 L60 20 L58 30 L68 28 L63 37 L73 38 L66 45 L75 50 L66 55 L73 62 L63 63 L68 72 L58 70 L60 80 L53 75 L50 85 L47 75 L40 80 L42 70 L32 72 L37 63 L27 62 L34 55 L25 50 L34 45 L27 38 L37 37 L32 28 L42 30 L40 20 L47 25 Z" 
          fill="currentColor" 
          stroke="currentColor" 
          strokeWidth="1"
        />
        <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="2" />
      </motion.g>
    </svg>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${styles.bg} ${styles.border} border-2 p-0 overflow-hidden max-w-md ${styles.glow}`}
        data-testid="spacetime-picker-dialog"
      >
        <div className="relative">
          {theme === "steampunk" && <GearDecoration />}
          
          <DialogHeader className={`p-4 border-b ${styles.border}`}>
            <DialogTitle className={`${styles.accent} flex items-center gap-2 font-mono`}>
              <Compass className="w-5 h-5" />
              Spacetime Navigator
            </DialogTitle>
          </DialogHeader>

          <div className={`flex border-b ${styles.border}`}>
            {[
              { id: "date", icon: Calendar, label: "Date" },
              { id: "time", icon: Clock, label: "Time" },
              ...(showLocation ? [{ id: "location", icon: MapPin, label: "Location" }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as any)}
                data-testid={`tab-${tab.id}`}
                className={`
                  flex-1 py-3 px-4 flex items-center justify-center gap-2
                  transition-all duration-200 min-h-[44px]
                  ${viewMode === tab.id 
                    ? `${styles.button} ${styles.accent}` 
                    : "text-white/60 hover:text-white hover:bg-white/5"}
                `}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-4 min-h-[300px]">
            <AnimatePresence mode="wait">
              {viewMode === "date" && (
                <motion.div
                  key="date"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateMonth(-1)}
                      className={`${styles.accent} min-h-[44px] min-w-[44px]`}
                      data-testid="prev-month"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <span className={`${styles.accent} font-mono text-lg`}>
                      {MONTHS[viewMonth]} {viewYear}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateMonth(1)}
                      className={`${styles.accent} min-h-[44px] min-w-[44px]`}
                      data-testid="next-month"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {DAYS.map(day => (
                      <div key={day} className="w-10 h-8 flex items-center justify-center text-xs text-white/50">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {renderCalendar()}
                  </div>
                </motion.div>
              )}

              {viewMode === "time" && (
                <motion.div
                  key="time"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className={`${styles.dial} rounded-full w-48 h-48 flex items-center justify-center relative`}>
                    <motion.div
                      className={`absolute w-1 h-16 ${styles.accent} rounded-full origin-bottom`}
                      style={{ bottom: "50%", transformOrigin: "bottom center" }}
                      animate={{ rotate: (selectedHour % 12) * 30 + selectedMinute * 0.5 }}
                    />
                    <motion.div
                      className="absolute w-0.5 h-20 bg-white/80 rounded-full origin-bottom"
                      style={{ bottom: "50%", transformOrigin: "bottom center" }}
                      animate={{ rotate: selectedMinute * 6 }}
                    />
                    <div className={`w-3 h-3 rounded-full ${styles.accent} bg-current z-10`} />
                    
                    {[12, 3, 6, 9].map((num, i) => (
                      <span 
                        key={num}
                        className={`absolute ${styles.accent} font-mono text-sm`}
                        style={{
                          top: i === 0 ? "10%" : i === 2 ? "auto" : "50%",
                          bottom: i === 2 ? "10%" : "auto",
                          left: i === 3 ? "10%" : i === 1 ? "auto" : "50%",
                          right: i === 1 ? "10%" : "auto",
                          transform: i === 0 || i === 2 ? "translateX(-50%)" : "translateY(-50%)"
                        }}
                      >
                        {num}
                      </span>
                    ))}
                  </div>

                  <div className="w-full space-y-4">
                    <div>
                      <label className="text-white/60 text-sm mb-2 block">Hour: {selectedHour.toString().padStart(2, "0")}</label>
                      <Slider
                        value={[selectedHour]}
                        onValueChange={([v]) => setSelectedHour(v)}
                        min={0}
                        max={23}
                        step={1}
                        className="w-full"
                        data-testid="hour-slider"
                      />
                    </div>
                    <div>
                      <label className="text-white/60 text-sm mb-2 block">Minute: {selectedMinute.toString().padStart(2, "0")}</label>
                      <Slider
                        value={[selectedMinute]}
                        onValueChange={([v]) => setSelectedMinute(v)}
                        min={0}
                        max={59}
                        step={1}
                        className="w-full"
                        data-testid="minute-slider"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {viewMode === "location" && showLocation && (
                <motion.div
                  key="location"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className={`${styles.dial} rounded-lg h-48 flex items-center justify-center`}>
                    <div className="text-center text-white/60">
                      <MapPin className={`w-8 h-8 mx-auto mb-2 ${styles.accent}`} />
                      <p className="text-sm">Leaflet map integration</p>
                      <p className="text-xs mt-1">Click to set location</p>
                      {location && (
                        <p className={`text-xs mt-2 ${styles.accent}`}>
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    className={`w-full ${styles.button} ${styles.accent} min-h-[44px]`}
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((pos) => {
                          setLocation({
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            name: "Current Location"
                          });
                        });
                      }
                    }}
                    data-testid="use-current-location"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Use Current Location
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={`p-4 border-t ${styles.border} flex justify-between items-center`}>
            <div className="text-sm text-white/60 font-mono">
              {selectedDate.toLocaleDateString()} {selectedHour.toString().padStart(2, "0")}:{selectedMinute.toString().padStart(2, "0")}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-white/60 min-h-[44px]"
                data-testid="cancel-spacetime"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className={`${styles.button} ${styles.accent} min-h-[44px]`}
                data-testid="confirm-spacetime"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
