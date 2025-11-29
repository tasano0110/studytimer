'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { ColorTheme } from '@/types'

export const THEME_COLORS = {
  slate: {
    primary: '#475569',
    primaryLight: 'rgba(71, 85, 105, 0.1)',
    primaryDark: '#334155',
  },
  teal: {
    primary: '#0f766e',
    primaryLight: 'rgba(15, 118, 110, 0.1)',
    primaryDark: '#115e59',
  },
  blue: {
    primary: '#003c68',
    primaryLight: 'rgba(0, 60, 104, 0.1)',
    primaryDark: '#002544',
  },
  pink: {
    primary: '#db2777',
    primaryLight: 'rgba(219, 39, 119, 0.1)',
    primaryDark: '#be185d',
  },
} as const

interface ThemeContextType {
  theme: ColorTheme
  colors: typeof THEME_COLORS[ColorTheme]
  setTheme: (theme: ColorTheme) => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  initialTheme?: ColorTheme
}

export function ThemeProvider({ children, initialTheme = 'slate' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ColorTheme>(initialTheme)
  const [isLoading, setIsLoading] = useState(false)

  const setTheme = async (newTheme: ColorTheme) => {
    setThemeState(newTheme)

    // Save theme to user preferences
    try {
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ color_theme: newTheme }),
      })

      // Silently ignore 401 errors (user not authenticated)
      if (!response.ok && response.status !== 401) {
        const errorData = await response.json()
        console.error('Failed to save theme:', response.statusText, errorData)
      }
    } catch (error) {
      console.error('Failed to save theme:', error)
    }
  }

  const colors = THEME_COLORS[theme]

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme, isLoading }}>
      <style jsx global>{`
        :root {
          --color-primary: ${colors.primary};
          --color-primary-light: ${colors.primaryLight};
          --color-primary-dark: ${colors.primaryDark};
        }
      `}</style>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Utility function to get theme-aware class names
export function getThemeClass(baseClass: string, theme: ColorTheme): string {
  return baseClass.replace(/#003c68/g, THEME_COLORS[theme].primary)
}
