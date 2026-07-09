"use client";

import { ZONE } from "@/domain/enums";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { useCallback, useEffect, useMemo, useState } from "react";

interface MapProps {
    onLocationChange: (coords: google.maps.LatLngLiteral, indoor?: Boolean) => void;
    useLocation?: Boolean
}

const containerStyle = {
    width: '100%',
    height: '400px'
};

const initialCenter = {
  lat: 16.685478,
  lng: -96.685361
};

export default function GoogleMapsComponent ({
    onLocationChange,
    useLocation = true
}: MapProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GM_API_KEY!,
        libraries: ["geometry"]
    })

    const [map, setMap] = useState<google.maps.Map | null>(null)
    const [currentLocation, setCurrentLocation] = useState(initialCenter);
    const [loadingLocation, setLoadingLocation] = useState(false);

    useEffect(() => {
        const api_key = process.env.NEXT_PUBLIC_GM_API_KEY!;
    });

    const position = useMemo(() => initialCenter, []);
    const mapOptions = useMemo<google.maps.MapOptions>(() => ({
        mapId: "DEMO_APP_ID"
    }), []);

    const onLoad = useCallback(async (mapInstance : google.maps.Map) => {
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
        const bounds = new google.maps.LatLngBounds();
        
        const marker = new AdvancedMarkerElement({
            position: initialCenter,
            map: mapInstance,
            title: "Mi ubicación",
            gmpDraggable: true
        });

        marker.addListener("dragend", () => {
            const nuevaPosicion = marker.position;
            
            if (nuevaPosicion) {
                const coords = {
                    lat: typeof nuevaPosicion.lat === 'function' ? nuevaPosicion.lat() : nuevaPosicion.lat,
                    lng: typeof nuevaPosicion.lng === 'function' ? nuevaPosicion.lng() : nuevaPosicion.lng
                };

                const indoor = validateLocation(coords.lat, coords.lng);
                
                onLocationChange(coords, indoor)
            }
        });

        if (marker.position) {
            bounds.extend(marker.position);
        }
        
        const listener = mapInstance.addListener('bounds_changed', () => {
            const ZOOM_MAXIMO_DESEADO = 18; 
            
            if (mapInstance.getZoom()! > ZOOM_MAXIMO_DESEADO) {
                mapInstance.setZoom(ZOOM_MAXIMO_DESEADO);
            }
            
            google.maps.event.removeListener(listener);
        });

        mapInstance?.fitBounds(bounds);
        
        setMap(mapInstance);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const validateLocation = (lat: number, lng: number) => {
        if (!window.google || !window.google.maps || !window.google.maps.geometry) return false;

        const newCoords = new google.maps.LatLng(lat, lng);

        const polCoords = ZONE.map(p => new google.maps.LatLng(p.lat, p.lng));
        const pol = new google.maps.Polygon({ paths: polCoords });

        const indoor = google.maps.geometry.poly.containsLocation(newCoords, pol);

        return indoor;
    };

    const handleGetBrowserLocation = () => {
        if (!navigator.geolocation) {
            alert("Tu navegador no soporta la geolocalización.");
            return;
        }

        setLoadingLocation(true);

        navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
        
            const { latitude, longitude } = position.coords;
            const newCoords = { lat: latitude, lng: longitude };

            const marker = new AdvancedMarkerElement({
                position: newCoords,
                map,
                title: "Mi ubicación",
                gmpDraggable: true
            });

            const indoor = validateLocation(latitude, longitude);
            
            // 1. Actualizamos el estado de la ubicación (mueve el marcador)
            setCurrentLocation(newCoords);
            onLocationChange(newCoords, indoor);

            // 2. Forzamos al mapa a panear/moverse suavemente a las nuevas coordenadas
            if (map) {
                map.panTo(newCoords);
                map.setZoom(18); // Opcional: hacemos un acercamiento más preciso
            }

            setLoadingLocation(false);
        },
        (error) => {
            setLoadingLocation(false);
            switch (error.code) {
            case error.PERMISSION_DENIED:
                alert("Permiso denegado por el usuario para obtener la ubicación.");
                break;
            case error.POSITION_UNAVAILABLE:
                alert("La información de la ubicación no está disponible.");
                break;
            case error.TIMEOUT:
                alert("Se agotó el tiempo de espera para obtener la ubicación.");
                break;
            default:
                alert("Ocurrió un error desconocido al obtener la ubicación.");
                break;
            }
        },
        {
            enableHighAccuracy: true, // Solicita la mayor precisión posible (GPS si está disponible)
            timeout: 10000,           // 10 segundos máximo de espera
            maximumAge: 0,            // No usar ubicación en caché
        }
        );
    };

    if (loadError) {
        return <div className="p-4 text-red-500">Error loading Google Maps.</div>;
    }

    if (!isLoaded) {
        return <div className="p-4 text-gray-500">Loading Map...</div>;
    }

    return (
        <div>
            { useLocation && <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <label className="block text-sm font-medium text-gray-700">
                    📍 Selecciona tu ubicación de entrega:
                    </label>
                    
                    {/* Botón para obtener la ubicación actual */}
                    <button
                    type="button"
                    onClick={handleGetBrowserLocation}
                    disabled={loadingLocation}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:bg-blue-400"
                    >
                    {loadingLocation ? (
                        <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Obteniendo ubicación...
                        </>
                    ) : (
                        <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Usar mi ubicación actual
                        </>
                    )}
                    </button>
                </div>
            }
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={position}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={mapOptions}
            >
            </GoogleMap>
        </div>
    );

    /* const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        console.log(process.env.GOOGLE_MAPS_API_KEY);
    });

    if (!isMounted) {
        return <div>Loading...</div>;
    }

    return (
        <LoadScript
            googleMapsApiKey={'AIzaSyBMA4HpjLwSH9Y7W-5NVEms12FZ4mn_eDQ'}
        >
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={10}
            >
                <MarkerF position={center} />
            </GoogleMap>
        </LoadScript>
    ); */
}