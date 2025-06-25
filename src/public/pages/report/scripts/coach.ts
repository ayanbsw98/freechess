/**
 * Chess Coach Module
 * 
 * Provides tactical pattern detection and move explanations for the chess analysis report.
 * This module analyzes positions and provides human-readable explanations of what happened in a move.
 */

// Types of tactical patterns the coach can detect
type TacticalPattern = 
    | 'materialGain'       // Capturing a piece with positive material balance
    | 'materialLoss'       // Losing material 
    | 'fork'               // Attacking multiple pieces at once
    | 'pin'                // Pinning a piece against a more valuable one
    | 'discovery'          // A discovered attack
    | 'skewer'             // Similar to a pin but attacking a more valuable piece first
    | 'doubleCheck'        // Attacking the king with two pieces
    | 'zugzwang'           // Forcing opponent to make a bad move
    | 'tempo'              // Gaining time/initiative
    | 'attackingKing'      // Increasing pressure on the king
    | 'defensiveMove'      // Preventing threats or protecting pieces
    | 'developingMove'     // Developing pieces in the opening
    | 'positionalGain'     // Improving piece position
    | 'missedOpportunity'  // Missing a good move
    | 'blunderTactic'      // Missing an opponent's tactic
    | 'preventingThreat'   // Preventing an opponent's threat

// Structure for detected patterns
interface PatternDetection {
    type: TacticalPattern;
    description: string;
    severity: number;       // 1-10 scale of importance 
    pieces?: string[];      // Pieces involved in the pattern (e.g., "e4", "d5")
}

// Structure to store explanation data
interface MoveExplanation {
    patterns: PatternDetection[];
    evalBefore: number;     // Evaluation before the move
    evalAfter: number;      // Evaluation after the move
    evalDiff: number;       // Difference in evaluation
    bestMove: string;       // Best move according to the engine
    bestMoveEval: number;   // Evaluation of best move
    missedEvaluation: number; // How much evaluation was missed
    summary: string;        // Human-readable summary of the move
    detailedExplanation: string; // Detailed explanation
}

// Piece values for material calculation
const PIECE_VALUES = {
    'p': 1,    // pawn
    'n': 3,    // knight
    'b': 3,    // bishop
    'r': 5,    // rook
    'q': 9,    // queen
    'k': 0     // king has no material value
};

/**
 * Convert evaluation from centipawns to a readable format
 */
function formatEvaluation(evaluation: Evaluation): string {
    if (evaluation.type === "mate") {
        return evaluation.value > 0 
            ? `Mate in ${Math.abs(evaluation.value)}` 
            : `Getting mated in ${Math.abs(evaluation.value)}`;
    } else {
        const evalNum = evaluation.value / 100;
        if (evalNum > 0) {
            return `+${evalNum.toFixed(2)}`;
        } else {
            return evalNum.toFixed(2);
        }
    }
}

/**
 * Check if a move captures a piece
 */
function isCapture(position: Position, lastPosition: Position): boolean {
    // Count pieces before and after
    const piecesCountBefore = countPieces(lastPosition.fen);
    const piecesCountAfter = countPieces(position.fen);
    
    // If there's one fewer piece after the move, it was a capture
    return Object.values(piecesCountAfter).reduce((a, b) => a + b, 0) < 
           Object.values(piecesCountBefore).reduce((a, b) => a + b, 0);
}

/**
 * Count pieces on the board from FEN
 */
function countPieces(fen: string): Record<string, number> {
    const result: Record<string, number> = {
        'p': 0, 'n': 0, 'b': 0, 'r': 0, 'q': 0, 'k': 0,
        'P': 0, 'N': 0, 'B': 0, 'R': 0, 'Q': 0, 'K': 0
    };
    
    // Get the piece placement part of FEN
    const placement = fen.split(' ')[0];
    
    // Count each piece
    for (const char of placement) {
        if (result[char] !== undefined) {
            result[char]++;
        }
    }
    
    return result;
}

/**
 * Compare piece counts to determine material change
 */
function getMaterialDifference(
    beforePieces: Record<string, number>, 
    afterPieces: Record<string, number>
): number {
    let diff = 0;
    
    // Calculate white material (uppercase)
    Object.keys(PIECE_VALUES).forEach(piece => {
        const upperPiece = piece.toUpperCase();
        diff += (afterPieces[upperPiece] - beforePieces[upperPiece]) * PIECE_VALUES[piece];
    });
    
    // Subtract black material (lowercase)
    Object.keys(PIECE_VALUES).forEach(piece => {
        diff -= (afterPieces[piece] - beforePieces[piece]) * PIECE_VALUES[piece];
    });
    
    return diff;
}

