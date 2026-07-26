import { useEffect, useState } from 'react';
import type { UseFormReturn, FieldValues } from 'react-hook-form';

interface UseFormDraftOptions {
  key: string;
  enabled?: boolean;
}

export function useFormDraft<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  { key, enabled = true }: UseFormDraftOptions
) {
  const [isRestored, setIsRestored] = useState(false);

  // Restore draft on mount
  useEffect(() => {
    if (!enabled) return;

    try {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Reset form with parsed data, keeping dirty states
        form.reset(parsed, { keepDefaultValues: false });
      }
    } catch (e) {
      console.error('Failed to restore form draft:', e);
    } finally {
      setIsRestored(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  // Subscribe to changes and save
  useEffect(() => {
    if (!enabled || !isRestored) return;

    const subscription = form.watch((value) => {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error('Failed to save form draft:', e);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, key, enabled, isRestored]);

  const clearDraft = () => {
    sessionStorage.removeItem(key);
  };

  return { isRestored, clearDraft };
}
