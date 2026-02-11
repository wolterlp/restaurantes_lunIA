import React, { useState, useEffect } from 'react';

const SpanishDateInput = ({ value, onChange, placeholder, label }) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (value && !isFocused) {
      // Format date as dd/mm/yyyy for display
      const date = new Date(value);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      setDisplayValue(`${day}/${month}/${year}`);
    } else if (!value) {
      setDisplayValue('');
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    // Show ISO format for editing
    if (value) {
      setDisplayValue(value);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format back to dd/mm/yyyy
    if (value) {
      const date = new Date(value);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      setDisplayValue(`${day}/${month}/${year}`);
    }
  };

  const handleChange = (e) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    
    // Handle dd/mm/yyyy format input
    if (inputValue.includes('/')) {
      const parts = inputValue.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        if (day && month && year && year.length === 4) {
          const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          onChange({ target: { value: isoDate } });
          return;
        }
      }
    }
    
    // Handle ISO format (yyyy-mm-dd)
    if (inputValue.includes('-') && inputValue.length === 10) {
      onChange({ target: { value: inputValue } });
    }
  };

  return (
    <div className="flex flex-col">
      {label && (
        <label className="text-xs text-gray-500 mb-1">
          {label} (dd/mm/aaaa)
        </label>
      )}
      <input
        type="text"
        className="bg-transparent text-sm text-gray-300 outline-none"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder || "dd/mm/aaaa"}
      />
    </div>
  );
};

export default SpanishDateInput;