/**
 * Reusable search bar component.
 */
import { useState, useRef, useEffect } from 'react';
import { HiOutlineSearch, HiOutlineX } from 'react-icons/hi';

export default function SearchBar({ 
  value = '', 
  onChange, 
  placeholder = 'Search sites, domains, emails...', 
  autoFocus = false,
  size = 'default',
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const sizeClasses = size === 'large' 
    ? 'py-4 px-6 text-lg pl-14' 
    : 'py-2.5 px-4 text-sm pl-10';

  const iconSize = size === 'large' ? 'w-6 h-6 left-4' : 'w-4 h-4 left-3';

  return (
    <div className="relative">
      <HiOutlineSearch 
        className={`absolute top-1/2 -translate-y-1/2 ${iconSize} transition-colors duration-200 ${
          focused ? 'text-brand-blue' : 'text-text-muted'
        }`} 
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={`input ${sizeClasses} pr-10 ${
          focused ? 'border-brand-blue/50 ring-1 ring-brand-blue/20' : ''
        }`}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
        >
          <HiOutlineX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
