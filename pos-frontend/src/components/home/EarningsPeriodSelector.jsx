import React, { useState } from 'react';
import { FaCalendarAlt, FaClock, FaCalendarWeek, FaCalendar, FaInfinity } from 'react-icons/fa';

const EarningsPeriodSelector = ({ currentPeriod, onPeriodChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const periods = [
    { id: 'daily', label: 'Diaria', icon: <FaCalendarAlt className="text-blue-400" /> },
    { id: 'shift', label: 'Jornada', icon: <FaClock className="text-green-400" /> },
    { id: 'weekly', label: 'Semana', icon: <FaCalendarWeek className="text-purple-400" /> },
    { id: 'monthly', label: 'Mes', icon: <FaCalendar className="text-orange-400" /> },
    { id: 'yearly', label: 'Año', icon: <FaCalendar className="text-red-400" /> },
    { id: 'all', label: 'Todo el tiempo', icon: <FaInfinity className="text-gray-400" /> }
  ];

  const currentPeriodData = periods.find(p => p.id === currentPeriod) || periods[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#1f1f1f] text-[#f5f5f5] text-sm rounded-lg px-3 py-2 outline-none border border-[#333] hover:border-[#f6b100] transition-colors"
      >
        {currentPeriodData.icon}
        <span>{currentPeriodData.label}</span>
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-[#1f1f1f] border border-[#333] rounded-lg shadow-lg z-10 min-w-[180px]">
          <div className="py-2">
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => {
                  onPeriodChange(period.id);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-[#f5f5f5] hover:bg-[#333] transition-colors ${
                  currentPeriod === period.id ? 'bg-[#333] text-[#f6b100]' : ''
                }`}
              >
                {period.icon}
                <span>{period.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EarningsPeriodSelector;