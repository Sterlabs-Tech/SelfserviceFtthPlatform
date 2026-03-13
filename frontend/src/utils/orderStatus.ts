export const ORDER_STATUS_LABELS: Record<string, string> = {
    'AWAITING_DISPATCH': 'Separar materiais',
    'EQUIPMENT_SEPARATED': 'Designar Entregador',
    'AWAITING_PICKUP': 'Aguardando Coleta pelo Entregador',
    'DISPATCHED_TO_DELIVERER': 'Material em posse do Entregador',
    'EN_ROUTE': 'Em Rota para o Cliente',
    'DELIVERY_CONFIRMED': 'Material Entregue ao Cliente',
    'RETURNED_FOR_REDELIVERY': 'Material Devolvido para Reenvio',
    'ONT_ACTIVATION_STARTED': 'Ativação da ONT iniciada pelo Cliente',
    'ONT_ASSOCIATION_FAILED': 'Falha na Associação da ONT pelo Cliente',
    'COMPLETED': 'Cliente com ativação finalizada com sucesso',
    'SUPPORT_REQUIRED': 'Em Suporte Técnico Necessário',
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
    'RETURNED_FOR_REDELIVERY',
    'DELIVERY_CONFIRMED',
    'ONT_ACTIVATION_STARTED',
    'ONT_ASSOCIATION_FAILED',
    'SUPPORT_REQUIRED',
];

// Colors for each status badge / bar
export const STATUS_COLORS: Record<string, string> = {
    'AWAITING_DISPATCH': '#ef4444', // Red
    'EQUIPMENT_SEPARATED': '#f97316', // Orange
    'AWAITING_PICKUP': '#eab308', // Yellow
    'DISPATCHED_TO_DELIVERER': '#3b82f6', // Blue
    'EN_ROUTE': '#0ea5e9', // Sky Blue
    'DELIVERY_CONFIRMED': '#10b981', // Emerald
    'RETURNED_FOR_REDELIVERY': '#dc2626', // Bright Red
    'ONT_ACTIVATION_STARTED': '#8b5cf6', // Violet
    'ONT_ASSOCIATION_FAILED': '#f43f5e', // Rose
    'COMPLETED': '#059669', // Dark Emerald
    'SUPPORT_REQUIRED': '#dc2626', // Red
    'CANCELLED': '#9ca3af', // Light Grey
};
