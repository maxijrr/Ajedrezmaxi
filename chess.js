// chess.js
const board = document.getElementById('board');
const message = document.getElementById('message');
const colorSelect = document.getElementById('color');
const difficultySelect = document.getElementById('difficulty');
const startButton = document.getElementById('start-game');

const pieces = {
    '♜': 'black', '♞': 'black', '♝': 'black', '♛': 'black', '♚': 'black', '♟': 'black',
    '♖': 'white', '♘': 'white', '♗': 'white', '♕': 'white', '♔': 'white', '♙': 'white'
};

let boardState = [
    ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
    ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
    ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'],
];

let selectedPiece = null;
let currentPlayer = 'white';
let aiDifficulty = 'medium';

startButton.addEventListener('click', startGame);

function startGame() {
    currentPlayer = colorSelect.value;
    aiDifficulty = difficultySelect.value;
    drawBoard();
    if (currentPlayer === 'black') {
        aiMove();
    }
}

function drawBoard() {
    board.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square', (row + col) % 2 === 0 ? 'white' : 'black');
            square.dataset.row = row;
            square.dataset.col = col;
            square.innerHTML = boardState[row][col];
            square.addEventListener('click', () => handleSquareClick(row, col));
            board.appendChild(square);
        }
    }
}

function handleSquareClick(row, col) {
    if (selectedPiece) {
        const fromRow = selectedPiece.row;
        const fromCol = selectedPiece.col;
        if (isValidMove(fromRow, fromCol, row, col)) {
            // Mover la pieza
            boardState[row][col] = boardState[fromRow][fromCol];
            boardState[fromRow][fromCol] = '';
            selectedPiece = null;
            drawBoard();

            // Verificar jaque y jaque mate
            if (isInCheck(getOpponentColor(currentPlayer))) {
                if (isCheckmate(getOpponentColor(currentPlayer))) {
                    message.innerText = `${currentPlayer === 'white' ? 'Negro' : 'Blanco'} gana por jaque mate!`;
                    return;
                }
                message.innerText = `${currentPlayer === 'white' ? 'Negro' : 'Blanco'} está en jaque!`;
            } else {
                message.innerText = '';
            }

            // Cambiar de jugador
            currentPlayer = currentPlayer === 'white' ? 'black' : 'white'; // Cambiar de jugador

            // Si es el turno de la IA, hacer movimiento
            if (currentPlayer === 'black') {
                setTimeout(() => aiMove(), 500); // AI move after player
            }
        } else {
            selectedPiece = null; // Reset selection if move is invalid
        }
    } else {
        // Seleccionar la pieza solo si es del color del jugador actual
        if (boardState[row][col] && pieces[boardState[row][col]] === currentPlayer) {
            selectedPiece = { row, col };
        }
    }
}

function aiMove() {
    let depth;
    switch (aiDifficulty) {
        case 'easy':
            depth = 1;
            break;
        case 'medium':
            depth = 3;
            break;
        case 'hard':
            depth = 5;
            break;
    }
    const bestMove = minimax(boardState, depth, true);
    if (bestMove) {
        const { fromRow, fromCol, toRow, toCol } = bestMove;
        boardState[toRow][toCol] = boardState[fromRow][fromCol];
        boardState[fromRow][fromCol] = '';
        drawBoard();
        if (isInCheck('white')) {
            if (isCheckmate('white')) {
                message.innerText = 'Negro gana por jaque mate!';
                return;
            }
            message.innerText = 'Blanco está en jaque!';
        } else {
            message.innerText = '';
        }
        currentPlayer = 'white'; // Cambiar de jugador
    }
}

function minimax(board, depth, isMaximizing) {
    const opponentColor = isMaximizing ? 'black' : 'white';
    const currentColor = isMaximizing ? 'white' : 'black';

    if (isCheckmate(opponentColor)) return { score: 1000 }; // Si el oponente está en jaque mate
    if (isCheckmate(currentColor)) return { score: -1000 }; // Si el jugador está en jaque mate
    if (depth === 0) return { score: evaluateBoard(board) }; // Evaluar el tablero

    let bestMove = null;
    if (isMaximizing) {
        let bestValue = -Infinity;
        const validMoves = getAllValidMoves(currentColor);
        for (const move of validMoves) {
            const { fromRow, fromCol, toRow, toCol } = move;
            const temp = board[toRow][toCol];
            board[toRow][toCol] = board[fromRow][fromCol];
            board[fromRow][fromCol] = '';
            const value = minimax(board, depth - 1, false).score;
            board[fromRow][fromCol] = board[toRow][toCol];
            board[toRow][toCol] = temp;
            if (value > bestValue) {
                bestValue = value;
                bestMove = move;
            }
        }
        return depth === 5 ? bestMove : { score: bestValue }; // Retornar el mejor movimiento en profundidad 5
    } else {
        let bestValue = Infinity;
        const validMoves = getAllValidMoves(currentColor);
        for (const move of validMoves) {
            const { fromRow, fromCol, toRow, toCol } = move;
            const temp = board[toRow][toCol];
            board[toRow][toCol] = board[fromRow][fromCol];
            board[fromRow][fromCol] = '';
            const value = minimax(board, depth - 1, true).score;
            board[fromRow][fromCol] = board[toRow][toCol];
            board[toRow][toCol] = temp;
            if (value < bestValue) {
                bestValue = value;
                bestMove = move;
            }
        }
        return { score: bestValue };
    }
}

function evaluateBoard(board) {
    let score = 0;
    const pieceValues = {
        '♙': 1, '♘': 3, '♗': 3, '♖': 5, '♕': 9, '♔': 0,
        '♟': -1, '♞': -3, '♝': -3, '♜': -5, '♛': -9, '♚': 0
    };

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece) {
                score += pieceValues[piece];
            }
        }
    }
    return score;
}

function getAllValidMoves(color) {
    const validMoves = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = boardState[row][col];
            if (pieces[piece] === color) {
                for (let targetRow = 0; targetRow < 8; targetRow++) {
                    for (let targetCol = 0; targetCol < 8; targetCol++) {
                        if (isValidMove(row, col, targetRow, targetCol)) {
                            validMoves.push({ fromRow: row, fromCol: col, toRow: targetRow, toCol: targetCol });
                        }
                    }
                }
            }
        }
    }
    return validMoves;
}

function isInCheck(color) {
    const kingPosition = findKing(color);
    const opponentColor = getOpponentColor(color);
    return getAllValidMoves(opponentColor).some(move => move.toRow === kingPosition.row && move.toCol === kingPosition.col);
}

function findKing(color) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (boardState[row][col] === (color === 'white' ? '♔' : '♚')) {
                return { row, col };
            }
        }
    }
}

function isCheckmate(color) {
    if (!isInCheck(color)) return false; // No está en jaque, no puede ser jaque mate
    const validMoves = getAllValidMoves(color);
    return validMoves.length === 0; // Si no hay movimientos válidos, es jaque mate
}

function getOpponentColor(color) {
    return color === 'white' ? 'black' : 'white';
}

drawBoard();   