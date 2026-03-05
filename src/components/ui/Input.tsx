import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  id: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, id, className, style, ...props }, ref) => {
  const { palette } = useTheme();
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium mb-1" style={{ color: palette.colors.text }}>
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition ${className || ''}`}
        style={{ 
          borderColor: palette.colors.border, 
          backgroundColor: palette.colors.cardBg, 
          color: palette.colors.text,
          ...style 
        }}
        ref={ref}
        {...props}
      />
    </div>
  );
});
Input.displayName = 'Input';

export default Input;
