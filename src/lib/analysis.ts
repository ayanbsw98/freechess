import { Chess, Square } from "chess.js";

import { EvaluatedPosition } from "./types/Position";
import Report from "./types/Report";

import {
    Classification, 
    centipawnClassifications, 
    classificationValues, 
    getEvaluationLossThreshold 
} from "./classification";
import { InfluencingPiece, getAttackers, isPieceHanging, pieceValues, promotions } from "./board";

import openings from "../resources/openings.json";

// Function to calculate performance rating based on accuracy percentage
function calculatePerformanceRating(accuracy: number): number {
    // Performance rating formula based on move accuracy
    // This is a simplified model that maps accuracy to estimated rating
    if (accuracy >= 95) return 2400 + (accuracy - 95) * 40; // 2400-2600+ for 95-100%
    if (accuracy >= 90) return 2200 + (accuracy - 90) * 40; // 2200-2400 for 90-95%
    if (accuracy >= 85) return 2000 + (accuracy - 85) * 40; // 2000-2200 for 85-90%
    if (accuracy >= 80) return 1800 + (accuracy - 80) * 40; // 1800-2000 for 80-85%
    if (accuracy >= 75) return 1600 + (accuracy - 75) * 40; // 1600-1800 for 75-80%
    if (accuracy >= 70) return 1400 + (accuracy - 70) * 40; // 1400-1600 for 70-75%
    if (accuracy >= 60) return 1200 + (accuracy - 60) * 20; // 1200-1400 for 60-70%
    if (accuracy >= 50) return 1000 + (accuracy - 50) * 20; // 1000-1200 for 50-60%
    return Math.max(800, 800 + accuracy * 4); // 800+ for below 50%
}

