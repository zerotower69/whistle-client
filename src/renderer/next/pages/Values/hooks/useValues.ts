import { useState, useEffect, useCallback } from 'react';
import type { ValueItem } from '../types';

/**
 * Hook for managing values data and operations
 */
export const useValues = () => {
  const [values, setValues] = useState<ValueItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading] = useState(false);

  // Load data from localStorage
  const loadValues = useCallback(() => {
    try {
      const saved = localStorage.getItem('whistle-values');
      if (saved) {
        setValues(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load values:', error);
    }
  }, []);

  // Save data to localStorage
  const saveValues = useCallback((newValues: ValueItem[]) => {
    try {
      localStorage.setItem('whistle-values', JSON.stringify(newValues));
      setValues(newValues);
    } catch (error) {
      console.error('Failed to save values:', error);
    }
  }, []);

  // Create new value
  const createValue = useCallback(
    (name: string, language: string = 'text') => {
      const newValue: ValueItem = {
        key: `value_${Date.now()}`,
        name,
        content: '',
        language,
        createTime: Date.now(),
        updateTime: Date.now(),
      };
      const newValues = [...values, newValue];
      saveValues(newValues);
      setSelectedKey(newValue.key);
      return newValue;
    },
    [values, saveValues],
  );

  // Delete value
  const deleteValue = useCallback(
    (key: string) => {
      const newValues = values.filter((v) => v.key !== key);
      saveValues(newValues);
      if (selectedKey === key) {
        setSelectedKey(null);
      }
    },
    [values, selectedKey, saveValues],
  );

  // Update value content
  const updateValue = useCallback(
    (key: string, updates: Partial<ValueItem>) => {
      const newValues = values.map((v) =>
        v.key === key ? { ...v, ...updates, updateTime: Date.now() } : v,
      );
      saveValues(newValues);
    },
    [values, saveValues],
  );

  // Rename value
  const renameValue = useCallback(
    (key: string, newName: string) => {
      updateValue(key, { name: newName });
    },
    [updateValue],
  );

  useEffect(() => {
    loadValues();
  }, [loadValues]);

  const selectedValue = values.find((v) => v.key === selectedKey);

  return {
    values,
    selectedKey,
    selectedValue,
    loading,
    setSelectedKey,
    createValue,
    deleteValue,
    updateValue,
    renameValue,
  };
};
