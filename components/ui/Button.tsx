import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  fullWidth?: boolean
}

export function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  style = {},
  ...props
}: ButtonProps) {
  const baseStyles =
    'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary: 'text-white hover:brightness-110',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }

  const widthStyles = fullWidth ? 'w-full' : ''

  // primaryバリアントの場合はCSS変数を使用
  const inlineStyle =
    variant === 'primary'
      ? {
          backgroundColor: 'var(--color-primary)',
          ...style,
        }
      : style

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${widthStyles} ${className}`}
      style={inlineStyle}
      {...props}
    >
      {children}
    </button>
  )
}
