import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  id: string;
}

const Select: React.FC<SelectProps> = ({ label, id, className, children, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-black mb-1">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black transition ${props.className || ''}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export default Select;