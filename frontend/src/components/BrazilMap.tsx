import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip as LeafletTooltip } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

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

// Custom Truck Icon
const truckIconMarkup = renderToStaticMarkup(
    <div style={{ 
        background: 'var(--brand-primary)', 
        color: 'white', 
        padding: '5px', 
        borderRadius: '50%', 
        border: '2px solid white',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }}>
        <Truck size={16} />
    </div>
);

const customTruckIcon = L.divIcon({
    html: truckIconMarkup,
    className: 'custom-truck-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
});

interface BrazilMapProps {
    data: { uf: string, count: number }[];
    operators?: { id: string, name: string, city: string, state: string }[];
    type: 'heat' | 'pins';
}

// Map center for Brazil
const BRAZIL_CENTER: [number, number] = [-14.235, -51.9253];

export const BrazilMap: React.FC<BrazilMapProps> = ({ data, operators, type }) => {
    const navigate = useNavigate();
    const [geoData, setGeoData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const maxCount = useMemo(() => Math.max(...data.map(d => d.count), 1), [data]);

    useEffect(() => {
        const fetchGeoData = async () => {
            try {
                // Fetch official Brazil States GeoJSON from IBGE
                const response = await fetch(
                    'https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=UF'
                );
                const json = await response.json();
                setGeoData(json);
            } catch (err) {
                console.error('Error fetching Brazil GeoJSON:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchGeoData();
    }, []);

    const getColor = (ufCode: string) => {
        // IBGE returns numeric codes (e.g., 33 for RJ). We need to map UF initials to these codes or vice-versa.
        // For simplicity, let's assume we map the initials to the feature property 'sigla' if available, 
        // or we use a mapping object.
        const ufMapping: Record<string, string> = {
            '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
            '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA',
            '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
            '41': 'PR', '42': 'SC', '43': 'RS',
            '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF'
        };

        const ufInitials = ufMapping[ufCode];
        const item = data.find(d => d.uf === ufInitials);
        
        if (!item || item.count === 0) return '#f8fafc';
        const intensity = Math.min(0.9, (item.count / maxCount) * 0.7 + 0.2);
        return `rgba(230, 22, 125, ${intensity})`;
    };

    const geojsonStyle = (feature: any) => {
        const ufCode = feature.properties?.codarea || feature.id;
        return {
            fillColor: type === 'heat' ? getColor(ufCode.toString()) : '#f8fafc',
            fillOpacity: 1,
            color: '#cbd5e1',
            weight: 1,
            transition: 'fill 0.3s'
        };
    };

    const onEachFeature = (feature: any, layer: any) => {
        const ufCode = (feature.properties?.codarea || feature.id).toString();
        const ufMapping: Record<string, string> = {
            '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
            '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA',
            '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
            '41': 'PR', '42': 'SC', '43': 'RS',
            '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF'
        };
        const uf = ufMapping[ufCode];
        const count = data.find(d => d.uf === uf)?.count || 0;
        
        if (type === 'heat') {
            layer.bindTooltip(`<strong>${uf}</strong>: ${count} pedidos`, { sticky: true });
        }
    };

    // Simplified UF center coordinates for markers since we don't have operator lat/lng yet
    const UF_COORDINATES: Record<string, [number, number]> = {
        'AC': [-9.0238, -70.812], 'AL': [-9.5713, -36.782], 'AM': [-3.4168, -65.8561], 'AP': [1.4154, -51.7711],
        'BA': [-12.9704, -38.5124], 'CE': [-3.7172, -38.5433], 'DF': [-15.7801, -47.8829], 'ES': [-19.1834, -40.3089],
        'GO': [-16.6869, -49.2643], 'MA': [-2.5307, -44.3068], 'MT': [-12.6819, -56.9211], 'MS': [-20.4697, -54.6201],
        'MG': [-18.5122, -44.555], 'PA': [-1.4558, -48.4902], 'PB': [-7.1153, -34.861], 'PR': [-25.2521, -52.0215],
        'PE': [-8.0543, -34.8813], 'PI': [-5.092, -42.8034], 'RJ': [-22.9068, -43.1729], 'RN': [-5.7945, -35.211],
        'RS': [-30.0346, -51.2177], 'RO': [-11.5057, -63.5806], 'RR': [2.8235, -60.6758], 'SC': [-27.5954, -48.548],
        'SP': [-23.5505, -46.6333], 'SE': [-10.9111, -37.0717], 'TO': [-10.1753, -48.3317]
    };

    if (loading || !geoData) return (
        <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: '16px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Carregando malha geográfica...</span>
        </div>
    );

    return (
        <div style={{ width: '100%', height: '450px', position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <MapContainer 
                center={BRAZIL_CENTER} 
                zoom={4} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
                scrollWheelZoom={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                
                <GeoJSON 
                    data={geoData} 
                    style={geojsonStyle} 
                    onEachFeature={onEachFeature}
                />

                {type === 'pins' && operators?.map(op => {
                    const pos = UF_COORDINATES[op.state];
                    if (!pos) return null;
                    
                    // Add a tiny random offset to markers in the same state to avoid complete overlap
                    const offsetPos: [number, number] = [
                        pos[0] + (Math.random() - 0.5) * 0.5,
                        pos[1] + (Math.random() - 0.5) * 0.5
                    ];

                    return (
                        <Marker 
                            key={op.id} 
                            position={offsetPos} 
                            icon={customTruckIcon}
                            eventHandlers={{
                                click: () => navigate(`/admin/logistics/${op.id}`)
                            }}
                        >
                            <LeafletTooltip direction="top" offset={[0, -20]} opacity={1}>
                                <div style={{ padding: '4px' }}>
                                    <strong style={{ display: 'block', color: 'var(--brand-primary)' }}>{op.name}</strong>
                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>{op.city} - {op.state}</span>
                                </div>
                            </LeafletTooltip>
                        </Marker>
                    );
                })}
            </MapContainer>
            
            {/* Legend for heat map */}
            {type === 'heat' && (
                <div style={{ 
                    position: 'absolute', 
                    bottom: '15px', 
                    right: '15px', 
                    padding: '10px', 
                    background: 'rgba(255,255,255,0.9)', 
                    borderRadius: '8px', 
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    fontSize: '0.75rem',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{ fontWeight: 600, marginBottom: '5px' }}>Pedidos por UF</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Livre</span>
                        <div style={{ width: '80px', height: '10px', background: 'linear-gradient(90deg, rgba(230, 22, 125, 0.2), rgba(230, 22, 125, 0.9))', borderRadius: '5px' }}></div>
                        <span>Crítico</span>
                    </div>
                </div>
            )}
        </div>
    );
};
