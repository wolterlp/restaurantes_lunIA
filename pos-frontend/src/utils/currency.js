export const formatCurrency = (value, config = {}) => {
  const { 
    symbol = "$", 
    thousandsSeparator = ".", 
    decimalSeparator = ",",
    minimumFractionDigits = 0,
    maximumFractionDigits = 0
  } = config;

  if (value === undefined || value === null) return "";

  const num = Number(value);
  if (isNaN(num)) return value;

  // Rounding logic
  const fixed = num.toFixed(maximumFractionDigits);
  let [integer, fraction] = fixed.split('.');

  // Add thousands separator
  integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

  let result = `${symbol}${integer}`;
  
  // Add decimal part only if needed (based on digits or value)
  // Logic: if maximumFractionDigits > 0, we append.
  // Note: toFixed(0) returns no decimal part.
  
  if (maximumFractionDigits > 0) {
      result += `${decimalSeparator}${fraction}`;
  }

  return result;
};
