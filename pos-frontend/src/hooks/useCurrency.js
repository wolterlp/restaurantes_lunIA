import { useTheme } from "../context/ThemeContext";
import { formatCurrency as format } from "../utils/currency";

export const useCurrency = () => {
    const { theme } = useTheme();
    
    // Default config if theme is not loaded yet
    const config = {
        symbol: theme?.customization?.currencySymbol || "$",
        thousandsSeparator: theme?.customization?.thousandsSeparator || ".",
        decimalSeparator: theme?.customization?.decimalSeparator || ",",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    };

    const formatCurrency = (value) => {
        return format(value, config);
    }

    return { formatCurrency };
};
