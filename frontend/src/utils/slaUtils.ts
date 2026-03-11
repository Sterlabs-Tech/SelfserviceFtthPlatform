export const calculateSLARemaining = (targetDate: string | Date | null) => {
    if (!targetDate) return null;

    const target = new Date(targetDate);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();

    const diffHours = diffMs / (1000 * 60 * 60);

    let level: 'normal' | 'warning' | 'critical' | 'expired' = 'normal';
    if (diffHours < 0) level = 'expired';
    else if (diffHours <= 4) level = 'critical';
    else if (diffHours <= 12) level = 'warning';

    const hours = Math.floor(Math.abs(diffHours));
    const minutes = Math.floor((Math.abs(diffHours) * 60) % 60);

    return {
        hours,
        minutes,
        level,
        isExpired: diffHours < 0,
        label: `${hours}h ${minutes}m`
    };
};
