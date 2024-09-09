import { formatDate, getPreviousDay } from './dateUtils.js';

export function findLongestStreak(sortedDates) {
    let longestStreak = 0;
    let currentStreak = 0;
    let streakStart = null;
    let longestStreakStart = null;
    let longestStreakEnd = null;

    for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0 || sortedDates[i] === getPreviousDay(sortedDates[i-1])) {
            if (currentStreak === 0) streakStart = sortedDates[i];
            currentStreak++;
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
                longestStreakStart = streakStart;
                longestStreakEnd = sortedDates[i];
            }
        } else {
            currentStreak = 1;
            streakStart = sortedDates[i];
        }
    }

    return { longestStreak, longestStreakStart, longestStreakEnd };
}

export function findDayWithMostShootings(shootings) {
    const shootingsByDate = {};
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    shootings.forEach(shooting => {
        const date = formatDate(shooting.date);
        if (new Date(date) >= oneYearAgo) {
            shootingsByDate[date] = (shootingsByDate[date] || 0) + 1;
        }
    });

    let maxShootingsDate = null;
    let maxShootings = 0;

    for (const [date, count] of Object.entries(shootingsByDate)) {
        if (count > maxShootings) {
            maxShootings = count;
            maxShootingsDate = date;
        }
    }

    return { date: maxShootingsDate, count: maxShootings };
}

export function calculateTotals(shootings) {
    const totalShootings = shootings.length;
    const totalKilled = shootings.reduce((sum, shooting) => sum + (parseInt(shooting.killed) || 0), 0);
    const totalWounded = shootings.reduce((sum, shooting) => sum + (parseInt(shooting.wounded) || 0), 0);

    return { totalShootings, totalKilled, totalWounded };
}