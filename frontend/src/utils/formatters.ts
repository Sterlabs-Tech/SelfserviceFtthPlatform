/**
 * Formata um número com pontos como separadores de milhar.
 * Ex: 20704 -> 20.704
 */
export const formatNumber = (num: number | string): string => {
    if (num === null || num === undefined) return '0';
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(value)) return '0';
    
    // Usando pt-BR para garantir o ponto como separador de milhar
    return value.toLocaleString('pt-BR');
};
