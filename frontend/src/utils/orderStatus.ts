export const ORDER_STATUS_LABELS: Record<string, string> = {
    'OPEN': 'Aberto',
    'AWAITING_ELIGIBILITY': 'Em Triagem de Elegibilidade',
    'AWAITING_DISPATCH': 'Aguardando Separação de Materiais',
    'EQUIPMENT_SEPARATED': 'Materiais Separados - Aguardando Entregador',
    'AWAITING_PICKUP': 'Aguardando Coleta pelo Entregador',
    'DISPATCHED_TO_DELIVERER': 'Entregador Alocado',
    'EN_ROUTE': 'Em Rota para o Cliente',
    'CLIENT_CONTACTED': 'Cliente Contatado',
    'ACTIVATION_PENDING': 'Ativação em Andamento',
    'DELIVERY_CONFIRMED': 'Entrega Confirmada',
    'COMPLETED': 'Concluído',
    'SUPPORT_REQUIRED': 'Suporte Técnico Necessário',
    'CANCELLED': 'Cancelado'
};

export const getStatusLabel = (status: string) => {
    return ORDER_STATUS_LABELS[status] || status;
};

// Logical order for the pipeline drilldown (non-delivered statuses)
export const PIPELINE_STATUS_ORDER: string[] = [
    'AWAITING_DISPATCH',
    'EQUIPMENT_SEPARATED',
    'AWAITING_PICKUP',
    'DISPATCHED_TO_DELIVERER',
    'EN_ROUTE',
    'CLIENT_CONTACTED',
    'ACTIVATION_PENDING',
    'SUPPORT_REQUIRED',
];

// Colors for each status badge / bar
export const STATUS_COLORS: Record<string, string> = {
    'OPEN': '#6b7280',
    'AWAITING_ELIGIBILITY': '#8b5cf6',
    'AWAITING_DISPATCH': '#ef4444',
    'EQUIPMENT_SEPARATED': '#f97316',
    'AWAITING_PICKUP': '#eab308',
    'DISPATCHED_TO_DELIVERER': '#3b82f6',
    'EN_ROUTE': '#0ea5e9',
    'CLIENT_CONTACTED': '#8b5cf6',
    'ACTIVATION_PENDING': '#a855f7',
    'DELIVERY_CONFIRMED': '#10b981',
    'COMPLETED': '#059669',
    'SUPPORT_REQUIRED': '#dc2626',
    'CANCELLED': '#6b7280',
};
