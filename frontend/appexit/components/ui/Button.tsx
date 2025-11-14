import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  loadingText?: string
  as?: React.ElementType
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loadingText,
    disabled,
    className = '',
    as: Component = 'button',
    children,
    onMouseEnter,
    onMouseLeave,
    style: propsStyle,
    ...props
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed rounded-lg'

    const variantClasses = {
      primary: 'text-white focus:ring-opacity-50 disabled:opacity-50',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 disabled:bg-gray-300 disabled:text-gray-500',
      outline: 'border-2 border-gray-300 text-gray-700 hover:border-gray-400 focus:ring-gray-500 disabled:border-gray-300 disabled:text-gray-500',
      ghost: 'focus:ring-opacity-50 disabled:text-gray-500 disabled:opacity-50'
    }

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg'
    }

    const getStyles = () => {
      if (disabled || isLoading) {
        if (variant === 'primary') {
          return { backgroundColor: '#9CA3AF', color: '#6B7280' }
        }
        if (variant === 'ghost') {
          return { color: '#9CA3AF' }
        }
      }

      if (variant === 'primary') {
        return { backgroundColor: '#4285FF' }
      }
      if (variant === 'ghost') {
        return { color: '#4285FF' }
      }
      return {}
    }

    const getHoverStyles = () => {
      if (variant === 'primary' && !disabled && !isLoading) {
        return {
          ':hover': { backgroundColor: '#3367D6' }
        }
      }
      if (variant === 'ghost' && !disabled && !isLoading) {
        return {
          ':hover': { color: '#3367D6', backgroundColor: '#E8F0FE' }
        }
      }
      return {}
    }

    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
    const inlineStyle = getStyles()

    return (
      <Component
        ref={ref}
        disabled={disabled || isLoading}
        className={classes}
        style={{
          ...inlineStyle,
          ...(variant === 'primary' && !disabled && !isLoading && {
            '--tw-ring-color': '#4285FF'
          }),
          ...propsStyle
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
          if (variant === 'primary' && !disabled && !isLoading) {
            e.currentTarget.style.backgroundColor = '#3367D6'
          }
          if (variant === 'ghost' && !disabled && !isLoading) {
            e.currentTarget.style.color = '#3367D6'
            e.currentTarget.style.backgroundColor = '#E8F0FE'
          }
          onMouseEnter?.(e)
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
          if (variant === 'primary' && !disabled && !isLoading) {
            e.currentTarget.style.backgroundColor = '#4285FF'
          }
          if (variant === 'ghost' && !disabled && !isLoading) {
            e.currentTarget.style.color = '#4285FF'
            e.currentTarget.style.backgroundColor = 'transparent'
          }
          onMouseLeave?.(e)
        }}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Component>
    )
  }
)

Button.displayName = 'Button'

export default Button
