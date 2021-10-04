const debug = false;

const playerFactory = function (name, mark, color, isHuman, strength) {

    let score = 0;

    const randomMove = function (cells) {
        return cells[Math.floor(Math.random() * cells.length)];
    }

    const isFocusing = () => {
        if (strength >= 1) {
            return true;
        } else {
            dice = Math.random();
            if (dice > strength) {
                return false;
            } else {
                return true;
            }
        }
    }

    const setStr = (str) => {
        const strNum = parseFloat(str);
        if (strNum !== NaN) {
            strength = strNum;
            if (debug) console.log(`name strengt set to ${strength}`);
        }
    }

    const getStr = () => strength;

    return { name, mark, color, isHuman, score, getStr, setStr, randomMove, isFocusing }
}

const Player1 = playerFactory('Player 1', 'X', '#076ed5', true, 1);
const Player2 = playerFactory('Player 2', 'O', '#ff5757', false, 1);

const gameController = (function () {


    let currentPlayer = Player1;
    let enemyPlayer = Player2;
    let gameOver = false;

    const gameState = {
        scores: [],
        boards: [],
        selectedMove: undefined,
        reset: function () {
            this.scores = [];
            this.boards = [];
            this.selectedMove = undefined;
        }
    }

    const newGame = function () {
        gameState.reset();
        currentPlayer = Player1;
        enemyPlayer = Player2;
        gameOver = false;
        gameBoard.clear();
        uiController.setStatusMessage(`Current player: ${currentPlayer.name}`);
        uiController.updatePlayersInfo(Player1, Player2);
        uiController.renderBoard(gameBoard.getBoard());
        uiController.renderPossibleMoves(gameState);
    }

    const _togglePlayers = function () {
        currentPlayer === Player1 ? currentPlayer = Player2 : currentPlayer = Player1;
        currentPlayer === Player1 ? enemyPlayer = Player2 : enemyPlayer = Player1;
        uiController.setStatusMessage(`Current player: ${currentPlayer.name}`);
    }

    const _checkWin = function (board, mark) {
        const winCombos = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ]

        for (let i = 0; i < winCombos.length; i++) {
            if (board[winCombos[i][0]] === mark &&
                board[winCombos[i][1]] === mark &&
                board[winCombos[i][2]] === mark) return true;
        }

        return false;
    }

    const _checkTie = function (board, mark) {
        const win = _checkWin(board, mark);
        const isEmptySpot = board.some(e => e === '');

        return win === false && !isEmptySpot
    }

    const _bestMove = function (board) {

        gameState.reset();

        if (debug) console.log(`${currentPlayer.name}'s turn`)
        const depth = 0

        let bestScore = -Infinity;
        let bestMove = -1;

        for (let i = 0; i < board.length; i++) {

            if (board[i] === '') {
                board[i] = currentPlayer.mark

                let score = _miniMax(board, i, i, false);
                //GameState
                gameState.boards[i] = Array.from(board);
                gameState.scores[i] = score;

                board[i] = '';
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            } else {
                gameState.boards[i] = '';
                gameState.scores[i] = '';

            }
        }
        gameState.selectedMove = bestMove;
        if (debug) console.dir(gameState);
        return bestMove;
    };

    const _miniMax = function (board, parentId, depth, isMaximizing) {

        const currentPlayerWin = _checkWin(board, currentPlayer.mark);
        const enemyWin = _checkWin(board, enemyPlayer.mark);
        const tie = _checkTie(board, currentPlayer.mark);

        if (currentPlayerWin) return 10;
        if (enemyWin) return -10;
        if (tie) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === '') {
                    board[i] = currentPlayer.mark
                    let score = _miniMax(board, parentId, i, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === '') {
                    board[i] = enemyPlayer.mark
                    let score = _miniMax(board, parentId, i, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    const placeMark = function (e) {
        const cell = e.target.dataset.cell
        if (gameBoard.isCellEmpty(cell) && !gameOver) {

            gameBoard.setMark(cell, currentPlayer.mark);
            uiController.cellSelected(cell, currentPlayer.color);
            uiController.renderBoard(gameBoard.getBoard());

            if (_checkWin(gameBoard.getBoard(), currentPlayer.mark)) {
                gameOver = true;
                currentPlayer.score++;
                uiController.setStatusMessage('Congratulions! You have won!')
                uiController.updatePlayersInfo(Player1, Player2);
            } else if (_checkTie(gameBoard.getBoard(), currentPlayer.mark)) {
                gameOver = true;
                uiController.setStatusMessage('It\'s a tie! Please press play again!')
            } else {
                _togglePlayers();
            }

            if (!currentPlayer.isHuman && !gameOver) {
                let nextMove
                currentPlayer.isFocusing() ? nextMove = _bestMove(gameBoard.getBoard()) : nextMove = currentPlayer.randomMove(gameBoard.getEmptyCells());
                gameBoard.setMark(nextMove, currentPlayer.mark);
                uiController.cellSelected(nextMove, currentPlayer.color);
                uiController.renderBoard(gameBoard.getBoard());
                uiController.renderPossibleMoves(gameState);

                if (_checkWin(gameBoard.getBoard(), currentPlayer.mark)) {
                    gameOver = true;
                    currentPlayer.score++;
                    uiController.setStatusMessage(`You lost, ${currentPlayer.name} won!`)
                    uiController.updatePlayersInfo(Player1, Player2);
                } else if (_checkTie(gameBoard.getBoard(), currentPlayer.mark)) {
                    gameOver = true;
                    uiController.setStatusMessage('It\'s a tie! Please press play again!')
                } else {
                    _togglePlayers();
                }
            }
        }
    }

    return { placeMark, newGame }
})();

const uiController = (function () {

    let showMoveScores = true;

    const difficultyNames = ['Can I play, Daddy?', 'Don\'t hurt me.', 'Bring \'em on!', 'I am Death incarnate!']

    const gameBoard = document.querySelector('.gameboard');
    const statusMessage = document.querySelector('.status-message p');
    const uiPossibleMoves = document.querySelector('.possible-moves');

    const uiPlayer1Name = document.querySelector('#player1Name');
    const uiPlayer1Score = document.querySelector('#player1Score');
    const uiPlayer1Mark = document.querySelector('#player1Mark');
    const uiPlayer2Name = document.querySelector('#player2Name');
    const uiPlayer2Score = document.querySelector('#player2Score');
    const uiPlayer2Mark = document.querySelector('#player2Mark');

    const uiSettingsBtn = document.querySelector('#settings-btn');
    const uiSettingsModal = document.querySelector('.modal');
    const uiSettingsCloseBtn = document.querySelector('.close-btn')
    const uiSettingsSaveBtn = document.querySelector('#settings-save')
    const uiSettingsAIDiff = document.querySelector('#ai-str')
    const uiSettingsShowMiniMax = document.querySelector('#show-move-scores');
    const uiSettingDifficultyName = document.querySelector('#difficulty-name')


    uiSettingsBtn.addEventListener('click', () => {
        uiSettingsAIDiff.value = Player2.getStr();
        uiSettingsShowMiniMax.checked = showMoveScores;
        uiSettingsModal.style.display = "block";
    })

    uiSettingsCloseBtn.addEventListener('click', () => {
        uiSettingsModal.style.display = "none";
    })

    uiSettingsSaveBtn.addEventListener('click', () => {
        showMoveScores = uiSettingsShowMiniMax.checked;
        Player2.setStr(uiSettingsAIDiff.value);
        uiSettingsModal.style.display = "none";
    })

    uiSettingsAIDiff.addEventListener('change', () => {
        const value = parseFloat(uiSettingsAIDiff.value)
        if (value < 0.26) uiSettingDifficultyName.textContent = difficultyNames[0]
        else if (value <0.51) uiSettingDifficultyName.textContent = difficultyNames[1]
        else if (value <0.76) uiSettingDifficultyName.textContent = difficultyNames[2]
        else uiSettingDifficultyName.textContent = difficultyNames[3]
    })

    const uiNewGameBtn = document.querySelector('#newGame');

    uiNewGameBtn.addEventListener('click', gameController.newGame);

    const cells = [...document.querySelectorAll('.cell')];

    cells.forEach(e => {
        e.addEventListener('click', gameController.placeMark)
    })

    const _removeAllChildNodes = function (parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }

    const cellSelected = function (cell, color) {
        cells[cell].style.color = color;
    }

    const renderBoard = function (board) {
        board.forEach((cell, index) => {
            cells[index].firstChild.textContent = cell;
        })
    };

    const setStatusMessage = function (message) {
        statusMessage.textContent = message;
    }

    const updatePlayersInfo = function (p1, p2) {
        uiPlayer1Name.textContent = p1.name;
        uiPlayer1Mark.textContent = p1.mark;
        uiPlayer1Score.textContent = p1.score;

        uiPlayer2Name.textContent = p2.name;
        uiPlayer2Mark.textContent = p2.mark;
        uiPlayer2Score.textContent = p2.score;
    }

    const renderPossibleMoves = function (possibleMoves) {

        _removeAllChildNodes(uiPossibleMoves);

        if (showMoveScores) {
            possibleMoves.scores.forEach((score, i) => {
                if (score !== '') {
                    const moves = document.createElement('div');
                    moves.classList.add('move');
                    moves.textContent = `Score: ${score}`
                    const gameBoard = document.createElement('div');
                    gameBoard.classList.add('gameboard');
                    gameBoard.classList.add('gameboard-small')
                    if (i === possibleMoves.selectedMove) {
                        moves.classList.add('selected');
                    }

                    possibleMoves.boards[i].forEach((mark, j) => {
                        const cell = document.createElement('div');
                        cell.classList.add('cell');
                        cell.classList.add('cell-small')
                        if (j === i) {
                            if (score === 0) cell.classList.add('possible-tie');
                            if (score === 10) cell.classList.add('possible-win');
                            if (score === -10) cell.classList.add('possible-loss');
                        }

                        cell.textContent = mark
                        gameBoard.appendChild(cell);
                    })

                    moves.appendChild(gameBoard);
                    uiPossibleMoves.appendChild(moves);
                }
            })
        }

    }

    return { renderBoard, setStatusMessage, updatePlayersInfo, cellSelected, renderPossibleMoves }

})();

const gameBoard = (function () {

    let board = Array(9).fill('');


    const clear = function () {
        board = Array(9).fill('');
    }

    const getBoard = function () {
        return board;
    }

    const getEmptyCells = function () {
        let emptyCells = [];
        board.forEach((e, i) => {
            if (e === '') {
                emptyCells.push(i);
            }
        })
        if (debug) console.log({ emptyCells })
        return emptyCells;
    }

    const isCellEmpty = function (cell) {
        return board[cell] === '' ? true : false;
    }

    const setMark = function (cell, mark) {
        board[cell] = mark;
    }

    return { getBoard, getEmptyCells, isCellEmpty, setMark, clear };

})();

gameController.newGame();