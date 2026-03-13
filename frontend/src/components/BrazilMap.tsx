import React from 'react';

// More organic and detailed SVG paths for Brazil States
const BR_STATES_PATHS = [
    { id: 'AC', name: 'Acre', d: 'M51,265 L56,267 L60,277 L66,279 L71,288 L70,295 L84,300 L95,295 L104,302 L110,314 L114,310 L123,313 L113,330 L83,346 L60,344 L58,358 L46,361 L26,353 L10,358 L0,347 L3,311 L23,293 L18,272 L32,267 L46,274 L51,265 Z' },
    { id: 'AM', name: 'Amazonas', d: 'M120,83 L150,86 L180,80 L205,82 L215,88 L233,65 L260,67 L300,90 L320,130 L350,140 L370,180 L363,205 L363,225 L340,245 L325,245 L315,257 L305,250 L287,267 L275,263 L260,276 L242,274 L225,290 L200,285 L180,300 L166,290 L140,295 L130,290 L110,314 L104,302 L95,295 L84,300 L70,295 L71,288 L66,279 L60,277 L56,267 L51,265 L57,250 L80,245 L85,230 L94,220 L78,200 L85,190 L85,130 L108,100 L120,83 Z' },
    { id: 'RR', name: 'Roraima', d: 'M233,65 L231,23 L255,5 L285,15 L312,25 L315,44 L306,75 L285,85 L260,67 L233,65 Z' },
    { id: 'RO', name: 'Rondônia', d: 'M200,285 L225,290 L242,274 L260,276 L275,263 L287,267 L305,250 L315,257 L325,245 L346,265 L372,272 L400,314 L395,335 L377,343 L361,335 L340,345 L330,369 L300,381 L267,402 L248,393 L245,340 Z' },
    { id: 'AP', name: 'Amapá', d: 'M448,25 L477,33 L495,80 L465,110 L435,75 Z' },
    { id: 'PA', name: 'Pará', d: 'M300,90 L340,110 L375,100 L400,105 L415,80 L448,25 L435,75 L465,110 L495,80 L525,95 L590,130 L610,165 L600,225 L585,225 L575,235 L555,230 L540,240 L520,240 L503,225 L480,227 L460,245 L423,245 L415,257 L400,250 L370,245 L363,225 L363,205 L370,180 L350,140 L320,130 L300,90 Z' },
    { id: 'MT', name: 'Mato Grosso', d: 'M340,245 L423,245 L460,245 L480,227 L503,225 L515,257 L530,283 L530,305 L550,320 L550,345 L540,365 L525,380 L495,370 L480,380 L460,370 L445,385 L445,405 L415,405 L400,430 L380,415 L360,430 L345,415 L330,425 L320,410 L267,402 L300,381 L330,369 L340,345 L361,335 L377,343 L395,335 L400,314 L372,272 L346,265 L325,245 L340,245 Z' },
    { id: 'MS', name: 'Mato Grosso do Sul', d: 'M320,410 L330,425 L345,415 L360,430 L380,415 L400,430 L415,405 L445,405 L445,455 L425,475 L418,505 L395,515 L370,535 L335,515 L335,490 L315,475 L300,483 L283,467 L283,435 L320,410 Z' },
    { id: 'MA', name: 'Maranhão', d: 'M590,130 L635,140 L658,187 L690,195 L690,265 L660,265 L645,280 L625,275 L610,240 L600,225 L610,165 L590,130 Z' },
    { id: 'PI', name: 'Piauí', d: 'M658,187 L715,190 L755,230 L740,270 L723,275 L705,305 L695,340 L675,340 L650,305 L660,265 L690,265 L690,195 L658,187 Z' },
    { id: 'CE', name: 'Ceará', d: 'M715,190 L785,183 L810,205 L800,253 L755,230 L715,190 Z' },
    { id: 'RN', name: 'Rio Grande do Norte', d: 'M785,183 L835,200 L840,220 L810,230 L810,205 L785,183 Z' },
    { id: 'PB', name: 'Paraíba', d: 'M810,230 L845,235 L845,260 L800,265 L800,253 L810,230 Z' },
    { id: 'PE', name: 'Pernambuco', d: 'M740,270 L785,270 L800,265 L845,260 L845,295 L830,305 L800,305 L763,313 L730,300 L740,270 Z' },
    { id: 'AL', name: 'Alagoas', d: 'M800,305 L830,305 L825,325 L800,320 Z' },
    { id: 'SE', name: 'Sergipe', d: 'M800,320 L825,325 L815,345 L795,340 Z' },
    { id: 'BA', name: 'Bahia', d: 'M675,340 L695,340 L705,305 L723,275 L740,270 L730,300 L763,313 L800,305 L800,320 L795,340 L815,345 L790,395 L790,443 L760,470 L735,465 L730,443 L700,410 L685,410 L675,340 Z' },
    { id: 'TO', name: 'Tocantins', d: 'M520,240 L540,240 L555,230 L575,235 L585,225 L600,225 L610,240 L625,275 L645,280 L650,305 L675,340 L685,410 L645,410 L625,380 L593,380 L560,345 L550,345 L550,320 L530,305 L530,283 L515,257 L520,240 Z' },
    { id: 'GO', name: 'Goiás', d: 'M525,380 L560,345 L593,380 L625,380 L645,410 L685,410 L700,410 L730,443 L713,443 L700,470 L683,485 L653,493 L620,493 L620,535 L585,535 L553,515 L530,490 L480,480 L445,455 L445,405 L460,370 L480,380 L495,370 L525,380 Z' },
    { id: 'DF', name: 'Distrito Federal', d: 'M620,493 L653,493 L653,515 L620,515 Z' },
    { id: 'MG', name: 'Minas Gerais', d: 'M730,443 L735,465 L760,470 L790,443 L790,485 L810,515 L790,560 L750,593 L680,605 L650,593 L630,605 L585,585 L545,585 L535,565 L565,550 L585,535 L620,535 L620,493 L653,493 L683,485 L700,470 L713,443 L730,443 Z' },
    { id: 'ES', name: 'Espírito Santo', d: 'M790,485 L830,493 L830,535 L810,515 L790,485 Z' },
    { id: 'RJ', name: 'Rio de Janeiro', d: 'M750,593 L790,560 L810,515 L830,535 L810,585 L770,610 L750,593 Z' },
    { id: 'SP', name: 'São Paulo', d: 'M445,455 L480,480 L530,490 L553,515 L585,535 L565,550 L535,565 L545,585 L585,585 L565,615 L490,625 L475,640 L445,640 L418,610 L410,580 L425,565 L415,550 L425,535 L418,505 L425,475 L445,455 Z' },
    { id: 'PR', name: 'Paraná', d: 'M415,610 L445,640 L475,640 L490,625 L475,675 L425,705 L363,685 L353,665 L375,645 L395,645 L415,610 Z' },
    { id: 'SC', name: 'Santa Catarina', d: 'M425,705 L475,675 L495,690 L503,725 L460,740 L423,733 L425,705 Z' },
    { id: 'RS', name: 'Rio Grande do Sul', d: 'M363,685 L425,705 L423,733 L460,740 L445,820 L380,845 L320,810 L330,750 L363,685 Z' },
];

