/**
 * Test script for verifying the performance rating implementation
 * Run this file with: node test-performance-ratings.js
 */

// Mock the jQuery and DOM functionality
const $ = selector => ({
    html: content => console.log(`Setting ${selector} HTML to:`, content),
    text: content => console.log(`Setting ${selector} text to:`, content),
    css: (prop, value) => console.log(`Setting ${selector} CSS ${prop} to:`, value),
    show: () => console.log(`Showing ${selector}`),
    hide: () => console.log(`Hiding ${selector}`),
    fadeOut: time => console.log(`Fading out ${selector} over ${time}ms`),
    on: (event, handler) => console.log(`Adding ${event} handler to ${selector}`),
    append: content => console.log(`Appending to ${selector}:`, content),
    appendTo: target => console.log(`Appending ${selector} to ${target}`)
});

// Mock document
global.document = {
    getElementById: id => {
        console.log(`Getting element by ID: ${id}`);
        return { id };
    },
    createElement: tag => {
        console.log(`Creating element: ${tag}`);
        return { tag };
    },
    head: {
        appendChild: element => console.log(`Appending to head:`, element)
    },
    ready: fn => {
        console.log('Document ready');
        fn();
    }
};

// Mock window
global.window = {
    reportResults: {
        accuracies: {
            white: 90,
            black: 85
        }
    }
};

global.setTimeout = (fn, time) => {
    console.log(`Setting timeout for ${time}ms`);
    if (time < 1000) fn(); // Immediately run short timeouts
};

global.setInterval = (fn, time) => {
    console.log(`Setting interval for every ${time}ms`);
    fn(); // Run once for testing
    return 123;
};

// Mock jQuery
global.$ = $;

console.log("\n=== Starting Performance Rating Test ===\n");

// Define the performance rating calculator
function calculatePerformanceRating(accuracy) {
    if (accuracy >= 95) return Math.round(2400 + (accuracy - 95) * 40);
    if (accuracy >= 90) return Math.round(2200 + (accuracy - 90) * 40);
    if (accuracy >= 85) return Math.round(2000 + (accuracy - 85) * 40);
    if (accuracy >= 80) return Math.round(1800 + (accuracy - 80) * 40);
    if (accuracy >= 75) return Math.round(1600 + (accuracy - 75) * 40);
    if (accuracy >= 70) return Math.round(1400 + (accuracy - 70) * 40);
    if (accuracy >= 60) return Math.round(1200 + (accuracy - 60) * 20);
    if (accuracy >= 50) return Math.round(1000 + (accuracy - 50) * 20);
    return Math.max(800, Math.round(800 + accuracy * 4));
}

// Add a debug message to the DOM
$(document).ready(function() {
    console.log("[PerformanceRating] Script loaded");
    if (!document.getElementById('performance-rating-debug')) {
        $("body").append('<div id="performance-rating-debug">Performance rating script loaded</div>');
        setTimeout(() => {
            $('#performance-rating-debug').fadeOut(3000);
        }, 5000);
    }
});

// Calculate performance ratings based on white's and black's accuracy
const whiteAccuracy = window.reportResults.accuracies.white;
const blackAccuracy = window.reportResults.accuracies.black;

console.log(`\nWhite accuracy: ${whiteAccuracy}% → Rating: ${calculatePerformanceRating(whiteAccuracy)}`);
console.log(`Black accuracy: ${blackAccuracy}% → Rating: ${calculatePerformanceRating(blackAccuracy)}\n`);

// Function to update performance ratings from report data
function updatePerformanceRatings() {
    const results = window.reportResults;
    
    console.log("[PerformanceRating] Report results:", results);
    
    if (results && results.accuracies) {
        const whiteAccuracy = results.accuracies.white;
        const blackAccuracy = results.accuracies.black;
        
        if (typeof whiteAccuracy === 'number' && typeof blackAccuracy === 'number') {
            const whitePerformanceRating = calculatePerformanceRating(whiteAccuracy);
            const blackPerformanceRating = calculatePerformanceRating(blackAccuracy);
            
            $("#white-performance-rating").html(whitePerformanceRating.toString());
            $("#black-performance-rating").html(blackPerformanceRating.toString());
            
            $("#performance-ratings-title").show();
        } else {
            $("#white-performance-rating").html("N/A");
            $("#black-performance-rating").html("N/A");
        }
    } else {
        $("#white-performance-rating").html("?");
        $("#black-performance-rating").html("?");
    }
}

// Run the update function
console.log("\n=== Running updatePerformanceRatings() ===\n");
updatePerformanceRatings();

console.log("\n=== Performance Rating Test Complete ===");
