/**
 * Performance Rating Calculator - Standalone script that doesn't rely on TypeScript compilation
 * This script adds game performance ratings to the chess analysis report based on move accuracy
 */

// Performance Rating Calculator - Calibrated based on chess.com sample
function calculatePerformanceRating(accuracy) {
    // Based on the sample where 80.9% -> 1600 and 92.6% -> 1850
    if (accuracy >= 98) return Math.round(2200 + (accuracy - 98) * 30);   // 98-100% -> 2200-2260
    if (accuracy >= 95) return Math.round(2050 + (accuracy - 95) * 50);   // 95-98% -> 2050-2200
    if (accuracy >= 90) return Math.round(1800 + (accuracy - 90) * 50);   // 90-95% -> 1800-2050
    if (accuracy >= 85) return Math.round(1700 + (accuracy - 85) * 20);   // 85-90% -> 1700-1800
    if (accuracy >= 80) return Math.round(1550 + (accuracy - 80) * 30);   // 80-85% -> 1550-1700
    if (accuracy >= 75) return Math.round(1450 + (accuracy - 75) * 20);   // 75-80% -> 1450-1550
    if (accuracy >= 70) return Math.round(1350 + (accuracy - 70) * 20);   // 70-75% -> 1350-1450
    if (accuracy >= 60) return Math.round(1150 + (accuracy - 60) * 20);   // 60-70% -> 1150-1350
    if (accuracy >= 50) return Math.round(1000 + (accuracy - 50) * 15);   // 50-60% -> 1000-1150
    return Math.max(800, Math.round(800 + accuracy * 4));                // 0-50% -> 800-1000
}

// Add a debug message to the DOM
$(document).ready(function() {
    console.log("[PerformanceRating] Script loaded");
    if (!document.getElementById('performance-rating-debug')) {
        $("body").append('<div id="performance-rating-debug" style="position:fixed;bottom:5px;right:5px;background:#222;color:#fff;z-index:9999;padding:4px;font-size:12px;">Performance rating script loaded</div>');
        setTimeout(() => {
            $('#performance-rating-debug').fadeOut(3000);
        }, 5000);
    }
});

// Create a global accessor function to get report results from multiple possible sources
function getReportResults() {
    // Try multiple ways to access the report results
    if (window.reportResults) {
        return window.reportResults;
    }
    
    // Check for global variable without window prefix
    if (typeof reportResults !== 'undefined') {
        // Also set it on window for consistency
        window.reportResults = reportResults;
        return reportResults;
    }
    
    // If we're here, we couldn't find the report results
    return null;
}

// Update performance ratings
function updatePerformanceRatings() {
    const results = getReportResults();
    
    // Log to console for debugging
    console.log("[PerformanceRating] Report results:", results);
    
    if (results && results.accuracies) {
        const whiteAccuracy = results.accuracies.white;
        const blackAccuracy = results.accuracies.black;
        console.log("[PerformanceRating] Accuracies:", whiteAccuracy, blackAccuracy);
        
        if (typeof whiteAccuracy === 'number' && typeof blackAccuracy === 'number') {
            const whitePerformanceRating = calculatePerformanceRating(whiteAccuracy);
            const blackPerformanceRating = calculatePerformanceRating(blackAccuracy);
            
            // Update the performance rating display
            $("#white-performance-rating").html(whitePerformanceRating.toString());
            $("#black-performance-rating").html(blackPerformanceRating.toString());
            
            // Update debug info
            $("#performance-rating-debug").text('Ratings: ' + whitePerformanceRating + ' / ' + blackPerformanceRating);
            console.log("[PerformanceRating] Updated:", whitePerformanceRating, blackPerformanceRating);
            
            // Make the ratings container visible
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

// Patch the loadReportCards function to add performance ratings
$(document).ready(function() {
    // First try to get the original function
    const originalLoadReportCards = window.loadReportCards;
    
    // Define our patched function
    window.loadReportCards = function() {
        // Call the original function if it exists
        if (typeof originalLoadReportCards === 'function') {
            originalLoadReportCards();
        }
        
        // Delay slightly to ensure report data is fully loaded
        setTimeout(updatePerformanceRatings, 100);
    };
    
    // Set up event listeners
    $("#review-button").on("click", function() {
        // When review button is clicked, wait a bit longer for analysis to complete
        setTimeout(updatePerformanceRatings, 2000);
    });
    
    // Add a mutation observer to detect when the report data is updated
    const observer = new MutationObserver(function(mutations) {
        // If anything changes in the report cards, check if we need to update ratings
        setTimeout(updatePerformanceRatings, 100);
    });
    
    // Start observing the report cards container
    const reportCards = document.getElementById("report-cards");
    if (reportCards) {
        observer.observe(reportCards, { childList: true, subtree: true });
    }
    
    // Also check periodically
    setInterval(updatePerformanceRatings, 2000);
    
    // Try once on page load
    setTimeout(updatePerformanceRatings, 1000);
});
