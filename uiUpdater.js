import { formatDate, formatDateForDisplay, getPreviousDay } from './dateUtils.js';
import { findLongestStreak, findDayWithMostShootings, calculateTotals } from './statisticsCalculator.js';

let map, heatmapLayer;

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
                    if (target === 'heatmap') {
                        setTimeout(() => {
                            initializeMap();
                            if (window.shootingsData) {
                                updateHeatmap(window.shootingsData);
                            }
                        }, 100);
                    }
                }
            });
        });
    });
}

function initializeMap() {
    const container = document.getElementById('heatmapContainer');
    if (!container) {
        console.error('Heatmap container not found');
        return;
    }

    if (container.clientWidth === 0 || container.clientHeight === 0) {
        console.warn('Map container has no size. Retrying in 100ms.');
        setTimeout(initializeMap, 100);
        return;
    }

    if (!map) {
        map = L.map('heatmapContainer').setView([37.8, -96], 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        heatmapLayer = L.heatLayer([], { 
            radius: 50,  // Increased radius
            blur: 30,    // Increased blur
            maxZoom: 10,
            max: 0.4,    // Reduced max intensity
            gradient: {0.2: 'blue', 0.4: 'lime', 0.6: 'red'}  // Adjusted gradient
        }).addTo(map);
        
        console.log("Map and heatmap layer initialized");
    }

    map.invalidateSize();
}

export function updateHeatmap(shootings) {
    if (!map || !heatmapLayer) {
        console.warn('Map or heatmap layer not initialized, initializing now');
        initializeMap();
        setTimeout(() => updateHeatmap(shootings), 100);
        return;
    }

    const points = (shootings || [])
        .filter(shooting => shooting.latitude && shooting.longitude)
        .map(shooting => [
            parseFloat(shooting.latitude),
            parseFloat(shooting.longitude),
            0.5  // Reduced intensity per point
        ]);
    
    console.log(`Updating heatmap with ${points.length} points`);
    
    if (points.length > 0) {
        heatmapLayer.setLatLngs(points);
        console.log("Heatmap updated successfully");
    } else {
        console.log("No valid points to display on the heatmap");
    }
}


export function displayData(shootings) {
    const resultDiv = document.getElementById('result');
    const uniqueDates = new Set(shootings.map(shooting => formatDate(shooting.date)));
    const sortedDates = Array.from(uniqueDates).sort((a, b) => new Date(b) - new Date(a));

    const { totalShootings, totalKilled, totalWounded } = calculateTotals(shootings);
    
    
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

    // Initialize heatmap container
    const heatmapDiv = document.getElementById('heatmap');
    heatmapDiv.innerHTML = `
        <h2>Shooting Incidents Heatmap</h2>
        <div id="heatmapContainer" style="height: 400px; width: 100%;"></div>
    `;

    // Store the shootings data for later use
    window.shootingsData = shootings;
}

export function initializeMapOnLoad() {
    window.addEventListener('load', () => {
        const heatmapTab = document.querySelector('.tab-item[data-tab="heatmap"]');
        if (heatmapTab) {
            heatmapTab.click();
        }
    });
}