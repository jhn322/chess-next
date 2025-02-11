import { useState, useEffect, useCallback } from "react";
import { Chess, Square } from "chess.js";
import SquareComponent from "@/components/Square";
import Piece from "@/components/Piece";

type StockfishEngine = Worker;

const ChessBoard = ({ difficulty }: { difficulty: string }) => {
  const [game] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [selectedPiece, setSelectedPiece] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [engine, setEngine] = useState<StockfishEngine | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);

  // Make a move and update the board
  const makeMove = useCallback(
    (from: string, to: string) => {
      try {
        const move = game.move({
          from,
          to,
          promotion: "q", // Always promote to queen for simplicity
        });

        if (move) {
          setBoard(game.board());
          return true;
        }
      } catch {
        console.log("Invalid move");
      }
      return false;
    },
    [game]
  );

  // Initialize Stockfish
  useEffect(() => {
    const stockfish = new Worker("/stockfish.js");

    stockfish.onmessage = (event: MessageEvent) => {
      const message = event.data;
      // When Stockfish finds the best move
      if (message.startsWith("bestmove")) {
        const moveStr = message.split(" ")[1];
        makeMove(moveStr.slice(0, 2), moveStr.slice(2, 4));
      }
    };

    setEngine(stockfish);

    // Set difficulty
    const skillLevel =
      {
        easy: 2,
        intermediate: 8,
        hard: 14,
        expert: 20,
      }[difficulty] || 10;

    stockfish.postMessage("uci");
    stockfish.postMessage("setoption name Skill Level value " + skillLevel);

    return () => {
      stockfish.terminate();
    };
  }, [difficulty, makeMove]);

  // Get bot's move
  const getBotMove = () => {
    if (engine && !game.isGameOver()) {
      engine.postMessage("position fen " + game.fen());
      engine.postMessage("go movetime 1000"); // Think for 1 second
    }
  };

  const handleSquareClick = (row: number, col: number) => {
    // Only allow moves if it's player's turn (white)
    if (game.turn() === "b") return;

    if (!selectedPiece) {
      // If no piece is selected and the clicked square has a piece
      const piece = board[row][col];
      if (piece && piece.color === "w") {
        setSelectedPiece({ row, col });
        const from = `${"abcdefgh"[col]}${8 - row}` as Square;
        const moves = game.moves({ square: from, verbose: true });
        setPossibleMoves(moves.map((move) => move.to));
      }
    } else {
      // Try to make a move
      const from = `${"abcdefgh"[selectedPiece.col]}${
        8 - selectedPiece.row
      }` as Square;
      const to = `${"abcdefgh"[col]}${8 - row}` as Square;

      const moveMade = makeMove(from, to);
      if (moveMade) {
        // If player's move was successful, get bot's move
        setTimeout(getBotMove, 500);
      }

      setSelectedPiece(null);
      setPossibleMoves([]);
    }
  };

  // Game status display
  const getGameStatus = () => {
    if (game.isCheckmate())
      return `Checkmate! ${game.turn() === "w" ? "Black" : "White"} wins!`;
    if (game.isDraw()) return "Game is a draw!";
    if (game.isCheck())
      return `${game.turn() === "w" ? "White" : "Black"} is in check!`;
    return `${game.turn() === "w" ? "White" : "Black"} turn to move`;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[min(100vw,80vh)] p-4">
      <div className="text-lg font-bold mb-8">{getGameStatus()}</div>
      <div className="w-full max-w-[min(100vw,80vh)] aspect-square">
        <div className="w-full h-full grid grid-cols-8 border border-border">
          {board.map((row, rowIndex) =>
            row.map((piece, colIndex) => (
              <SquareComponent
                key={`${rowIndex}-${colIndex}`}
                isLight={(rowIndex + colIndex) % 2 === 0}
                isSelected={
                  selectedPiece?.row === rowIndex &&
                  selectedPiece?.col === colIndex
                }
                isPossibleMove={possibleMoves.includes(
                  `${"abcdefgh"[colIndex]}${8 - rowIndex}`
                )}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
                difficulty={difficulty}
              >
                {piece && (
                  <Piece
                    type={
                      piece.color === "w"
                        ? piece.type.toUpperCase()
                        : piece.type.toLowerCase()
                    }
                  />
                )}
              </SquareComponent>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
