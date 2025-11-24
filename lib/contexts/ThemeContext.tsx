'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { ColorTheme } from '@/types'

export const THEME_COLORS = {
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
  colors: typeof THEME_COLORS['blue']
  setTheme: (theme: ColorTheme) => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  initialTheme?: ColorTheme
}

export function ThemeProvider({ children, initialTheme = 'blue' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ColorTheme>(initialTheme)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load theme from user preferences on mount
    const loadTheme = async () => {
      try {
        const response = await fetch('/api/preferences')
        if (response.ok) {
          const data = await response.json()
          if (data.preference?.color_theme) {
            setThemeState(data.preference.color_theme)
          }
        }
      } catch (error) {
        console.error('Failed to load theme:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTheme()
  }, [])

  const setTheme = async (newTheme: ColorTheme) => {
    setThemeState(newTheme)

    // Save theme to user preferences
    try {
      await fetch('/api/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ color_theme: newTheme }),
      })
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
