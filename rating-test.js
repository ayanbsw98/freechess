// Test function to verify our adjusted formula matches chess.com sample
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

// Test with the chess.com sample values
const firstPlayer = 80.9;
const secondPlayer = 92.6;

console.log(`Player with ${firstPlayer}% accuracy: Rating = ${calculatePerformanceRating(firstPlayer)}`);
console.log(`Player with ${secondPlayer}% accuracy: Rating = ${calculatePerformanceRating(secondPlayer)}`);

// Test with other values to verify our formula's curve
console.log("\nTesting rating curve across different accuracy levels:");
[50, 60, 70, 75, 80, 85, 90, 95, 98, 100].forEach(accuracy => {
    console.log(`${accuracy}% accuracy -> ${calculatePerformanceRating(accuracy)} rating`);
});
