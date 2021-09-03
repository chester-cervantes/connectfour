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
    const setupButtons = document.querySelector('#setup-buttons')

    const gridData = []

    const width = 7
    const height = 6

    let playerId = PLAYER_ID_FIRST
    let computerId = PLAYER_ID_COMPUTER

    let isGameOver = false
    let currPlayer = PLAYER_USER

    // Multiplayer settings
    let playerNum = 0;
    let ready = false;
    let opponentReady = false;

    // Select Player Mode
    if (gameMode === GAME_MODE_SINGLE_PLAYER) {
        startSinglePlayer()
    } else {
        startMultiPlayer()
    }

    function startMultiPlayer() {
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
            playerConnectedOrDisconnected(num)
        })

        socket.on('opponent-ready', num => {
            opponentReady = true
            playerReady(num)
            if (ready) {
                playGameMulti(socket)
                console.log('should say this')

            }
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


        socket.on('click', id => {

            console.log('players click')
            socket.emit('click-reply', id)
            const square = gridData[id]
            addChipToColumn(square)
            playGameMulti(socket)
        })

        socket.on('click-reply', id => {
            const square = gridData[id]
            try {
                addChipToColumn(square)
                console.log(square)
            }
            catch (e) {
                console.log(e)
            }
            playGameMulti(socket)
        })
        function playerConnectedOrDisconnected(num) {
            let player = `.p${parseInt(num) + 1}`
            document.querySelector(`${player} .connected`).classList.toggle('active')
            if (parseInt(num) == playerNum) document.querySelector(player).style.fontWeight = 'bold'
        }
    }

    function startSinglePlayer() {
        startButton.addEventListener('click', () => {
            setupButtons.style.display = 'none'
            playGameSingle()
        })

    }

    function playerReady(num) {
        let player = `.p${parseInt(num) + 1}`
        document.querySelector(`${player} .ready`).classList.toggle('active')
    }
    console.log('should say thislol')

    function createBoard(width, height) {
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                const square = document.createElement('div');
                square.className = 'cell'
                square.dataset.id = i * width + j
                square.dataset.row = i
                square.dataset.col = j
                const circle = document.createElement('div');
                circle.className = 'hole'
                square.appendChild(circle)
                gridData.push(square)
                grid.appendChild(square)
            }
        }
    }
    createBoard(width, height)

    function playGameMulti(socket) {
        setupButtons.style.display = 'none'
        if (isGameOver) return
        if (!ready) {
            socket.emit('player-ready')
            ready = true
            gridData.forEach(square => {
                console.log('should say this too')
                square.addEventListener('click', () => {
                    console.log('should say click')
                    if (currPlayer == PLAYER_USER && ready && opponentReady) {
                        console.log('should say click again')
    
                        socket.emit('click', square.dataset.id)
                    }
                })
            })
            playerReady(playerNum)
        }

        if (opponentReady) {
            if (currPlayer == PLAYER_USER) {

                grid.classList.remove('loading');
                turnDisplay.innerHTML = 'Your turn'
            }
            if (currPlayer == PLAYER_OPPONENT) {
                grid.classList.add('loading');
                turnDisplay.innerHTML = "Opponent's turn"
            }
        }
    }

    function playGameSingle() {
        if (isGameOver) return
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
            grid.classList.add('loading');

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
        currHole = gridData[id].firstChild

        let color = getCurrPlayerColor()
        currHole.classList.add(color)

        checkForWins(color)

        if (currPlayer == PLAYER_USER) currPlayer = PLAYER_OPPONENT
        else currPlayer = PLAYER_USER

        if (gameMode == GAME_MODE_SINGLE_PLAYER) {
            turnDisplay.innerHTML = 'Your Go'
            grid.classList.remove('loading');
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
        currHole = gridData[id].firstChild

        let color = getCurrPlayerColor()
        currHole.classList.add(color)

        checkForWins(color)

        currPlayer = PLAYER_USER
        turnDisplay.innerHTML = 'Your Go'
        grid.classList.remove('loading');
    }

    function checkForWins(currPlayerColor) {
        let gameOverDescription = ""
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
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width - 3; j++) {
                let cell0 = i * width + j
                let cell1 = i * width + j + 1
                let cell2 = i * width + j + 2
                let cell3 = i * width + j + 3
                if (areBlocksConnected(cell0, cell1, cell2, cell3, currPlayerColor)) {
                    gameOver(gameOverDescription, cell0, cell1, cell2, cell3)
                    return
                }
            }
        }
        for (let i = 0; i < height - 3; i++) {
            for (let j = 0; j < width; j++) {
                let cell0 = i * width + j
                let cell1 = (i + 1) * width + j
                let cell2 = (i + 2) * width + j
                let cell3 = (i + 3) * width + j
                if (areBlocksConnected(cell0, cell1, cell2, cell3, currPlayerColor)) {
                    gameOver(gameOverDescription, cell0, cell1, cell2, cell3)
                    return
                }
            }
        }
        for (let i = 3; i < height; i++) {
            for (let j = 0; j < width; j++) {
                let cell0 = i * width + j
                let cell1 = (i - 1) * width + (j + 1)
                let cell2 = (i - 2) * width + (j + 2)
                let cell3 = (i - 3) * width + (j + 3)
                if (areBlocksConnected(cell0, cell1, cell2, cell3, currPlayerColor)) {
                    gameOver(gameOverDescription, cell0, cell1, cell2, cell3)
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
                if (areBlocksConnected(cell0, cell1, cell2, cell3, currPlayerColor)) {
                    gameOver(gameOverDescription, cell0, cell1, cell2, cell3)
                    return
                }
            }
        }
    }
    function areBlocksConnected(cell0, cell1, cell2, cell3, currPlayerColor) {
        return gridData[cell0].firstChild.classList.contains(currPlayerColor) &&
            gridData[cell1].firstChild.classList.contains(currPlayerColor) &&
            gridData[cell2].firstChild.classList.contains(currPlayerColor) &&
            gridData[cell3].firstChild.classList.contains(currPlayerColor)
    }
    function gameOver(gameOverDescription, cell0, cell1, cell2, cell3) {
        grid.classList.add('gameover')
        // Weird bug where         grid.classList.add('loading') doenst add loading 


        turnDisplay.innerHTML = "Opponent's Turn"
        infoDisplay.innerHTML = gameOverDescription
        isGameOver = true

        let winningChip = 'winning-chip'
        gridData[cell0].firstChild.classList.add(winningChip)
        gridData[cell1].firstChild.classList.add(winningChip)
        gridData[cell2].firstChild.classList.add(winningChip)
        gridData[cell3].firstChild.classList.add(winningChip)
    }
})