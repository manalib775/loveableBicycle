import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  city: string | null;
}

interface UseLocationResult extends LocationState {
  requestLocation: () => Promise<void>;
  hasPermission: boolean;
  setCity: (city: string) => void;
}

export function useLocation(): UseLocationResult {
  const [state, setState] = useState<LocationState>(() => {
    // Try to get saved location from localStorage
    const savedCity = localStorage.getItem('userCity');
    return {
      latitude: null,
      longitude: null,
      error: null,
      loading: false,
      city: savedCity
    };
  });

  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const { toast } = useToast();

  // Check if we already have permission
  useEffect(() => {
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((permissionStatus) => {
        setHasPermission(permissionStatus.state === 'granted');

        permissionStatus.onchange = () => {
          setHasPermission(permissionStatus.state === 'granted');
        };
      })
      .catch(() => {
        // Older browsers might not support the permissions API
        setHasPermission(false);
      });
  }, []);

  const setCity = useCallback((city: string) => {
    setState(prev => ({ ...prev, city }));
    localStorage.setItem('userCity', city);
  }, []);

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser'
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      setState(prev => ({
        ...prev,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        loading: false
      }));

      // Store the permission state
      setHasPermission(true);
      localStorage.setItem('locationPermission', 'granted');

    } catch (error) {
      const errorMessage = error instanceof GeolocationPositionError 
        ? getLocationErrorMessage(error)
        : 'Failed to get location';

      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));

      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    ...state,
    requestLocation,
    hasPermission,
    setCity
  };
}

function getLocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission denied";
    case error.POSITION_UNAVAILABLE:
      return "Location information unavailable";
    case error.TIMEOUT:
      return "Location request timed out";
    default:
      return "An unknown error occurred";
  }
}