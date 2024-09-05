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

function formatDateForDisplay(dateString) {
    // Parse the date string and adjust for UTC
    const date = new Date(dateString + 'T00:00:00Z');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getUTCDate().toString().padStart(2, '0')}-${months[date.getUTCMonth()]}-${date.getUTCFullYear()}`;
}

function getToday() {
    const today = new Date();
    return formatDateForDisplay(today.toISOString().split('T')[0]);
}

function getPreviousDay(dateString) {
    const date = new Date(dateString + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().split('T')[0];
}

function getNextDay(dateString) {
    const date = new Date(dateString + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + 1);
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


function findDayWithMostShootings(shootings) {
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

    // Format the streak date range
    const streakDateRange = currentStreakCount > 1
        ? `(${formatDateForDisplay(uniqueConsecutiveDays[uniqueConsecutiveDays.length - 1])} to ${formatDateForDisplay(uniqueConsecutiveDays[0])})`
        : `(${formatDateForDisplay(uniqueConsecutiveDays[0])})`;

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
                <h3>Total People Killed</h3>
                <p>${totalKilled}</p>
            </div>
            <div class="stat-card">
                <h3>Total People Injured</h3>
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

fetchData();