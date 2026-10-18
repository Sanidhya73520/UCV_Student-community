import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ChevronDown } from 'lucide-react';

export const Combobox = forwardRef(function Combobox(
  {
    label,
    error,
    helperText,
    options = [], // [{ value: 'ES', label: 'Spain' }]
    value = '',
    onChange,
    placeholder = 'Search your country…',
    required = false,
    disabled = false,
    style = {}
  },
  ref
) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => inputRef.current);

  // Sync display text with selected value
  useEffect(() => {
    const selected = options.find((opt) => opt.value === value);
    if (selected) {
      setQuery(selected.label);
    } else if (!value) {
      setQuery('');
    }
  }, [value, options]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // Reset query to selected label if invalid
        const selected = options.find((opt) => opt.value === value);
        if (selected) {
          setQuery(selected.label);
        } else {
          setQuery('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, options]);

  const filteredOptions = query
    ? options.filter((opt) => opt.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const handleSelect = (opt) => {
    onChange && onChange(opt.value);
    setQuery(opt.label);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < filteredOptions.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        position: 'relative',
        width: '100%',
        ...style
      }}
    >
      {label && (
        <label
          style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--navy)'
          }}
        >
          {label} {required && <span style={{ color: 'var(--red)' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', width: '100%' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          style={{
            width: '100%',
            minHeight: '44px',
            padding: '10px 40px 10px 14px',
            borderRadius: 'var(--radius-md)',
            border: error ? '1.5px solid var(--red)' : '1px solid var(--field-border)',
            backgroundColor: disabled ? 'var(--paper)' : 'var(--white)',
            color: 'var(--navy)',
            fontSize: '0.95rem',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />

        <button
          type="button"
          tabIndex={-1}
          aria-label="Toggle options"
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              inputRef.current?.focus();
            }
          }}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: 0
          }}
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {isOpen && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: '240px',
            overflowY: 'auto',
            backgroundColor: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            listStyle: 'none',
            padding: '4px 0',
            margin: 0
          }}
        >
          {filteredOptions.length === 0 ? (
            <li
              style={{
                padding: '10px 14px',
                color: 'var(--text-muted)',
                fontSize: '0.9rem'
              }}
            >
              No country matches
            </li>
          ) : (
            filteredOptions.map((opt, index) => {
              const isSelected = opt.value === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent input blur
                    handleSelect(opt);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  style={{
                    padding: '10px 14px',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    backgroundColor: isHighlighted
                      ? 'var(--blue-tint)'
                      : isSelected
                      ? 'var(--pink-tint)'
                      : 'transparent',
                    color: 'var(--navy)',
                    fontWeight: isSelected ? 600 : 400
                  }}
                >
                  {opt.label}
                </li>
              );
            })
          )}
        </ul>
      )}

      {error && (
        <p
          role="alert"
          style={{
            fontSize: '0.85rem',
            color: 'var(--red)',
            margin: 0
          }}
        >
          {error}
        </p>
      )}

      {!error && helperText && (
        <p
          style={{
            fontSize: '0.825rem',
            color: 'var(--text-muted)',
            margin: 0
          }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
});
