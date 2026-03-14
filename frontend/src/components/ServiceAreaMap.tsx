import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default pointer icons in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

interface ServiceAreaMapProps {
    state: string; // e.g. "RJ"
    regions: string; // e.g. "São Gonçalo, Niterói, Maricá"
}

// Helper to auto-fit the map to the GeoJSON bounds
const FitBounds = ({ geojson }: { geojson: any }) => {
    const map = useMap();
    useEffect(() => {
        if (geojson) {
            const bounds = L.geoJSON(geojson).getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds);
            }
        }
    }, [geojson, map]);
    return null;
};

export const ServiceAreaMap = ({ state, regions }: ServiceAreaMapProps) => {
    const [geoData, setGeoData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const activeRegions = useMemo(() => 
        regions ? regions.split(',').map(r => r.trim().toLowerCase()) : [], 
    [regions]);

    useEffect(() => {
        const fetchGeoData = async () => {
            if (!state) return;
            setLoading(true);
            try {
                // Fetch all municipalities for the given state from IBGE
                const response = await fetch(
                    `https://servicodados.ibge.gov.br/api/v3/malhas/estados/${state}?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=municipio`
                );
                const data = await response.json();
                setGeoData(data);
            } catch (err) {
                console.error('Error fetching GeoJSON from IBGE:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchGeoData();
    }, [state]);

    const geojsonStyle = () => {
        // IBGE GeoJSON features usually have a 'nome' or 'codarea' in properties
        // The intrarregiao=municipio returns features where 'codarea' is the ID
        // But we need to match by name or get the names.
        // Actually, IBGE v3 malhas returns 'codarea'. We might need to fetch the names separately
        // or just use a quality source that has names.
        
        // Wait, the API response for malhas/estados/{id}?intrarregiao=municipio 
        // usually includes municipality codes in 'codarea'.
        // Let's assume we can match names if we fetch names first.
        
        // Revised strategy: fetch municipality list (with names and IDs) first.
        return {
            fillColor: 'transparent',
            weight: 1,
            opacity: 0.5,
            color: 'var(--border-color)',
            fillOpacity: 0
        };
    };

    // We'll need a way to filter the features that are in 'activeRegions'
    // This requires mapping names to IBGE codes.
    const [muniCodes, setMuniCodes] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchCodes = async () => {
            if (!state) return;
            try {
                const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`);
                const list = await res.json();
                const mapping: Record<string, string> = {};
                list.forEach((m: any) => {
                    mapping[m.nome.toLowerCase()] = m.id.toString();
                });
                setMuniCodes(mapping);
            } catch (e) {
                console.error('Error fetching municipality names:', e);
            }
        };
        fetchCodes();
    }, [state]);

    const onEachFeature = (feature: any, layer: any) => {
        const code = feature.properties.codarea;
        const muniName = Object.keys(muniCodes).find(key => muniCodes[key] === code);
        
        if (muniName && activeRegions.includes(muniName)) {
            layer.setStyle({
                fillColor: 'var(--brand-primary)',
                fillOpacity: 0.6,
                color: 'var(--brand-accent)',
                weight: 2
            });
            layer.bindTooltip(muniName.charAt(0).toUpperCase() + muniName.slice(1), { sticky: true });
        } else if (muniName) {
            layer.bindTooltip(muniName.charAt(0).toUpperCase() + muniName.slice(1), { sticky: true });
        }
    };

    if (loading || !geoData) return (
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Carregando mapa regional...</span>
        </div>
    );

    return (
        <div style={{ 
            height: '350px', 
            width: '100%',
            background: '#0d0d0d', 
            borderRadius: '16px', 
            border: '1px solid rgba(255,255,255,0.05)',
            position: 'relative',
            overflow: 'hidden',
            zIndex: 1
        }}>
            <MapContainer 
                center={[-15.78, -47.93]} 
                zoom={4} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <GeoJSON 
                    data={geoData} 
                    style={geojsonStyle} 
                    onEachFeature={onEachFeature}
                />
                <FitBounds geojson={geoData} />
            </MapContainer>
        </div>
    );
};
