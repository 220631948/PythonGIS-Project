import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Building, Trees, Bus, X, Loader } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useLocalStorage } from '../hooks/useLocalStorage';
// import { apiClient } from '../api-client'; // Commented out as it might not be TS yet or used directly
import '../styles/SearchAutocomplete.css';

interface SearchResult {
  text: string;
  name?: string;
  lat: number;
  lon: number;
  type: string;
  [key: string]: any;
}

interface SearchAutocompleteProps {
  onSelect?: (location: { name: string; lat: number; lng: number; type: string }) => void;
  placeholder?: string;
}

/**
 * SearchAutocomplete - Enhanced search bar with autocomplete suggestions
 *
 * Features:
 * - Debounced API calls
 * - Keyboard navigation
 * - Category icons
 * - Recent searches
 */
export default function SearchAutocomplete({ onSelect, placeholder = "Search places, suburbs, facilities..." }: SearchAutocompleteProps) {
  // State
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Custom hooks
  const debouncedQuery = useDebounce(query, 300);
  const [recentSearches, setRecentSearches] = useLocalStorage<SearchResult[]>('geohub-recent-searches', []);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/geocode/autocomplete?q=${encodeURIComponent(debouncedQuery)}&limit=8`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Autocomplete failed:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  };

  // Handle suggestion selection
  const handleSelect = (suggestion: SearchResult) => {
    // Save to recent searches (hooks handles persistence)
    const newRecent = [
      suggestion,
      ...recentSearches.filter(r => r.text !== suggestion.text)
    ].slice(0, 5);
    setRecentSearches(newRecent);

    // Clear and close
    setQuery(suggestion.text);
    setIsOpen(false);
    setSuggestions([]);


    // Notify parent
    if (onSelect) {
      onSelect({
        name: suggestion.text,
        lat: suggestion.lat,
        lng: suggestion.lon,
        type: suggestion.type
      });
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = suggestions.length > 0 ? suggestions : recentSearches;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          handleSelect(items[selectedIndex]);
        } else if (query.length >= 2) {
          // Perform full search
          performFullSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  // Perform full search (not just autocomplete)
  const performFullSearch = async () => {
    if (query.length < 2) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const first = data.results[0];
          handleSelect({
            text: first.name,
            lat: first.lat,
            lon: first.lon,
            type: first.type
          });
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get icon for suggestion type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'suburb':
        return <Building size={16} />;
      case 'park':
        return <Trees size={16} />;
      case 'bus_stop':
      case 'transit':
        return <Bus size={16} />;
      default:
        return <MapPin size={16} />;
    }
  };

  const displayItems = suggestions.length > 0 ? suggestions :
    (query.length === 0 && recentSearches.length > 0 ? recentSearches : []);
  const listboxId = 'search-suggestions';
  const activeOptionId =
    selectedIndex >= 0 && selectedIndex < displayItems.length
      ? `${listboxId}-option-${selectedIndex}`
      : undefined;

  return (
    <div className="search-autocomplete" ref={containerRef}>
      <div className="search-input-wrapper">
        <Search className="search-icon" size={18} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-input"
          aria-label="Search"
          aria-autocomplete="list"
          aria-controls={isOpen && displayItems.length > 0 ? listboxId : undefined}
          aria-expanded={isOpen && displayItems.length > 0}
          aria-haspopup="listbox"
          role="combobox"
          aria-activedescendant={isOpen && activeOptionId ? activeOptionId : undefined}
        />
        {isLoading && <Loader className="search-loader" size={16} />}
        {query && (
          <button
            className="search-clear"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && displayItems.length > 0 && (
        <ul
          id={listboxId}
          className="search-suggestions"
          role="listbox"
        >
          {query.length === 0 && recentSearches.length > 0 && (
            <li className="suggestions-header">Recent Searches</li>
          )}
          {displayItems.map((item, index) => (
            <li
              key={`${item.text}-${index}`}
              id={`${listboxId}-option-${index}`}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <span className="suggestion-icon">{getTypeIcon(item.type)}</span>
              <span className="suggestion-text">{item.text}</span>
              <span className="suggestion-type">{item.type}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
