import { useEffect, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function Location({ value = '', onChange }) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: API_KEY });

  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [address, setAddress] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // agar edit mode me pehle se value aayi hai to usse parse kar lo
  useEffect(() => {
    if (!value || lat) return;
    const latMatch = value.match(/Latitude:\s*(-?\d+\.?\d*)/i);
    const lngMatch = value.match(/Longitude:\s*(-?\d+\.?\d*)/i);
    if (latMatch && lngMatch) {
      setLat(Number(latMatch[1]));
      setLng(Number(lngMatch[1]));
      setAddress(value.split('| Latitude:')[0].trim());
    }
  }, [value, lat]);

  const geocode = (data) => {
    return new Promise((resolve, reject) => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(data, (results, status) => {
        if (status === 'OK' && results[0]) resolve(results[0]);
        else reject(new Error('Location not found'));
      });
    });
  };

  const setLocation = (newLat, newLng, newAddress) => {
    setLat(newLat);
    setLng(newLng);
    setAddress(newAddress);
    setError('');
    onChange({
      location: newAddress,
      latlong: `${newLat.toFixed(6)}, ${newLng.toFixed(6)}`,
    });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const result = await geocode({ location: { lat: latitude, lng: longitude } });
          setLocation(latitude, longitude, result.formatted_address);
        } catch {
          setLocation(latitude, longitude, `${latitude}, ${longitude}`);
        }
        setLoading(false);
      },
      () => {
        setError('Could not get your location');
        setLoading(false);
      }
    );
  };

  const handleMapClick = async (e) => {
    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();
    setLoading(true);
    try {
      const result = await geocode({ location: { lat: newLat, lng: newLng } });
      setLocation(newLat, newLng, result.formatted_address);
    } catch {
      setLocation(newLat, newLng, `${newLat}, ${newLng}`);
    }
    setLoading(false);
  };

  const searchAddress = async () => {
    if (!manualAddress.trim()) {
      setError('Enter an address first');
      return;
    }
    setLoading(true);
    try {
      const result = await geocode({ address: manualAddress });
      const newLat = result.geometry.location.lat();
      const newLng = result.geometry.location.lng();
      setLocation(newLat, newLng, result.formatted_address);
      setManualAddress('');
    } catch {
      setError('Address not found');
    }
    setLoading(false);
  };

  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <div className="mb-4">
      <label className="form-label fw-semibold">Location</label>

      <div className="d-flex gap-2 mb-2">
        <button type="button" className="btn btn-primary" onClick={useCurrentLocation} disabled={loading}>
          📍 Use Current Location
        </button>
      </div>

      <div className="d-flex gap-2 mb-2">
        <input
          type="text"
          className="form-control"
          placeholder="Search city or address"
          value={manualAddress}
          onChange={(e) => setManualAddress(e.target.value)}
        />
        <button type="button" className="btn btn-primary" onClick={searchAddress} disabled={loading}>
          Search
        </button>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}
      {address && <div className="alert alert-info py-2">{address}</div>}

      <GoogleMap
        mapContainerStyle={{ height: '320px', width: '100%' }}
        center={lat ? { lat, lng } : { lat: 22.9734, lng: 78.6569 }}
        zoom={lat ? 15 : 5}
        onClick={handleMapClick}
      >
        {lat && <Marker position={{ lat, lng }} />}
      </GoogleMap>
    </div>
  );
}

export default Location;