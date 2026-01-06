import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ initialQuery = "", onSearch }) => {
  const navigate = useNavigate();
  const { shop } = useParams<{ shop?: string }>();
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Static product names for suggestions
  const productNames = [
    "Amul Butter",
    "Aashirvaad Atta",
    "Fortune Sunflower Oil",
    "Britannia Biscuits",
    "Parle-G",
    "Nestle Milkmaid",
    "Dabur Honey",
    "Tata Tea",
    "Saffola Oats",
    "Patanjali Soap"
  ];

  // Handle animation timing
  useEffect(() => {
    // Only animate when input is empty and not focused
    if (query === "" && !isFocused) {
      const interval = setInterval(() => {
        setCurrentSuggestionIndex((prevIndex) => (prevIndex + 1) % productNames.length);
      }, 1500); // Rotate every 1.5 seconds

      return () => clearInterval(interval);
    }
  }, [query, isFocused, productNames.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      if (onSearch) {
        onSearch(trimmedQuery);
      } else {
        // Default navigation behavior
        const base = shop ? `/${shop}/checkout` : "/shop";
        navigate(`${base}?q=${encodeURIComponent(trimmedQuery)}`);
      }
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="" // We'll use animated text instead
            aria-label="Search products"
            className="w-full text-sm sm:text-base pl-4 pr-12 py-2.5 rounded-lg bg-white border border-gray-200 text-black outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition"
          />
          
          {/* Animated placeholder text - "Search for" remains static while product name changes */}
          {query === "" && !isFocused && (
            <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none" aria-hidden="true">
              <span className="text-gray-400">Search for&nbsp;</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentSuggestionIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.6, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-gray-400"
                >
                  {productNames[currentSuggestionIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          )}
          
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-0 top-0 h-full aspect-square rounded-r-lg bg-green-600 text-white hover:bg-green-700 active:scale-[0.99] transition-colors flex items-center justify-center"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;