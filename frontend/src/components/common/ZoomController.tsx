import React, { useEffect, useState, useRef } from 'react';
import { ZoomIn, Check, ChevronDown } from 'lucide-react';

const ZOOM_OPTIONS = [
  { value: '0.75', label: '75% (Compact — Lagu taliyey)', desc: 'POS & Dashboard oo dhan hal shaashad' },
  { value: '0.80', label: '80% (Dhexdhexaad)', desc: 'Waqti dheer ku shaqaynta' },
  { value: '0.90', label: '90% (Ballaaran)', desc: 'Qoraallada waaweyn' },
  { value: '1.00', label: '100% (Cabirka Caadiga ah)', desc: 'Cabbirka dabiiciga ah' },
];

export const ZoomController: React.FC = () => {
  const [zoom, setZoom] = useState<string>(() => {
    const saved = localStorage.getItem('maraayn_ui_zoom');
    if (saved) return saved;
    // Default to 75% for desktop screens (width >= 1024)
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return '0.75';
    }
    return '1.00';
  });

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Apply zoom to documentElement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) {
        document.documentElement.style.zoom = zoom;
      } else {
        // Keep mobile at 100% touch friendly
        document.documentElement.style.zoom = '1.00';
      }
      localStorage.setItem('maraayn_ui_zoom', zoom);
    }
  }, [zoom]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = ZOOM_OPTIONS.find((opt) => opt.value === zoom) || ZOOM_OPTIONS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs hover:border-slate-300"
        title="Beddel Cabbirka Shaashadda (Screen Zoom Density)"
      >
        <ZoomIn className="w-3.5 h-3.5 text-brand-navy" />
        <span>{Math.round(parseFloat(zoom) * 100)}%</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-scaleUp text-xs font-sans">
          <div className="px-3 py-1.5 border-b border-slate-100">
            <span className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider block">
              Cabbirka Shaashadda (Zoom)
            </span>
            <span className="text-[10px] text-slate-400">
              U dooro cabbirka kuugu habboon kormeerahaaga
            </span>
          </div>

          <div className="p-1 space-y-0.5">
            {ZOOM_OPTIONS.map((opt) => {
              const isSelected = opt.value === zoom;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setZoom(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'bg-brand-navy text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block font-bold">{opt.label}</span>
                    <span
                      className={`block text-[10px] ${
                        isSelected ? 'text-amber-200' : 'text-slate-400'
                      }`}
                    >
                      {opt.desc}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-amber shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
