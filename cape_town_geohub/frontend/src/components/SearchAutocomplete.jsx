import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, MapPin, Building, Trees, Bus, X, Loader } from 'lucide-react';
import { apiClient } from '../api-client';
import '../styles/SearchAutocomplete.css';

/**
 * SearchAutocomplete - Enhanced search bar with autocomplete suggestions
 *
 * Features:
 * - Debounced API calls
 * - Keyboard navigation
 * - Category icons
 * - Recent searches
 */
export default function SearchAutocomplete({ onSelect, placeholder = "Search places, suburbs, facilities..." }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);

  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('geohub-recent-searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not load recent searches');
    }
  }, []);

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (searchQuery) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/geocode/autocomplete?q=${encodeURIComponent(searchQuery)}&limit=8`);
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
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 200);
  };

  // Handle suggestion selection
  const handleSelect = (suggestion) => {
    // Save to recent searches
    const newRecent = [
      suggestion,
      ...recentSearches.filter(r => r.text !== suggestion.text)
    ].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('geohub-recent-searches', JSON.stringify(newRecent));

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
  const handleKeyDown = (e) => {
    const items = suggestions.length > 0 ? suggestions : recentSearches;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
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
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get icon for suggestion type
  const getTypeIcon = (type) => {
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
          aria-controls="search-suggestions"
          aria-expanded={isOpen && displayItems.length > 0}
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
          id="search-suggestions"
          className="search-suggestions"
          role="listbox"
        >
          {query.length === 0 && recentSearches.length > 0 && (
            <li className="suggestions-header">Recent Searches</li>
          )}
          {displayItems.map((item, index) => (
            <li
              key={`${item.text}-${index}`}
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
