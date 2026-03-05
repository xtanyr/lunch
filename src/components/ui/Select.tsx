import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

interface SelectOption {
  id: string | number;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  id: string;
  options?: Array<SelectOption | string>;
  value?: string | number;
  onChange?: (value: string) => void;
}

const Select: React.FC<SelectProps> = ({
  label,
  id,
  className = '',
  options,
  value,
  onChange,
  children,
  style,
  ...props
}) => {
  const { palette } = useTheme();
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium mb-1" style={{ color: palette.colors.text }}>
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition ${className}`}
        style={{ 
          borderColor: palette.colors.border, 
          backgroundColor: palette.colors.cardBg, 
          color: palette.colors.text,
          ...style
        }}
        value={value}
        onChange={handleChange}
        {...props}
      >
        {options
          ? options.map((option) => {
              const optionValue = typeof option === 'string' ? option : option.id;
              const optionLabel = typeof option === 'string' ? option : option.label;
              return (
                <option key={String(optionValue)} value={optionValue}>
                  {optionLabel}
                </option>
              );
            })
          : children}
      </select>
    </div>
  );
};

export default Select;
