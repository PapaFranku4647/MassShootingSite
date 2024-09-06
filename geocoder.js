const API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const API_KEY = 'AIzaSyDZYItY7Ek2dQgm3F8gBkwSh-JkxD6gmRQ';

let geocodeCache = {};

function loadCache() {
    const cachedGeocodeData = localStorage.getItem('geocodeCache');
    if (cachedGeocodeData) {
        geocodeCache = JSON.parse(cachedGeocodeData);
        console.log("Geocode cache loaded from localStorage");
    } else {
        console.log("No geocode cache found in localStorage");
    }
}

export function saveCache() {
    localStorage.setItem('geocodeCache', JSON.stringify(geocodeCache));
    console.log("Geocode cache saved to localStorage");
}

export async function geocodeLocation(city, state) {
    const cacheKey = `${city},${state}`.toLowerCase();

    // Ensure the cache is loaded
    if (Object.keys(geocodeCache).length === 0) {
        loadCache();
    }

    // Return the cached result if it exists
    if (geocodeCache[cacheKey]) {
        console.log(`Using cached geocode for ${city}, ${state}`);
        return geocodeCache[cacheKey];
    }

    // Fallback: Use Google API if not in cache
    try {
        const result = await geocodeWithGoogle(city, state);
        if (result) {
            geocodeCache[cacheKey] = result;  // Cache the result
            saveCache();  // Save the updated cache
            return result;
        }
        return null;
    } catch (error) {
        console.error(`Error geocoding ${city}, ${state}:`, error);
        return null;
    }
}

async function geocodeWithGoogle(city, state) {
    const address = `${city}, ${state}`;
    const params = new URLSearchParams({
        address: address,
        key: API_KEY
    });

    const url = `${API_URL}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
            lat: location.lat,
            lon: location.lng
        };
    } else {
        console.log(`No results found for ${city}, ${state}`);
        return null;
    }
}

// Load the cache when the script is loaded
loadCache();