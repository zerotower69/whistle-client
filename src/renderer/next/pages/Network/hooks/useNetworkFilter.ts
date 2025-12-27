import { useState, useMemo } from 'react';
import type { NetworkRequest } from '../types';

/**
 * Hook for network filtering
 */
export const useNetworkFilter = (requests: NetworkRequest[]) => {
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      // Search filter
      if (searchText && !request.url.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && request.type !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === '2xx' && (request.statusCode < 200 || request.statusCode >= 300)) {
          return false;
        }
        if (statusFilter === '3xx' && (request.statusCode < 300 || request.statusCode >= 400)) {
          return false;
        }
        if (statusFilter === '4xx' && (request.statusCode < 400 || request.statusCode >= 500)) {
          return false;
        }
        if (statusFilter === '5xx' && (request.statusCode < 500 || request.statusCode >= 600)) {
          return false;
        }
      }

      return true;
    });
  }, [requests, searchText, typeFilter, statusFilter]);

  return {
    filteredRequests,
    searchText,
    setSearchText,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
  };
};
