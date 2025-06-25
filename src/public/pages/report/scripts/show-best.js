/**
 * Show Best Line Feature
 * 
 * Displays the top Stockfish line for the current position
 * Disabled when user's move was the best move
 */

(function() {
    let currentPosition = null;
    let lastPosition = null;

    /**
     * Initialize the Show Best button functionality
     */
    function initShowBest() {
        const showBestButton = document.getElementById('show-best-button');
        const modal = document.getElementById('best-line-modal');
        const closeButton = document.getElementById('close-best-line-modal');

        if (!showBestButton || !modal || !closeButton) {
            console.warn('[SHOW BEST] Required elements not found');
            return;
        }

        // Show best line on button click
        showBestButton.addEventListener('click', function() {
            if (showBestButton.classList.contains('disabled')) {
                return;
            }
            showBestLineModal();
        });

        // Close modal on close button click
        closeButton.addEventListener('click', function() {
            modal.style.display = 'none';
        });

        // Close modal on outside click
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && modal.style.display !== 'none') {
                modal.style.display = 'none';
            }
        });

        console.log('[SHOW BEST] Initialized successfully');
    }    /**
     * Update the show best button state based on current position
     */
    function updateShowBestButton(position, prevPosition) {
        currentPosition = position;
        lastPosition = prevPosition;
        
        const showBestButton = document.getElementById('show-best-button');
        if (!showBestButton) return;        console.log('[SHOW BEST] Updating button state', { 
            position: position, 
            prevPosition: prevPosition,
            hasCurrentTopLines: position?.topLines?.length > 0,
            hasPrevTopLines: prevPosition?.topLines?.length > 0,
            currentTopLines: position?.topLines,
            prevTopLines: prevPosition?.topLines
        });// For showing the best line, we want to show what the engine thinks is best FROM the previous position
        // So we need the analysis of the previous position (what was the best move from there)
        let analysisPosition = prevPosition;
        
        // If we don't have analysis for the previous position, try current position
        if (!prevPosition?.topLines?.length && position?.topLines?.length) {
            analysisPosition = position;
            console.log('[SHOW BEST] Using current position analysis instead');
        }

        // Check if we have enough data to show best line
        if (!analysisPosition || !analysisPosition.topLines || analysisPosition.topLines.length === 0) {
            showBestButton.classList.add('disabled');
            showBestButton.setAttribute('data-tooltip', 'No engine analysis available');
            console.log('[SHOW BEST] No analysis available');
            return;
        }

        const bestLine = analysisPosition.topLines[0];
        // The topLines structure has moveUCI and moveSAN directly, not in a moves array
        const bestMoveUci = bestLine.moveUCI;
        const bestMoveSan = bestLine.moveSAN;
        const playedMove = position.move;

        console.log('[SHOW BEST] Analysis found', {
            bestMoveUci: bestMoveUci,
            bestMoveSan: bestMoveSan,
            playedMove: playedMove?.san,
            playedMoveUci: playedMove?.uci,
            evaluation: bestLine.evaluation,
            topLinesCount: analysisPosition.topLines.length
        });        // If we're at the starting position or don't have a played move, just enable the button
        if (!playedMove) {
            showBestButton.classList.remove('disabled');
            showBestButton.setAttribute('data-tooltip', 'Show Best Line');
            console.log('[SHOW BEST] No played move, enabling button');
            return;
        }

        // Disable if user played the best move
        if (bestMoveUci && playedMove && bestMoveUci === playedMove.uci) {
            showBestButton.classList.add('disabled');
            showBestButton.setAttribute('data-tooltip', 'You played the best move!');
            console.log('[SHOW BEST] User played best move');
        } else {
            showBestButton.classList.remove('disabled');
            showBestButton.setAttribute('data-tooltip', 'Show Best Line');
            console.log('[SHOW BEST] Button enabled');
        }

        // Store the analysis position for the modal
        lastPosition = analysisPosition;
    }    /**
     * Show the best line modal
     */
    function showBestLineModal() {
        if (!lastPosition || !lastPosition.topLines || lastPosition.topLines.length === 0) {
            alert('No engine analysis available for this position');
            return;
        }

        const modal = document.getElementById('best-line-modal');
        const evalSpan = document.getElementById('best-line-eval');
        const depthSpan = document.getElementById('best-line-depth');
        const movesDiv = document.getElementById('best-line-moves');

        if (!modal || !evalSpan || !depthSpan || !movesDiv) {
            console.error('[SHOW BEST] Modal elements not found');
            return;
        }

        const bestLine = lastPosition.topLines[0];
        
        // Display evaluation
        let evalText = '';
        if (bestLine.evaluation.type === 'cp') {
            const evalValue = bestLine.evaluation.value / 100;
            evalText = evalValue > 0 ? `+${evalValue.toFixed(2)}` : evalValue.toFixed(2);
        } else if (bestLine.evaluation.type === 'mate') {
            const mateValue = bestLine.evaluation.value;
            evalText = mateValue > 0 ? `Mate in ${mateValue}` : `Mate in ${Math.abs(mateValue)}`;
        }
        evalSpan.textContent = evalText;

        // Display depth
        depthSpan.textContent = bestLine.depth || 'Unknown';

        // Display the best move and top alternatives
        movesDiv.innerHTML = '';
        
        // Show top 3 engine lines if available
        const linesToShow = Math.min(3, lastPosition.topLines.length);
        
        for (let i = 0; i < linesToShow; i++) {
            const line = lastPosition.topLines[i];
            const lineDiv = document.createElement('div');
            lineDiv.style.marginBottom = '10px';
            
            // Line header with evaluation
            const headerDiv = document.createElement('div');
            headerDiv.style.fontWeight = 'bold';
            headerDiv.style.color = '#47acff';
            headerDiv.style.marginBottom = '5px';
            
            let lineEval = '';
            if (line.evaluation.type === 'cp') {
                const evalValue = line.evaluation.value / 100;
                lineEval = evalValue > 0 ? `+${evalValue.toFixed(2)}` : evalValue.toFixed(2);
            } else if (line.evaluation.type === 'mate') {
                lineEval = `Mate in ${Math.abs(line.evaluation.value)}`;
            }
            
            headerDiv.textContent = `${i + 1}. ${lineEval}`;
            lineDiv.appendChild(headerDiv);
            
            // Best move
            const moveSpan = document.createElement('span');
            moveSpan.className = 'best-move';
            moveSpan.textContent = line.moveSAN || line.moveUCI;
            
            // Add click handler to show move details
            moveSpan.addEventListener('click', function() {
                alert(`Move: ${line.moveSAN || line.moveUCI}\nUCI: ${line.moveUCI}\nEvaluation: ${lineEval}`);
            });

            lineDiv.appendChild(moveSpan);
            movesDiv.appendChild(lineDiv);
        }

        // Show the modal
        modal.style.display = 'flex';
    }

    /**
     * Format evaluation for display
     */
    function formatEvaluation(evaluation) {
        if (evaluation.type === 'cp') {
            const value = evaluation.value / 100;
            return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
        } else if (evaluation.type === 'mate') {
            return `Mate in ${Math.abs(evaluation.value)}`;
        }
        return 'Unknown';
    }

    // Export functions for use by other modules
    window.showBestLine = {
        init: initShowBest,
        updateButton: updateShowBestButton,
        showModal: showBestLineModal
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initShowBest);
    } else {
        initShowBest();
    }

    console.log('[SHOW BEST] Module loaded');
})();
