import { displayData, updateHeatmap } from './uiUpdater.js';
import { geocodeLocation, saveCache } from './geocoder.js';

const dataUrl = "https://mass-shooting-tracker-data.s3.us-east-2.amazonaws.com/2024-data.json";

export async function fetchData() {
    try {
        let data;
        const cachedData = localStorage.getItem('shootingsData');
        
        if (cachedData) {
            data = JSON.parse(cachedData);
            console.log("Using cached data");
        } else {
            const response = await fetch(dataUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            data = await response.json();
            localStorage.setItem('shootingsData', JSON.stringify(data));
            console.log("Fetched new data and cached it");
        }
        
        console.log("Raw JSON data:", data);
        
        // Display the table immediately
        displayData(data);
        
        // Start geocoding process
        await geocodeShootings(data);
        
        // Update the heatmap with all geocoded data
        updateHeatmap(data.filter(s => s.latitude && s.longitude));
    } catch (error) {
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = `<p class="error">Error fetching or parsing data: ${error.message}</p>`;
        console.error("Error:", error);
    }
}

async function geocodeShootings(shootings) {
    const delay = 200; // 200ms delay between API requests to stay within rate limits
    let processed = 0;
    let dataUpdated = false;

    for (const shooting of shootings) {
        if (!shooting.latitude || !shooting.longitude) {
            try {
                const location = await geocodeLocation(shooting.city, shooting.state);
                if (location) {
                    shooting.latitude = location.lat;
                    shooting.longitude = location.lon;
                    console.log(`${shooting.city}, ${shooting.state}: Lat ${location.lat}, Lon ${location.lon}`);
                    dataUpdated = true;
                    
                    // Update the heatmap periodically
                    processed++;
                    if (processed % 10 === 0) {
                        updateHeatmap(shootings.filter(s => s.latitude && s.longitude));
                    }
                } else {
                    console.warn(`Failed to geocode: ${shooting.city}, ${shooting.state}`);
                }
            } catch (error) {
                console.error(`Error geocoding ${shooting.city}, ${shooting.state}:`, error);
            }
            
            // Wait before the next request
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // Final heatmap update
    updateHeatmap(shootings.filter(s => s.latitude && s.longitude));
    
    // Save updated cache after processing all locations
    if (dataUpdated) {
        localStorage.setItem('shootingsData', JSON.stringify(shootings));
        console.log("Updated cache with new geocoded data");
    }
}