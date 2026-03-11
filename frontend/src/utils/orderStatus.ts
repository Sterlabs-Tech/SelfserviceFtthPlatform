export const ORDER_STATUS_LABELS: Record<string, string> = {
    'OPEN': 'Aberto',
    'AWAITING_ELIGIBILITY': 'Em Triagem de Elegibilidade',
    'AWAITING_DISPATCH': 'Aguardando Despacho',
    'EQUIPMENT_SEPARATED': 'Equipamento Separado',
    'AWAITING_PICKUP': 'Aguardando Coleta',
    'DISPATCHED_TO_DELIVERER': 'Com o Entregador',
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
