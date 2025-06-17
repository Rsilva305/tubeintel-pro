import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

const SelectContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  toggleOpen: () => void;
  closeSelect: () => void;
}>({
  value: '',
  onValueChange: () => {},
  isOpen: false,
  toggleOpen: () => {},
  closeSelect: () => {},
});

export const Select: React.FC<SelectProps> = ({ 
  children, 
  value, 
  onValueChange, 
  defaultValue = '' 
}) => {
  const [internalValue, setInternalValue] = useState(value || defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
    setIsOpen(false);
  };

  const toggleOpen = () => setIsOpen(!isOpen);
  const closeSelect = () => setIsOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        closeSelect();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider value={{
      value: internalValue,
      onValueChange: handleValueChange,
      isOpen,
      toggleOpen,
      closeSelect,
    }}>
      <div ref={selectRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = '' }) => {
  const { toggleOpen } = React.useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={toggleOpen}
      className={`flex items-center justify-between w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${className}`}
    >
      {children}
      <FaChevronDown className="w-4 h-4 ml-2" />
    </button>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder = '', className = '' }) => {
  const { value } = React.useContext(SelectContext);

  return (
    <span className={`block truncate ${className}`}>
      {value || placeholder}
    </span>
  );
};

export const SelectContent: React.FC<SelectContentProps> = ({ children, className = '' }) => {
  const { isOpen } = React.useContext(SelectContext);

  if (!isOpen) return null;

  return (
    <div className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto dark:bg-gray-800 dark:border-gray-600 ${className}`}>
      {children}
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps> = ({ value, children, className = '' }) => {
  const { onValueChange } = React.useContext(SelectContext);

  return (
    <div
      onClick={() => onValueChange(value)}
      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${className}`}
    >
      {children}
    </div>
  );
}; 