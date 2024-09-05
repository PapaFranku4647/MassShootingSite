const resultDiv = document.getElementById('result');
const dataUrl = "https://mass-shooting-tracker-data.s3.us-east-2.amazonaws.com/2024-data.json";

function formatDate(dateString) {
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

function getToday() {
    return new Date().toISOString().split('T')[0];
}

function getPreviousDay(dateString) {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
}

function getNextDay(dateString) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
}

async function fetchData() {
    try {
        const response = await fetch(dataUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        console.log("Raw JSON data:", data);
        
        displayData(data);
    } catch (error) {
        resultDiv.innerHTML = `<p class="error">Error fetching or parsing data: ${error.message}</p>`;
        console.error("Error:", error);
    }
}

function findLongestStreak(sortedDates) {
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

function displayData(shootings) {
    const uniqueDates = new Set(shootings.map(shooting => formatDate(shooting.date)));
    const sortedDates = Array.from(uniqueDates).sort((a, b) => new Date(b) - new Date(a));

    const totalShootings = shootings.length;
    const totalKilled = shootings.reduce((sum, shooting) => sum + (parseInt(shooting.killed) || 0), 0);
    const totalWounded = shootings.reduce((sum, shooting) => sum + (parseInt(shooting.wounded) || 0), 0);

    // Current streak calculation
    let consecutiveDays = [];
    let previousDate = sortedDates[0];

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
    const currentStreakCount = uniqueConsecutiveDays.length;

    // Longest streak in the past year calculation
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const pastYearDates = sortedDates.filter(date => new Date(date) >= oneYearAgo);
    const { longestStreak, longestStreakStart, longestStreakEnd } = findLongestStreak(pastYearDates);

    resultDiv.innerHTML = `
        <h2>Statistics as of ${getToday()}</h2>
        <p>Total mass shootings in 2024: <strong>${totalShootings}</strong></p>
        <p>Total people killed: <strong>${totalKilled}</strong></p>
        <p>Total people injured: <strong>${totalWounded}</strong></p>
        <p class="current-streak">Current streak of consecutive days with mass shootings: ${currentStreakCount}</p>
        <p>Consecutive days with shootings: ${uniqueConsecutiveDays.join(', ')}</p>
        <p class="longest-streak">Longest streak in the past year: <strong>${longestStreak} days</strong></p>
        <p>Date range of longest streak: ${longestStreakStart} to ${longestStreakEnd}</p>
        
        <h2>Latest Incidents</h2>
        <table>
            <tr>
                <th>Date</th>
                <th>City</th>
                <th>State</th>
                <th>Killed</th>
                <th>Injured</th>
            </tr>
            ${shootings.slice(0, 10).map(shooting => `
                <tr>
                    <td>${formatDate(shooting.date)}</td>
                    <td>${shooting.city}</td>
                    <td>${shooting.state}</td>
                    <td>${shooting.killed || '0'}</td>
                    <td>${shooting.wounded || '0'}</td>
                </tr>
            `).join('')}
        </table>
    `;
}

fetchData();