const UF_CENTERS: any = {
    'AC': [60, 310], 'AL': [815, 312], 'AM': [200, 180], 'AP': [465, 60],
    'BA': [740, 380], 'CE': [760, 215], 'DF': [636, 504], 'ES': [810, 505],
    'GO': [600, 460], 'MA': [640, 210], 'MT': [450, 320], 'MS': [380, 480],
    'MG': [680, 540], 'PA': [450, 150], 'PB': [822, 247], 'PR': [425, 660],
    'PE': [785, 287], 'PI': [700, 260], 'RJ': [785, 575], 'RN': [812, 203],
    'RS': [380, 770], 'RO': [275, 340], 'RR': [270, 50], 'SC': [460, 715],
    'SP': [500, 560], 'SE': [805, 332], 'TO': [590, 300]
};

interface BrazilMapProps {
    data: { uf: string, count: number }[];
    operators?: { id: string, name: string, city: string, state: string }[];
    type: 'heat' | 'pins';
}

export const BrazilMap: React.FC<BrazilMapProps> = ({ data, operators, type }) => {
    const maxCount = Math.max(...data.map(d => d.count), 1);

    const getColor = (uf: string) => {
        const item = data.find(d => d.uf === uf);
        if (!item || item.count === 0) return '#f8fafc';
        const intensity = Math.min(0.9, (item.count / maxCount) * 0.7 + 0.2);
        return `rgba(230, 22, 125, ${intensity})`; // Using brand color #e6167d
    };

    return (
        <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', position: 'relative' }}>
            <svg viewBox="0 0 850 850" style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' }}>
                {BR_STATES_PATHS.map(state => (
                    <path
                        key={state.id}
                        d={state.d}
                        fill={type === 'heat' ? getColor(state.id) : '#f8fafc'}
                        stroke="#cbd5e1"
                        strokeWidth="1.5"
                        style={{ transition: 'fill 0.3s' }}
                    >
                        <title>{state.name}{type === 'heat' ? `: ${data.find(d => d.uf === state.id)?.count || 0} pedidos` : ''}</title>
                    </path>
                ))}

                {type === 'pins' && operators?.map(op => {
                    const center = UF_CENTERS[op.state];
                    if (!center) return null;
                    return (
                        <g key={op.id} transform={`translate(${center[0]}, ${center[1]})`}>
                            {/* Marker glow */}
                            <circle r="8" fill="#e6167d" fillOpacity="0.2">
                                <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                            </circle>
                            {/* Main pin */}
                            <circle r="4.5" fill="#e6167d" stroke="#ffffff" strokeWidth="1.5" />
                            <title>{op.name} - {op.city}/{op.state}</title>
                        </g>
                    );
                })}
            </svg>
            
            {/* Legend for heat map */}
            {type === 'heat' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>Baixa Demanda</span>
                    <div style={{ width: '60px', height: '8px', background: 'linear-gradient(90deg, rgba(230, 22, 125, 0.2), rgba(230, 22, 125, 0.9))', borderRadius: '4px' }}></div>
                    <span>Alta Demanda</span>
                </div>
            )}
        </div>
    );
};
