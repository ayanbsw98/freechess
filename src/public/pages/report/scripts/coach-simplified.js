/**
 * Chess Coach Module - Simplified and Accurate
 * 
 * Provides reliable move analysis focusing on evaluation changes,
 * material gains/losses, and basic positional concepts.
 */

(function() {
    // Piece values for material calculation
    const PIECE_VALUES = {
        'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0
    };

    /**
     * Detect material gain/loss from evaluation and move context
     */
    function detectMaterialChange(position, lastPosition) {
        // Check if move notation indicates capture
        if (position.move && position.move.san && position.move.san.includes('x')) {
            return {
                type: 'capture',
                gained: true,
                description: 'Material captured'
            };
        }
        return null;
    }

    /**
     * Detect mate threats from evaluation
     */
    function detectMateThreats(position) {
        if (!position.topLines || position.topLines.length === 0) return null;
        
        const topLine = position.topLines[0];
        if (topLine.evaluation.type === "mate") {
            const mateIn = Math.abs(topLine.evaluation.value);
            return {
                type: 'mate',
                distance: mateIn,
                description: `Mate in ${mateIn}`
            };
        }
        return null;
    }

    /**
     * Detect basic positional improvements
     */
    function detectPositionalGains(position) {
        if (!position.move) return [];
        
        const gains = [];
        const move = position.move;
        
        // Check for piece development (moving from back ranks)
        if (move.uci && move.uci.length >= 4) {
            const fromRank = move.uci[1];
            const toRank = move.uci[3];
            
            if ((fromRank === '1' || fromRank === '2' || fromRank === '7' || fromRank === '8') &&
                (toRank !== '1' && toRank !== '2' && toRank !== '7' && toRank !== '8')) {
                gains.push({
                    type: 'development',
                    description: 'Piece development'
                });
            }
        }
        
        return gains;
    }

    /**
     * Analyze move with simple, reliable pattern detection
     */
    function explainMove(position, lastPosition) {
        console.log('[COACH DEBUG] Simplified explainMove called', { position, lastPosition });
        
        let evalBefore = 0;
        let evalAfter = 0;
        
        // Get evaluations
        if (lastPosition.topLines && lastPosition.topLines.length > 0) {
            evalBefore = lastPosition.topLines[0].evaluation.type === "cp" 
                ? lastPosition.topLines[0].evaluation.value / 100 
                : (lastPosition.topLines[0].evaluation.value > 0 ? 100 : -100);
        }
        
        if (position.topLines && position.topLines.length > 0) {
            evalAfter = position.topLines[0].evaluation.type === "cp" 
                ? position.topLines[0].evaluation.value / 100 
                : (position.topLines[0].evaluation.value > 0 ? 100 : -100);
        }
        
        const evalDiff = evalAfter - evalBefore;
        
        // Detect patterns
        const materialChange = detectMaterialChange(position, lastPosition);
        const matePattern = detectMateThreats(position);
        const positionalGains = detectPositionalGains(position);
        
        // Get best move info
        let bestMove = "";
        if (lastPosition.topLines && lastPosition.topLines.length > 0 && 
            lastPosition.topLines[0].moves && lastPosition.topLines[0].moves.length > 0) {
            bestMove = lastPosition.topLines[0].moves[0].san;
        }
        
        // Generate explanations
        const summary = generateSummary(position.move?.san || "", bestMove, evalDiff, materialChange, matePattern, positionalGains);
        const detailedExplanation = generateDetailedExplanation(
            position.move?.san || "", bestMove, evalBefore, evalAfter, evalDiff, materialChange, matePattern, positionalGains
        );
        
        return {
            evalBefore,
            evalAfter,
            evalDiff,
            bestMove,
            materialChange,
            matePattern,
            positionalGains,
            summary,
            detailedExplanation
        };
    }

    /**
     * Generate simple, accurate summary
     */
    function generateSummary(movePlayed, bestMove, evalDiff, materialChange, matePattern, positionalGains) {
        // Prioritize mate threats
        if (matePattern) {
            return `Excellent! ${movePlayed} sets up ${matePattern.description}.`;
        }
        
        // Material changes
        if (materialChange && materialChange.gained) {
            return `Good! ${movePlayed} captures material.`;
        }
        
        // Large evaluation swings
        if (evalDiff >= 1.5) {
            return `Excellent move! ${movePlayed} gives you a significant advantage.`;
        } else if (evalDiff <= -1.5) {
            return `This was a mistake. ${movePlayed} gives your opponent a big advantage.`;
        } else if (evalDiff >= 0.5) {
            return `Good move! ${movePlayed} improves your position.`;
        } else if (evalDiff <= -0.5) {
            return `Inaccurate. ${movePlayed} worsens your position.${bestMove ? ` ${bestMove} was better.` : ''}`;
        }
        
        // Positional gains
        if (positionalGains.length > 0) {
            return `${movePlayed} improves your piece activity.`;
        }
        
        // Default based on evaluation
        if (evalDiff > 0.1) {
            return `${movePlayed} slightly improves your position.`;
        } else if (evalDiff < -0.1) {
            return `${movePlayed} slightly weakens your position.`;
        } else {
            return `${movePlayed} maintains the balance.`;
        }
    }

    /**
     * Generate detailed explanation
     */
    function generateDetailedExplanation(movePlayed, bestMove, evalBefore, evalAfter, evalDiff, materialChange, matePattern, positionalGains) {
        let explanation = `The evaluation changed from ${evalBefore.toFixed(2)} to ${evalAfter.toFixed(2)}. `;
        
        // Explain the change
        if (Math.abs(evalDiff) >= 1.5) {
            if (evalDiff > 0) {
                explanation += `This is a significant improvement that gives you a clear advantage. `;
            } else {
                explanation += `This is a serious error that gives your opponent a clear advantage. `;
                if (bestMove) {
                    explanation += `${bestMove} would have been much better. `;
                }
            }
        } else if (Math.abs(evalDiff) >= 0.5) {
            if (evalDiff > 0) {
                explanation += `This move improves your position noticeably. `;
            } else {
                explanation += `This move makes your position worse. `;
                if (bestMove) {
                    explanation += `${bestMove} was the preferred continuation. `;
                }
            }
        } else {
            explanation += `The position remains roughly balanced. `;
        }
        
        // Add specific pattern explanations
        if (matePattern) {
            explanation += `You've created a forcing sequence leading to checkmate in ${matePattern.distance} moves. `;
        }
        
        if (materialChange && materialChange.gained) {
            explanation += `You've won material, which is typically a decisive advantage. `;
        }
        
        if (positionalGains.length > 0) {
            explanation += `This move also improves your piece coordination and development. `;
        }
        
        return explanation.trim();
    }

    /**
     * Display coach explanation
     */
    function displayCoachExplanation(explanation) {
        console.log('[COACH DEBUG] displayCoachExplanation called', explanation);
        const coachContainer = $("#coach-container");
        
        // Update coach sentiment based on evaluation
        coachContainer.removeClass("coach-positive coach-negative coach-neutral");
        
        if (explanation.evalDiff >= 0.5 || explanation.matePattern || (explanation.materialChange && explanation.materialChange.gained)) {
            coachContainer.addClass("coach-positive");
        } else if (explanation.evalDiff <= -0.5) {
            coachContainer.addClass("coach-negative");
        } else {
            coachContainer.addClass("coach-neutral");
        }
        
        // Update content
        $("#coach-summary").text(explanation.summary);
        $("#coach-detailed").text(explanation.detailedExplanation);
        
        // Show the coach container
        coachContainer.show();
    }

    /**
     * Main function to analyze current position and provide coaching
     */
    function updateCoach(position, lastPosition) {
        console.log('[COACH DEBUG] updateCoach called', { position, lastPosition });
        
        if (!position || !lastPosition || !position.move) {
            $("#coach-container").hide();
            return;
        }
        
        // Generate explanation
        const explanation = explainMove(position, lastPosition);
        
        // Display in UI
        displayCoachExplanation(explanation);
    }

    // Export functions
    window.chessCoach = {
        updateCoach,
        explainMove
    };

    console.log('[COACH DEBUG] Simplified chess coach module loaded');
})();
