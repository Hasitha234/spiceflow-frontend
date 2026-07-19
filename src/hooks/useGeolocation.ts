import { useState, useCallback } from 'react';

export interface GeolocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isLoading: boolean;
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationData>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isLoading: false,
  });

  const fetchLocation = useCallback(async () => {
    setLocation(prev => ({ ...prev, isLoading: true, error: null }));
    
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        isLoading: false,
        error: 'Geolocation is not supported by your browser',
      }));
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000, // 30 seconds cache
        });
      });

      setLocation({
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6)),
        accuracy: position.coords.accuracy,
        error: null,
        isLoading: false,
      });
    } catch (err) {
      setLocation(prev => ({
        ...prev,
        isLoading: false,
        error: (err as GeolocationPositionError).message || 'Failed to get location',
      }));
    }
  }, []);

  return { location, fetchLocation };
}
