import { useState, useCallback } from 'react';
import type { NetworkRequest, HttpMethod, ResourceType } from '../types';

/**
 * Hook for filtering network requests
 */
export const useNetworkFilter = (requests: NetworkRequest[]) => {
  const [searchText, setSearchText] = useState('');
  const [selectedMethods, setSelectedMethods] = useState<HttpMethod[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<ResourceType[]>([]);

  const filteredRequests = useCallback(() => {
    return requests.filter((request) => {
      // Search filter
      if (searchText && !request.url.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }

      // Method filter
      if (selectedMethods.length > 0 && !selectedMethods.includes(request.method)) {
        return false;
      }

      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(request.type)) {
        return false;
      }

      return true;
    });
  }, [requests, searchText, selectedMethods, selectedTypes])();

  return {
    filteredRequests,
    searchText,
    setSearchText,
    selectedMethods,
    setSelectedMethods,
    selectedTypes,
    setSelectedTypes,
  };
};