/**
 * Detect if a move developed a piece (moved it from its starting position)
 */
function detectDevelopingMove(position: Position): boolean {
    // This is a simplistic implementation - a full one would check if pieces
    // moved from starting squares and improved their position
    const move = position.move?.uci;
    if (!move) return false;
    
    // Check if it's a move from starting rank
    const fromRank = move.charAt(1);
    const piece = getPieceAtSquare(position.fen, move.substring(0, 2));
    
    // For white pieces
    if (piece && piece === piece.toUpperCase() && fromRank === '1' || fromRank === '2') {
        return true;
    }
    // For black pieces
    else if (piece && piece === piece.toLowerCase() && fromRank === '7' || fromRank === '8') {
        return true;
    }
    
    return false;
}

/**
 * Get the piece at a specific square from FEN
 */
function getPieceAtSquare(fen: string, square: string): string | null {
    const [file, rank] = square.split('');
    const fileIndex = 'abcdefgh'.indexOf(file);
    const rankIndex = 8 - parseInt(rank);
    
    if (fileIndex === -1 || rankIndex < 0 || rankIndex > 7) {
        return null;
    }
    
    const rows = fen.split(' ')[0].split('/');
    let row = rows[rankIndex];
    
    // Expand the FEN row representation
    let expandedRow = '';
    for (const char of row) {
        if ('12345678'.includes(char)) {
            expandedRow += '.'.repeat(parseInt(char));
        } else {
            expandedRow += char;
        }
    }
    
    const piece = expandedRow.charAt(fileIndex);
    return piece === '.' ? null : piece;
}

/**
 * Detect if a move puts a piece in danger
 */
function detectPieceInDanger(position: Position): boolean {
    // For a complete implementation, we would need to track attacked squares
    // This would require a more sophisticated board representation
    return false;
}

/**
 * Check if the evaluation difference indicates a blunder
 */
function isBlunder(evalDiff: number): boolean {
    return evalDiff <= -1.5; // More than 1.5 pawns worse
}

/**
 * Check if the evaluation difference indicates a good move
 */
function isGoodMove(evalDiff: number): boolean {
    return evalDiff >= 0.5; // At least 0.5 pawns better
}

/**
 * Determine if a move is improving king safety
 */
function detectKingSafety(position: Position, lastPosition: Position): boolean {
    // Would need a more complete implementation to properly assess king safety
    return false;
}

/**
 * Generate a complete explanation for a move
 */
function explainMove(position: Position, lastPosition: Position): MoveExplanation {
    const patterns: PatternDetection[] = [];
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
    
    // Best move info
    let bestMove = "";
    let bestMoveEval = evalBefore;
    let missedEvaluation = 0;
    
    if (lastPosition.topLines && lastPosition.topLines.length > 0) {
        bestMove = lastPosition.topLines[0].moveSAN || "";
    }
    
    // Detect material change
    if (isCapture(position, lastPosition)) {
        const beforePieces = countPieces(lastPosition.fen);
        const afterPieces = countPieces(position.fen);
        const materialDiff = getMaterialDifference(beforePieces, afterPieces);
        
        if (materialDiff > 0) {
            patterns.push({
                type: "materialGain",
                description: "Captured opponent's piece",
                severity: Math.min(materialDiff * 2, 10)
            });
        } else if (materialDiff < 0) {
            patterns.push({
                type: "materialLoss",
                description: "Lost material",
                severity: Math.min(Math.abs(materialDiff) * 2, 10)
            });
        }
    }
    
    // Detect developing move
    if (detectDevelopingMove(position)) {
        patterns.push({
            type: "developingMove",
            description: "Developed a piece",
            severity: 3
        });
    }
    
    // Classify move quality based on evaluation difference
    if (isBlunder(evalDiff)) {
        patterns.push({
            type: "blunderTactic",
            description: "Significantly worse than the best move",
            severity: Math.min(Math.abs(evalDiff) * 2, 10)
        });
        
        missedEvaluation = Math.abs(evalDiff);
    } else if (isGoodMove(evalDiff)) {
        patterns.push({
            type: "positionalGain",
            description: "Found a good move that improves the position",
            severity: Math.min(evalDiff * 2, 10)
        });
    }
    
    // Check if the best move was played
    if (position.move?.san === bestMove) {
        patterns.push({
            type: "positionalGain",
            description: "Played the best move according to the engine",
            severity: 8
        });
    }
    
    // Generate summary based on patterns
    const summary = generateSummary(patterns, position.move?.san || "", bestMove, evalDiff);
    
    // Generate detailed explanation
    const detailedExplanation = generateDetailedExplanation(
        patterns, position.move?.san || "", bestMove, evalBefore, evalAfter, evalDiff
    );
    
    return {
        patterns,
        evalBefore,
        evalAfter,
        evalDiff,
        bestMove,
        bestMoveEval,
        missedEvaluation,
        summary,
        detailedExplanation
    };
}

