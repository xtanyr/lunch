import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  ...props
}) => {
  const { palette } = useTheme();
  
  const baseStyles = "font-semibold rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors duration-150 ease-in-out inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: `hover:opacity-90 text-white focus:ring-[${palette.colors.primary}]`,
    secondary: `hover:opacity-80 border focus:ring-[${palette.colors.primary}]`,
    danger: `hover:opacity-90 text-white focus:ring-red-500`,
    ghost: "bg-transparent hover:bg-opacity-10 focus:ring-[${palette.colors.primary}]",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: palette.colors.primary, color: 'white' };
      case 'secondary':
        return { backgroundColor: palette.colors.cardBg, color: palette.colors.text, borderColor: palette.colors.border };
      case 'danger':
        return { backgroundColor: '#dc2626', color: 'white' };
      case 'ghost':
        return { backgroundColor: 'transparent', color: palette.colors.text };
      default:
        return { backgroundColor: palette.colors.primary, color: 'white' };
    }
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${className}`}
      style={getVariantStyles()}
      {...props}
    >
      {leftIcon && <span className={`mr-2 -ml-1 ${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`}>{leftIcon}</span>}
      {children}
      {rightIcon && <span className={`ml-2 -mr-1 ${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`}>{rightIcon}</span>}
    </button>
  );
};

export default Button;
