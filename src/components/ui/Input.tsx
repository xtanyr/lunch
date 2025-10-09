import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  id: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, id, className, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-black mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black transition ${className || ''}`}
        ref={ref}
        {...props}
      />
    </div>
  );
});
Input.displayName = 'Input';

export default Input;
