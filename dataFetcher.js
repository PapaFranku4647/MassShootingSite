import { displayData } from './uiUpdater.js';

const dataUrl = "https://mass-shooting-tracker-data.s3.us-east-2.amazonaws.com/2024-data.json";

export async function fetchData() {
    try {
        const response = await fetch(dataUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        console.log("Raw JSON data:", data);
        
        displayData(data);
    } catch (error) {
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = `<p class="error">Error fetching or parsing data: ${error.message}</p>`;
        console.error("Error:", error);
    }
}