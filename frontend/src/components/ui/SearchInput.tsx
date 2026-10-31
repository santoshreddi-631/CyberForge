"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Search, X, Loader2 } from "lucide-react";

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onSubmit"> {
  onSearchSubmit?: (query: string) => void;
  onClear?: () => void;
  isLoading?: boolean;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      value,
      onChange,
      onSearchSubmit,
      onClear,
      isLoading = false,
      placeholder = "Search phone number, UPI ID, bank account, or URL...",
      ...props
    },
    ref
  ) => {
    const [internalVal, setInternalVal] = useState("");
    const isControlled = value !== undefined;
    const currentValue = isControlled ? String(value) : internalVal;

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalVal(e.target.value);
      }
      onChange?.(e);
    };

    const handleClear = () => {
      if (!isControlled) {
        setInternalVal("");
      }
      onClear?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && onSearchSubmit) {
        e.preventDefault();
        onSearchSubmit(currentValue);
      }
    };

    return (
      <div className={cn("relative flex items-center w-full", className)}>
        <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          ref={ref}
          type="text"
          value={currentValue}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-11 pl-10 pr-10 bg-slate-900/90 hover:bg-slate-900 focus:bg-slate-900 text-slate-100 placeholder:text-slate-400 text-sm rounded-lg border border-slate-700/80 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 outline-none transition-colors"
          {...props}
        />

        {currentValue.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors focus:outline-none"
            title="Clear search"
            aria-label="Clear search input"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
