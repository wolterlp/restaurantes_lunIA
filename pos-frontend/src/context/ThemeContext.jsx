import React, { createContext, useContext, useState, useEffect } from "react";
import { getRestaurantConfig } from "../https";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState({
        name: "Mi Restaurante",
        primaryColor: "#ecab0f",
        secondaryColor: "#1f1f1f",
        logo: "",
        backgroundImage: ""
    });

    const refreshTheme = async () => {
        try {
            const res = await getRestaurantConfig();
            if(res.data.success){
                setTheme(res.data.data);
                // Apply CSS variables
                document.documentElement.style.setProperty('--primary-color', res.data.data.primaryColor);
                document.documentElement.style.setProperty('--secondary-color', res.data.data.secondaryColor);
            }
        } catch (error) {
            console.error("Failed to load theme config", error);
        }
    };

    useEffect(() => {
        refreshTheme();
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, refreshTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
