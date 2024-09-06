import { fetchData } from './dataFetcher.js';
import { initTabs } from './uiUpdater.js';

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    fetchData();
});