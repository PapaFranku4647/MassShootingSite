export function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
        return 'Invalid Date';
    }
    return date.toISOString().split('T')[0];
}

export function formatDateForDisplay(dateString) {
    const date = new Date(dateString + 'T00:00:00Z');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getUTCDate().toString().padStart(2, '0')}-${months[date.getUTCMonth()]}-${date.getUTCFullYear()}`;
}

export function unformatDisplayedDate(dateString) {
    // 01-Feb-2023 -> 2023-02-01
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const parts = dateString.toString().split('-');
    
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];

    const monthIndex = months.indexOf(month) + 1
    const monthStr = String(monthIndex).padStart(2, '0');

    return `${year}-${monthStr}-${day}`;
}

export function getToday() {
    const today = new Date();
    return formatDateForDisplay(today.toISOString().split('T')[0]);
}


export function getPreviousDay(dateString) {
    const date = new Date(dateString + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().split('T')[0];
}

export function getNextDay(dateString) {
    const date = new Date(dateString + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().split('T')[0];
}