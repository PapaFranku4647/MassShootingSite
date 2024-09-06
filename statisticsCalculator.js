import { formatDate, getPreviousDay } from './dateUtils.js';

export function findLongestStreak(dates) {
    let longestStreak = 0;
    let currentStreak = 0;
    let streakStart = null;
    let streakEnd = null;
    let longestStreakStart = null;
    let longestStreakEnd = null;

    for (let i = 0; i < dates.length; i++) {
        const currentDate = dates[i];
        const previousDate = i > 0 ? dates[i - 1] : null;

        if (previousDate && currentDate === getPreviousDay(previousDate)) {
            currentStreak++;
            if (currentStreak === 1) {
                streakStart = previousDate;
            }
            streakEnd = currentDate;
        } else {
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
                longestStreakStart = streakStart;
                longestStreakEnd = streakEnd;
            }
            currentStreak = 1;
            streakStart = currentDate;
            streakEnd = currentDate;
        }
    }

    if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
        longestStreakStart = streakStart;
        longestStreakEnd = streakEnd;
    }

    return {
        longestStreak,
        longestStreakStart,
        longestStreakEnd
    };
}

export function findDayWithMostShootings(shootings) {
    const shootingCounts = {};
    let maxCount = 0;
    let dayWithMost = null;

    shootings.forEach(shooting => {
        const date = formatDate(shooting.date);
        shootingCounts[date] = (shootingCounts[date] || 0) + 1;

        if (shootingCounts[date] > maxCount) {
            maxCount = shootingCounts[date];
            dayWithMost = date;
        }
    });

    return {
        date: dayWithMost,
        count: maxCount
    };
}

export function calculateTotals(shootings) {
    return shootings.reduce((totals, shooting) => {
        totals.totalShootings++;
        totals.totalKilled += parseInt(shooting.killed) || 0;
        totals.totalWounded += parseInt(shooting.wounded) || 0;
        return totals;
    }, { totalShootings: 0, totalKilled: 0, totalWounded: 0 });
}