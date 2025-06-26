
import React from 'react';

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
  const baseStyles = "font-semibold rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors duration-150 ease-in-out inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: "bg-[#ff4139] hover:bg-[#e0352f] text-white focus:ring-[#ff4139]",
    secondary: "bg-white hover:bg-neutral-100 text-black border border-neutral-400 focus:ring-[#ff4139]",
    danger: "bg-[#ff4139] hover:bg-[#e0352f] text-white focus:ring-[#ff4139]", // Using primary red for danger
    ghost: "bg-transparent hover:bg-neutral-100 text-black focus:ring-[#ff4139]",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm", // Adjusted padding for a more modern feel
    lg: "px-7 py-3.5 text-base", // Adjusted padding
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {leftIcon && <span className={`mr-2 -ml-1 ${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`}>{leftIcon}</span>}
      {children}
      {rightIcon && <span className={`ml-2 -mr-1 ${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`}>{rightIcon}</span>}
    </button>
  );
};

export default Button;