/**
 * Generate a brief summary of the move
 */
function generateSummary(
    patterns: PatternDetection[], 
    movePlayed: string, 
    bestMove: string,
    evalDiff: number
): string {
    // Find the most severe pattern
    patterns.sort((a, b) => b.severity - a.severity);
    
    if (patterns.length === 0) {
        return `${movePlayed} is a neutral move.`;
    }
    
    const mainPattern = patterns[0];
    
    // Create summary based on pattern type
    switch (mainPattern.type) {
        case "materialGain":
            return `Good capture! ${movePlayed} gains material.`;
        case "materialLoss":
            return `${movePlayed} loses material.`;
        case "blunderTactic":
            return `${movePlayed} misses a better opportunity. ${bestMove} was better.`;
        case "positionalGain":
            if (movePlayed === bestMove) {
                return `${movePlayed} is the best move! Great job.`;
            } else {
                return `${movePlayed} improves your position.`;
            }
        case "developingMove":
            return `${movePlayed} develops a piece.`;
        default:
            if (evalDiff > 0) {
                return `${movePlayed} is a good move.`;
            } else if (evalDiff < -0.5) {
                return `${movePlayed} is not the best move. ${bestMove} was better.`;
            } else {
                return `${movePlayed} maintains the position.`;
            }
    }
}

/**
 * Generate a detailed explanation of the move
 */
function generateDetailedExplanation(
    patterns: PatternDetection[],
    movePlayed: string,
    bestMove: string,
    evalBefore: number,
    evalAfter: number,
    evalDiff: number
): string {
    let explanation = ``;
    
    // Start with evaluation context
    explanation += `The position evaluation ${evalDiff > 0 ? 'improved' : 'worsened'} from ${evalBefore.toFixed(2)} to ${evalAfter.toFixed(2)}. `;
    
    // Add pattern-specific explanations
    patterns.forEach(pattern => {
        switch (pattern.type) {
            case "materialGain":
                explanation += `This move captures a piece, gaining material advantage. `;
                break;
            case "materialLoss":
                explanation += `This move loses material without sufficient compensation. `;
                break;
            case "blunderTactic":
                explanation += `This move misses a better opportunity. `;
                if (bestMove) {
                    explanation += `${bestMove} would have been stronger, maintaining a better position. `;
                }
                break;
            case "positionalGain":
                explanation += `This move improves your piece positioning and control. `;
                break;
            case "developingMove":
                explanation += `This move develops a piece from its starting position, contributing to controlling the center and preparing for middlegame. `;
                break;
            default:
                break;
        }
    });
    
    // Provide a comparison with best move if applicable
    if (bestMove && movePlayed !== bestMove && evalDiff < -0.3) {
        explanation += `The engine suggests ${bestMove} which would have been about ${Math.abs(evalDiff).toFixed(1)} pawns better. `;
    }
    
    return explanation;
}

/**
 * Create coach UI and display explanation
 */
function displayCoachExplanation(explanation: MoveExplanation) {
    const coachContainer = $("#coach-container");
    
    // Update content
    $("#coach-summary").text(explanation.summary);
    $("#coach-detailed").text(explanation.detailedExplanation);
    
    // Show the coach container
    coachContainer.show();
}

/**
 * Main function to analyze current position and provide coaching
 */
function updateCoach(position: Position, lastPosition: Position) {
    // Check if both positions exist
    if (!position || !lastPosition || !position.move) {
        $("#coach-container").hide();
        return;
    }
    
    // Generate explanation
    const explanation = explainMove(position, lastPosition);
    
    // Display in UI
    displayCoachExplanation(explanation);
}

// Export functions for use in other modules
window.chessCoach = {
    updateCoach,
    explainMove
};
