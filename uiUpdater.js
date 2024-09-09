import { formatDate, formatDateForDisplay, getPreviousDay, getToday, unformatDisplayedDate } from './dateUtils.js';
import { findLongestStreak, findDayWithMostShootings, calculateTotals } from './statisticsCalculator.js';

export function initTabs() {
    const tabs = document.querySelectorAll('.tab-item');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            contents.forEach(content => {
                content.classList.remove('active');
                if (content.id === target) {
                    content.classList.add('active');
                }
            });
        });
    });
}

export function displayData(shootings) {
    const resultDiv = document.getElementById('result');
    const uniqueDates = new Set(shootings.map(shooting => formatDate(shooting.date)));
    const sortedDates = Array.from(uniqueDates).sort((a, b) => new Date(b) - new Date(a));

    const { totalShootings, totalKilled, totalWounded } = calculateTotals(shootings);

    // Current streak calculation
    let currentStreakCount;
    let streakDateRange;
    let consecutiveDays = [];
    let previousDate = sortedDates[0];
    const today = unformatDisplayedDate(getToday());
    const yesterday = getPreviousDay(today);
    console.log(today, yesterday);

    // Check if there are no shootings today and yesterday
    if (!sortedDates.includes(today) && !sortedDates.includes(yesterday)) {
        currentStreakCount = 0;
        streakDateRange = "(No Shootings in last 24 hours)";
    } else {
        for (let i = 0; i < sortedDates.length; i++) {
            const currentDate = sortedDates[i];
            if (i === 0 || currentDate === getPreviousDay(previousDate)) {
                consecutiveDays.push(currentDate);
            } else {
                break;
            }
            previousDate = currentDate;
        }

        const uniqueConsecutiveDays = [...new Set(consecutiveDays)];
        currentStreakCount = uniqueConsecutiveDays.length;

        // Format the streak date range
        streakDateRange = currentStreakCount > 1
            ? `(${formatDateForDisplay(uniqueConsecutiveDays[uniqueConsecutiveDays.length - 1])} to ${formatDateForDisplay(uniqueConsecutiveDays[0])})`
            : `(${formatDateForDisplay(uniqueConsecutiveDays[0])})`;
    }

    // Longest streak in the past year calculation
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const pastYearDates = sortedDates.filter(date => new Date(date) >= oneYearAgo);
    const { longestStreak, longestStreakStart, longestStreakEnd } = findLongestStreak(pastYearDates);

    const { date: worstDay, count: worstDayCount } = findDayWithMostShootings(shootings);

    resultDiv.innerHTML = `
        <div class="statistics">
            <div class="stat-card">
                <h3>Total Mass Shootings in 2024</h3>
                <p>${totalShootings}</p>
            </div>
            <div class="stat-card">
                <h3>Total People Killed (2024)</h3>
                <p>${totalKilled}</p>
            </div>
            <div class="stat-card">
                <h3>Total People Injured (2024)</h3>
                <p>${totalWounded}</p>
            </div>
            <div class="stat-card">
                <h3>Day with Most Shootings</h3>
                <p>${formatDateForDisplay(worstDay)}</p>
                <p class="subtext">${worstDayCount} shootings</p>
            </div>
        </div>
        <p class="current-streak">Current streak: <span class="streak-highlight">${currentStreakCount} day${currentStreakCount !== 1 ? 's' : ''}</span> with mass shootings ${streakDateRange}</p>
        <p class="longest-streak">Longest streak in the past year: <span class="streak-highlight">${longestStreak} days</span> (${formatDateForDisplay(longestStreakEnd)} to ${formatDateForDisplay(longestStreakStart)})</p>
        
        <h2>Latest Incidents</h2>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>City</th>
                        <th>State</th>
                        <th>Killed</th>
                        <th>Injured</th>
                    </tr>
                </thead>
                <tbody>
                    ${shootings.slice(0, 10).map(shooting => `
                        <tr>
                            <td>${formatDateForDisplay(formatDate(shooting.date))}</td>
                            <td>${shooting.city}</td>
                            <td>${shooting.state}</td>
                            <td>${shooting.killed || '0'}</td>
                            <td>${shooting.wounded || '0'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}