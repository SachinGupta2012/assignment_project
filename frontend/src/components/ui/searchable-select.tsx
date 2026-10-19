"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

interface SearchableOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label: string;
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
}

export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Search and select",
  emptyMessage = "No matches found",
}: SearchableSelectProps) {
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? options.filter((option) => option.label.toLowerCase().includes(search)) : options;
  }, [options, query]);

  function choose(option: SearchableOption) {
    onChange(option.value);
    setQuery("");
    setOpen(false);
  }

  return (
    <div
      className="field searchable-select"
      ref={rootRef}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label className="field-label" htmlFor={inputId}>{label}</label>
      <div className="searchable-select-input">
        <Icon name="search" size={16} />
        <input
          id={inputId}
          className="input"
          value={open ? query : selected?.label ?? ""}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${inputId}-options`}
          onFocus={() => { setQuery(""); setOpen(true); }}
          onChange={(event) => { setQuery(event.target.value); onChange(""); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "Enter" && open && filteredOptions[0]) {
              event.preventDefault();
              choose(filteredOptions[0]);
            }
          }}
        />
        <Icon name="chevronDown" size={16} />
      </div>
      {open ? (
        <div className="searchable-select-options" id={`${inputId}-options`} role="listbox">
          {filteredOptions.length === 0 ? <span>{emptyMessage}</span> : filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
