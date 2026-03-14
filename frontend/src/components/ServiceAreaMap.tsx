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

// Helper to normalize strings for comparison (remove accents and lowercase)
const normalize = (str: string) => {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
};

// Helper to auto-fit the map to the GeoJSON bounds
const FitBounds = ({ geojson }: { geojson: any }) => {
    const map = useMap();
    useEffect(() => {
        if (geojson) {
            const geojsonLayer = L.geoJSON(geojson);
            const bounds = geojsonLayer.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [20, 20] });
            }
        }
    }, [geojson, map]);
    return null;
};

export const ServiceAreaMap = ({ state, regions }: ServiceAreaMapProps) => {
    const [geoData, setGeoData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [muniCodes, setMuniCodes] = useState<Record<string, string>>({});
    const [listMunicipalities, setListMunicipalities] = useState<any[]>([]);

    const activeRegions = useMemo(() => 
        regions ? regions.split(',').map(r => normalize(r)) : [], 
    [regions]);

    const isStateWide = useMemo(() => 
        activeRegions.includes(normalize(state)),
    [activeRegions, state]);

    useEffect(() => {
        const fetchGeoData = async () => {
            if (!state) return;
            setLoading(true);
            try {
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

    useEffect(() => {
        const fetchCodes = async () => {
            if (!state) return;
            try {
                const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`);
                const list = await res.json();
                setListMunicipalities(list);
                const mapping: Record<string, string> = {};
                list.forEach((m: any) => {
                    mapping[normalize(m.nome)] = m.id.toString();
                });
                setMuniCodes(mapping);
            } catch (e) {
                console.error('Error fetching municipality names:', e);
            }
        };
        fetchCodes();
    }, [state]);

    const geojsonStyle = (feature: any) => {
        const code = (feature.properties?.codarea || feature.id || "").toString();
        const muniNormalized = Object.keys(muniCodes).find(key => muniCodes[key] === code);
        
        const isHighlighted = isStateWide || (muniNormalized && activeRegions.includes(muniNormalized));

        if (isHighlighted) {
            return {
                fillColor: '#FFD919',
                fillOpacity: 0.7,
                color: '#e6c214',
                weight: 2
            };
        }
        return {
            fillColor: 'rgba(0,0,0,0.02)',
            fillOpacity: 0.05,
            color: 'rgba(0,0,0,0.08)',
            weight: 0.5
        };
    };

    const onEachFeature = (feature: any, layer: any) => {
        const code = (feature.properties?.codarea || feature.id || "").toString();
        const muniName = listMunicipalities.find((m: any) => m.id.toString() === code)?.nome || "";
        if (muniName) {
            layer.bindTooltip(muniName, { sticky: true });
        }
    };

    if (loading || !geoData) return (
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Carregando mapa regional...</span>
        </div>
    );

    return (
        <div style={{ 
            height: '350px', 
            width: '100%',
            background: '#ffffff', 
            borderRadius: '16px', 
            border: '1px solid var(--border-color)',
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
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <GeoJSON 
                    key={`${state}-${activeRegions.length}-${Object.keys(muniCodes).length}-${isStateWide}`}
                    data={geoData} 
                    style={geojsonStyle} 
                    onEachFeature={onEachFeature}
                />
                <FitBounds geojson={geoData} />
            </MapContainer>
        </div>
    );
};
