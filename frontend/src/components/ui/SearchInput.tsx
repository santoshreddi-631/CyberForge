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
        <div className="absolute left-4 flex items-center pointer-events-none text-[#837FA8]">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#6035E8]" />
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
          className="w-full h-12 pl-11 pr-11 bg-[#F6F4FE] hover:bg-white focus:bg-white text-[#171638] placeholder:text-[#837FA8] text-sm rounded-full border border-[#EAE6FD] hover:border-[#6035E8]/40 focus:border-[#6035E8] focus:ring-4 focus:ring-[#6035E8]/10 outline-none transition-all shadow-sm"
          {...props}
        />

        {currentValue.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 p-1 rounded-full text-[#837FA8] hover:text-[#171638] hover:bg-[#F0EDFF] transition-colors focus:outline-none cursor-pointer"
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
