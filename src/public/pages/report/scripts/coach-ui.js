/**
 * Coach UI interactions
 */
$(document).ready(function() {
    // Coach toggle button functionality
    $("#coach-toggle").on("click", function() {
        const container = $("#coach-container");
        const icon = $(this).find("i");
        
        if (container.hasClass("coach-collapsed")) {
            // Expand
            container.removeClass("coach-collapsed");
            icon.removeClass("fa-chevron-up").addClass("fa-chevron-down");
        } else {
            // Collapse
            container.addClass("coach-collapsed");
            icon.removeClass("fa-chevron-down").addClass("fa-chevron-up");
        }
    });
    
    // Set initial state to collapsed
    $("#coach-container").addClass("coach-collapsed");
    
    // Add window.chessCoach to types
    if (typeof window.chessCoach === 'undefined') {
        window.chessCoach = {
            updateCoach: function() {
                console.log("Coach module not loaded yet.");
            },
            explainMove: function() {
                return {
                    summary: "Analysis not available.",
                    detailedExplanation: "The coach module is still loading."
                };
            }
        };
    }
});
