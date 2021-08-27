// const { info } = require("console")

document.addEventListener('DOMContentLoaded', () => {
    const RED_PLAYER_COLOR = 'red-chip'
    const YELLOW_PLAYER_COLOR = 'yellow-chip'
    const PLAYER_USER = 'user'
    const PLAYER_OPPONENT = 'opponent'
    const GAME_MODE_SINGLE_PLAYER = "singlePlayer"
    const GAME_MODE_MULTI_PLAYER = "multiPlayer"
    const PLAYER_ID_FIRST = 0
    const PLAYER_ID_SECOND = 1
    const PLAYER_ID_COMPUTER = 2

    const grid = document.querySelector('.grid')
    const startButton = document.querySelector('#start')
    const turnDisplay = document.querySelector('#turn-player')
    const infoDisplay = document.querySelector('#info')
    const singlePlayerButton = document.querySelector('#singlePlayerButton')
    const multiPlayerButton = document.querySelector('#multiPlayerButton')

    const gridData = []

    const width = 7
    const height = 6

    let playerId = PLAYER_ID_FIRST
    let computerId = PLAYER_ID_COMPUTER

    let isGameOver = false
    let currPlayer = PLAYER_USER

    // Multiplayer settings
    let gameMode = "";
    let playerNum = 0;
    let ready = false;
    let opponentReady = false;

    // Select Player Mode
    singlePlayerButton.addEventListener('click', startSinglePlayer)
    multiPlayerButton.addEventListener('click', startMultiPlayer)

    function startMultiPlayer() {
        gameMode = GAME_MODE_MULTI_PLAYER

        // Socket io connection
        const socket = io();

        socket.on('player-number', num => {
            if (num == -1) {
                infoDisplay.innerHTML = "Sorry, game is full"
            } else {
                playerNum = parseInt(num)
                if (playerNum === 1) currPlayer = PLAYER_OPPONENT
            }

            playerId = num

            socket.emit('check-players')
        })

        // Another player has connected or disconnected
        socket.on('player-connection', num => {
            console.log(`Player number ${num} has connected or disconnected`)
            playerConnectedOrDisconnected(num)
        })

        socket.on('opponent-ready', num => {
            opponentReady = true
            playerReady(num)
            if (ready) playGameMulti(socket)
        })

        socket.on('check-players', players => {
            players.forEach((p, i) => {
                if (p.connected) playerConnectedOrDisconnected(i)
                if (p.ready) {
                    playerReady(i)
                    if (i !== playerReady) opponentReady = true
                }
            })
        })

        socket.on('timeout', () => {
            infoDisplay.innerHTML = 'You have reached the 5 min limit'
        })


        startButton.addEventListener('click', () => {
            playGameMulti(socket)
        })

        gridData.forEach(square => {
            square.addEventListener('click', () => {
                if (currPlayer == PLAYER_USER && ready && opponentReady) {
                    console.log("CLICKED 2")
                    socket.emit('click', square.dataset.id)
                }
            })
        })

        socket.on('click', id => {
            // opponentGo(id)
            socket.emit('click-reply', id)
            const square = gridData[id]
            addChipToColumn(square)
            playGameMulti(socket)
        })

        socket.on('click-reply', id => {
            const square = gridData[id]
            try {
                addChipToColumn(square)
            }
            catch (e) {
                console.log(e)
            }
            playGameMulti(socket)
        })

        function playerConnectedOrDisconnected(num) {
            let player = `.p${parseInt(num) + 1}`
            document.querySelector(`${player} .connected span`).classList.toggle('green')
            if (parseInt(num) == playerNum) document.querySelector(player).style.fontWeight = 'bold'
        }
    }

    function startSinglePlayer() {
        gameMode = GAME_MODE_SINGLE_PLAYER

        startButton.addEventListener('click', playGameSingle)
    }


    function createBoard(width, height) {
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                const square = document.createElement('div');
                square.className = 'cell'
                square.dataset.id = i * width + j
                square.dataset.row = i
                square.dataset.col = j
                gridData.push(square)
                grid.appendChild(square)
            }
        }
    }
    createBoard(width, height)

    function playGameMulti(socket) {
        if (isGameOver) return
        if (!ready) {
            socket.emit('player-ready')
            ready = true
            playerReady(playerNum)
        }

        if (opponentReady) {
            if (currPlayer == PLAYER_USER) {

                document.querySelector('.grid').classList.remove('loading');
                turnDisplay.innerHTML = 'Your turn'
            }
            if (currPlayer == PLAYER_OPPONENT) {

                document.querySelector('.grid').classList.add('loading');
                turnDisplay.innerHTML = "Opponent's turn"
            }
        }
    }

    function playerReady(num) {
        let player = `.p${parseInt(num) + 1}`
        document.querySelector(`${player} .ready span`).classList.toggle('green')
    }

    function playGameSingle() {
        if (isGameOver) return
        console.log("******************************************************")
        console.log("currPlayer")
        console.log(currPlayer)
        if (currPlayer === PLAYER_USER) {
            turnDisplay.innerHTML = 'Your Turn'
            gridData.forEach(square => square.addEventListener('click', () => {
                try {
                    addChipToColumn(square)
                }
                catch (e) {
                    console.log(e)
                }
            }))
        }
        else if (currPlayer === PLAYER_OPPONENT) {

            turnDisplay.innerHTML = "Opponent's Turn"
            document.querySelector('.grid').classList.add('loading');

            try {
                setTimeout(opponentGo, 500)
            } catch (e) {
                playGameSingle()
            }
        }
    }

    let columnChipCounts = new Array(width).fill(0)

    function addChipToColumn(square) {
        let column = square.dataset.col

        if (columnChipCounts[column] >= height) {
            throw "invalid column"
        }

        columnChipCounts[column]++
        let row = columnChipCounts[column]
        let reverseRowId = height - row
        id = parseInt(column) + width * reverseRowId
        currSquare = gridData[id]

        let color = getCurrPlayerColor()
        currSquare.classList.add(color)

        checkForWins(color, playerId)

        console.log("BEFORE addchipincolumn")
        console.log(currPlayer)

        if (currPlayer == PLAYER_USER) currPlayer = PLAYER_OPPONENT
        else currPlayer = PLAYER_USER

        console.log("AFTER addchipincolumn")
        console.log(currPlayer)
        if (gameMode == GAME_MODE_SINGLE_PLAYER) {
            turnDisplay.innerHTML = 'Your Go'
            document.querySelector('.grid').classList.remove('loading');
            playGameSingle()

        }
    }

    function getCurrPlayerColor() {
        if (playerId == PLAYER_ID_FIRST) {
            if (currPlayer == PLAYER_USER) {
                return RED_PLAYER_COLOR
            }
            if (currPlayer == PLAYER_OPPONENT) {
                return YELLOW_PLAYER_COLOR
            }
        }
        if (playerId == PLAYER_ID_SECOND) {
            if (currPlayer == PLAYER_USER) {
                return YELLOW_PLAYER_COLOR
            }
            if (currPlayer == PLAYER_OPPONENT) {
                return RED_PLAYER_COLOR
            }
        }
        throw new Error("Something went badly wrong!");
    }

    function opponentGo() {
        let randomNumber = Math.floor(Math.random() * width * height)
        let square = gridData[randomNumber]
        let column = square.dataset.col

        if (columnChipCounts[column] >= height) {
            opponentGo()
        }

        columnChipCounts[column]++
        let row = columnChipCounts[column]
        let reverseRowId = height - row
        id = parseInt(column) + width * reverseRowId
        currSquare = gridData[id]

        let color = getCurrPlayerColor()
        currSquare.classList.add(color)

        checkForWins(color, playerId)

        console.log("BEFORE addchipincolumn")
        console.log(currPlayer)

        currPlayer = PLAYER_USER

        console.log("AFTER addchipincolumn")
        console.log(currPlayer)
        turnDisplay.innerHTML = 'Your Go'
        document.querySelector('.grid').classList.remove('loading');
    }

    function checkForWins(currPlayerColor, id) {
        let gameOverDescription = "Nothing"
        if (gameMode == GAME_MODE_MULTI_PLAYER) {
            if (currPlayer == PLAYER_USER) {
                gameOverDescription = "You win!"
            }
            if (currPlayer == PLAYER_OPPONENT) {
                gameOverDescription = "You lose!"
            }
        } else {
            if (currPlayer == PLAYER_USER) {
                gameOverDescription = "You win!!!"
            }
            if (currPlayer == PLAYER_OPPONENT) {
                gameOverDescription = "You lose!!!"
            }
        }
        // horizontalCheck 
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width - 3; j++) {
                let cell0 = i * width + j
                let cell1 = i * width + j + 1
                let cell2 = i * width + j + 2
                let cell3 = i * width + j + 3
                if (gridData[cell0].classList.contains(currPlayerColor) &&
                    gridData[cell1].classList.contains(currPlayerColor) &&
                    gridData[cell2].classList.contains(currPlayerColor) &&
                    gridData[cell3].classList.contains(currPlayerColor)) {
                    infoDisplay.innerHTML = gameOverDescription
                    // TODO handle who wins with playerId
                    gameOver()
                    return
                }
            }
        }
        // verticalCheck
        for (let i = 0; i < height - 3; i++) {
            for (let j = 0; j < width; j++) {
                let cell0 = i * width + j
                let cell1 = (i + 1) * width + j
                let cell2 = (i + 2) * width + j
                let cell3 = (i + 3) * width + j
                if (gridData[cell0].classList.contains(currPlayerColor) &&
                    gridData[cell1].classList.contains(currPlayerColor) &&
                    gridData[cell2].classList.contains(currPlayerColor) &&
                    gridData[cell3].classList.contains(currPlayerColor)) {
                    infoDisplay.innerHTML = gameOverDescription
                    gameOver()
                    return
                }
            }
        }
        // ascendingDiagonalCheck 
        for (let i = 3; i < height; i++) {
            for (let j = 0; j < width; j++) {
                let cell0 = i * width + j
                let cell1 = (i - 1) * width + (j + 1)
                let cell2 = (i - 2) * width + (j + 2)
                let cell3 = (i - 3) * width + (j + 3)
                if (gridData[cell0].classList.contains(currPlayerColor) &&
                    gridData[cell1].classList.contains(currPlayerColor) &&
                    gridData[cell2].classList.contains(currPlayerColor) &&
                    gridData[cell3].classList.contains(currPlayerColor)) {
                    infoDisplay.innerHTML = gameOverDescription
                    gameOver()
                    return
                }
            }
        }
        for (let i = 3; i < height; i++) {
            for (let j = 3; j < width; j++) {
                let cell0 = i * width + j
                let cell1 = (i - 1) * width + (j - 1)
                let cell2 = (i - 2) * width + (j - 2)
                let cell3 = (i - 3) * width + (j - 3)
                if (gridData[cell0].classList.contains(currPlayerColor) &&
                    gridData[cell1].classList.contains(currPlayerColor) &&
                    gridData[cell2].classList.contains(currPlayerColor) &&
                    gridData[cell3].classList.contains(currPlayerColor)) {
                    infoDisplay.innerHTML = gameOverDescription
                    gameOver()
                    return
                }
            }
        }
    }

    function gameOver() {
        isGameOver = true
        console.log('GMAE OVER')
    }
})