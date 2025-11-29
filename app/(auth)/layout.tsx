import { ThemeProvider } from '@/lib/contexts/ThemeContext'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider initialTheme="slate">
      {children}
    </ThemeProvider>
  )
}
