import { fetchData } from './dataFetcher.js';
import { initTabs, displayData, initializeMapOnLoad } from './uiUpdater.js';


document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    fetchData();
    initializeMapOnLoad();
});