async function analyse(positions: EvaluatedPosition[]): Promise<Report> {
    
    // Generate classifications for each position
    let positionIndex = 0;
    for (let position of positions.slice(1)) {

        positionIndex++;

        let board = new Chess(position.fen);

        let lastPosition = positions[positionIndex - 1];

        let topMove = lastPosition.topLines.find(line => line.id == 1);
        let secondTopMove = lastPosition.topLines.find(line => line.id == 2);
        if (!topMove) continue;

        let previousEvaluation = topMove.evaluation;
        let evaluation = position.topLines.find(line => line.id == 1)?.evaluation;
        if (!previousEvaluation) continue;

        let moveColour = position.fen.includes(" b ") ? "white" : "black";

        // If there are no legal moves in this position, game is in terminal state
        if (!evaluation) {
            evaluation = { type: board.isCheckmate() ? "mate" : "cp", value: 0 };
            position.topLines.push({
                id: 1,
                depth: 0,
                evaluation: evaluation,
                moveUCI: ""
            });
        }

        let absoluteEvaluation = evaluation.value * (moveColour == "white" ? 1 : -1);
        let previousAbsoluteEvaluation = previousEvaluation.value * (moveColour == "white" ? 1 : -1);

        let absoluteSecondEvaluation = (secondTopMove?.evaluation.value ?? 0) * (moveColour == "white" ? 1 : -1);
        
        // Calculate evaluation loss as a result of this move
        let evalLoss = Infinity;
        let cutoffEvalLoss = Infinity;
        let lastLineEvalLoss = Infinity;

        let matchingTopLine = lastPosition.topLines.find(line => line.moveUCI == position.move.uci);
        if (matchingTopLine) {
            if (moveColour == "white") {
                lastLineEvalLoss = previousEvaluation.value - matchingTopLine.evaluation.value;
            } else {
                lastLineEvalLoss = matchingTopLine.evaluation.value - previousEvaluation.value;
            }
        }

        if (lastPosition.cutoffEvaluation) {
            if (moveColour == "white") {
                cutoffEvalLoss = lastPosition.cutoffEvaluation.value - evaluation.value;
            } else {
                cutoffEvalLoss = evaluation.value - lastPosition.cutoffEvaluation.value;
            }   
        }

        if (moveColour == "white") {
            evalLoss = previousEvaluation.value - evaluation.value;
        } else {
            evalLoss = evaluation.value - previousEvaluation.value;
        }

        evalLoss = Math.min(evalLoss, cutoffEvalLoss, lastLineEvalLoss);

        // If this move was the only legal one, apply forced
        if (!secondTopMove) {
            position.classification = Classification.FORCED;
            continue;
        }

        let noMate = previousEvaluation.type == "cp" && evaluation.type == "cp";

        // If it is the top line, disregard other detections and give best
        if (topMove.moveUCI == position.move.uci) {
            position.classification = Classification.BEST;
        } else {
            // If no mate on the board last move and still no mate
            if (noMate) {
                for (let classif of centipawnClassifications) {
                    if (evalLoss <= getEvaluationLossThreshold(classif, previousEvaluation.value)) {
                        position.classification = classif;
                        break;
                    }
                }
            }

            // If no mate last move but you blundered a mate
            else if (previousEvaluation.type == "cp" && evaluation.type == "mate") {
                if (absoluteEvaluation > 0) {
                    position.classification = Classification.BEST;
                } else if (absoluteEvaluation >= -2) {
                    position.classification = Classification.BLUNDER;
                } else if (absoluteEvaluation >= -5) {
                    position.classification = Classification.MISTAKE;
                } else {
                    position.classification = Classification.INACCURACY;
                }
            }

            // If mate last move and there is no longer a mate
            else if (previousEvaluation.type == "mate" && evaluation.type == "cp") {
                if (previousAbsoluteEvaluation < 0 && absoluteEvaluation < 0) {
                    position.classification = Classification.BEST;
                } else if (absoluteEvaluation >= 400) {
                    position.classification = Classification.GOOD;
                } else if (absoluteEvaluation >= 150) {
                    position.classification = Classification.INACCURACY;
                } else if (absoluteEvaluation >= -100) {
                    position.classification = Classification.MISTAKE;
                } else {
                    position.classification = Classification.BLUNDER;
                }
            }

            // If mate last move and forced mate still exists
            else if (previousEvaluation.type == "mate" && evaluation.type == "mate") {
                if (previousAbsoluteEvaluation > 0) {
                    if (absoluteEvaluation <= -4) {
                        position.classification = Classification.MISTAKE;
                    } else if (absoluteEvaluation < 0) {
                        position.classification = Classification.BLUNDER
                    } else if (absoluteEvaluation < previousAbsoluteEvaluation) {
                        position.classification = Classification.BEST;
                    } else if (absoluteEvaluation <= previousAbsoluteEvaluation + 2) {
                        position.classification = Classification.EXCELLENT;
                    } else {
                        position.classification = Classification.GOOD;
                    }
                } else {
                    if (absoluteEvaluation == previousAbsoluteEvaluation) {
                        position.classification = Classification.BEST;
                    } else {
                        position.classification = Classification.GOOD;
                    }
                }
            }

        }

        // If current verdict is best, check for possible brilliancy
        if (position.classification == Classification.BEST) {
            // Test for brilliant move classification
            // Must be winning for the side that played the brilliancy
            let winningAnyways = (
                absoluteSecondEvaluation >= 700 && topMove.evaluation.type == "cp"
                || (topMove.evaluation.type == "mate" && secondTopMove.evaluation.type == "mate")
            );

            if (absoluteEvaluation >= 0 && !winningAnyways && !position.move.san.includes("=")) {
                let lastBoard = new Chess(lastPosition.fen);
                let currentBoard = new Chess(position.fen);
                if (lastBoard.isCheck()) continue;

                let lastPiece = lastBoard.get(position.move.uci.slice(2, 4) as Square) || { type: "m" };

                let sacrificedPieces: InfluencingPiece[] = [];
                for (let row of currentBoard.board()) {
                    for (let piece of row) {
                        if (!piece) continue;
                        if (piece.color != moveColour.charAt(0)) continue;
                        if (piece.type == "k" || piece.type == "p") continue;

                        // If the piece just captured is of higher or equal value than the candidate
                        // hanging piece, not hanging, better trade happening somewhere else
                        if (pieceValues[lastPiece.type] >= pieceValues[piece.type]) {
                            continue;
                        }

                        // If the piece is otherwise hanging, brilliant
                        if (isPieceHanging(lastPosition.fen, position.fen, piece.square)) {
                            position.classification = Classification.BRILLIANT;
                            sacrificedPieces.push(piece);
                        }
                    }
                }

                // If all captures of all of your hanging pieces would result in an enemy piece
                // of greater or equal value also being hanging OR mate in 1, not brilliant
                let anyPieceViablyCapturable = false;
                let captureTestBoard = new Chess(position.fen);

                for (let piece of sacrificedPieces) {
                    let attackers = getAttackers(position.fen, piece.square);

                    for (let attacker of attackers) {
                        for (let promotion of promotions) {
                            try {
                                captureTestBoard.move({
                                    from: attacker.square,
                                    to: piece.square,
                                    promotion: promotion
                                });

                                // If the capture of the piece with the current attacker leads to
                                // a piece of greater or equal value being hung (if attacker is pinned)
                                let attackerPinned = false;
                                for (let row of captureTestBoard.board()) {
                                    for (let enemyPiece of row) {
                                        if (!enemyPiece) continue;
                                        if (enemyPiece.color == captureTestBoard.turn()) continue;
                                        if (enemyPiece.type == "k" || enemyPiece.type == "p") continue;
                
                                        if (
                                            isPieceHanging(position.fen, captureTestBoard.fen(), enemyPiece.square)
                                            && pieceValues[enemyPiece.type] >= Math.max(...sacrificedPieces.map(sack => pieceValues[sack.type]))
                                        ) {
                                            attackerPinned = true;
                                            break;
                                        }
                                    }
                                    if (attackerPinned) break;
                                }
                                
                                // If the sacked piece is a rook or more in value, given brilliant
                                // regardless of taking it leading to mate in 1. If it less than a
                                // rook, only give brilliant if its capture cannot lead to mate in 1
                                if (pieceValues[piece.type] >= 5) {
                                    if (!attackerPinned) {
                                        anyPieceViablyCapturable = true;
                                        break;
                                    }
                                } else if (
                                    !attackerPinned
                                    && !captureTestBoard.moves().some(move => move.endsWith("#"))
                                ) {
                                    anyPieceViablyCapturable = true;
                                    break;
                                }

                                captureTestBoard.undo();
                            } catch {}
                        }

                        if (anyPieceViablyCapturable) break;
                    }

                    if (anyPieceViablyCapturable) break;
                }

                if (!anyPieceViablyCapturable) {
                    position.classification = Classification.BEST;
                }
            }

            // Test for great move classification
            try {
                if (
                    noMate
                    && position.classification != Classification.BRILLIANT
                    && lastPosition.classification == Classification.BLUNDER
                    && Math.abs(topMove.evaluation.value - secondTopMove.evaluation.value) >= 150
                    && !isPieceHanging(lastPosition.fen, position.fen, position.move.uci.slice(2, 4) as Square)
                ) {
                    position.classification = Classification.GREAT;
                }
            } catch {}
        }

        // Do not allow blunder if move still completely winning
        if (position.classification == Classification.BLUNDER && absoluteEvaluation >= 600) {
            position.classification = Classification.GOOD;
        }

        // Do not allow blunder if you were already in a completely lost position
        if (
            position.classification == Classification.BLUNDER 
            && previousAbsoluteEvaluation <= -600
            && previousEvaluation.type == "cp"
            && evaluation.type == "cp"
        ) {
            position.classification = Classification.GOOD;
        }

        position.classification ??= Classification.BOOK;

    }

    // Generate opening names for named positions
    for (let position of positions) {
        let opening = openings.find(opening => position.fen.includes(opening.fen));
        position.opening = opening?.name;
    }

    // Apply book moves for cloud evaluations and named positions
    let positiveClassifs = Object.keys(classificationValues).slice(4, 8);
    for (let position of positions.slice(1)) {
        if (
            (position.worker == "cloud" && positiveClassifs.includes(position.classification!))
            || position.opening
        ) {
            position.classification = Classification.BOOK;
        } else {
            break;
        }
    }

    // Generate SAN moves from all engine lines
    // This is used for the engine suggestions card on the frontend
    for (let position of positions) {
        for (let line of position.topLines) {
            if (line.evaluation.type == "mate" && line.evaluation.value == 0) continue;

            let board = new Chess(position.fen);

            try {
                line.moveSAN = board.move({
                    from: line.moveUCI.slice(0, 2),
                    to: line.moveUCI.slice(2, 4),
                    promotion: line.moveUCI.slice(4) || undefined
                }).san;
            } catch {
                line.moveSAN = "";
            }
        }
    }

    // Calculate computer accuracy percentages
    let accuracies = {
        white: {
            current: 0,
            maximum: 0
        },
        black: {
            current: 0,
            maximum: 0
        }
    };
    const classifications = {
        white: {
            brilliant: 0,
            great: 0,
            best: 0,
            excellent: 0,
            good: 0,
            inaccuracy: 0,
            mistake: 0,
            blunder: 0,
            book: 0,
            forced: 0,
        },
        black: {
            brilliant: 0,
            great: 0,
            best: 0,
            excellent: 0,
            good: 0,
            inaccuracy: 0,
            mistake: 0,
            blunder: 0,
            book: 0,
            forced: 0,
        }
    };

    for (let position of positions.slice(1)) {
        const moveColour = position.fen.includes(" b ") ? "white" : "black";

        accuracies[moveColour].current += classificationValues[position.classification!];
        accuracies[moveColour].maximum++;        classifications[moveColour][position.classification!] += 1;
    }    // Calculate performance ratings based on accuracies
    const whiteAccuracy = accuracies.white.current / accuracies.white.maximum * 100;
    const blackAccuracy = accuracies.black.current / accuracies.black.maximum * 100;

    console.log("DEBUG: Accuracies calculated", { whiteAccuracy, blackAccuracy });

    // Calculate performance ratings using a simpler inline approach
    const calculateRating = (acc: number) => {
        if (acc >= 95) return Math.round(2400 + (acc - 95) * 40);
        if (acc >= 90) return Math.round(2200 + (acc - 90) * 40);
        if (acc >= 85) return Math.round(2000 + (acc - 85) * 40);
        if (acc >= 80) return Math.round(1800 + (acc - 80) * 40);
        if (acc >= 75) return Math.round(1600 + (acc - 75) * 40);
        if (acc >= 70) return Math.round(1400 + (acc - 70) * 40);
        if (acc >= 60) return Math.round(1200 + (acc - 60) * 20);
        if (acc >= 50) return Math.round(1000 + (acc - 50) * 20);        return Math.max(800, Math.round(800 + acc * 4));
    };

    // Return complete report
    return {
        accuracies: {
            white: whiteAccuracy,
            black: blackAccuracy
        },
        performanceRatings: {
            white: 1500,
            black: 1500
        },
        classifications,
        positions: positions
    };

}

export default analyse;