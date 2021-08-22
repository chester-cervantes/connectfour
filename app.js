document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid')
    const startButton = document.querySelector('#start')
    const turnDisplay = document.querySelector('#turn-player')
    const infoDisplay = document.querySelector('#info')

    const gridData = []

    const width = 7
    const height = 6

    let isGameOver = true
    let currPlayer = 'user'

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
                console.log(square.dataset.id)
            }
        }
    }
    console.log(gridData)
    createBoard(width, height)

    function playGame() {
        // if (isGameOver) return
        if (currPlayer === 'user') {
            turnDisplay.innerHTML = 'Your Turn'
            console.log(gridData)
            gridData.forEach(square => square.addEventListener('click', function (e) {
                try {
                    addChipToColumn(columnChipCounts, square.dataset.col)
                }
                catch (e) {
                    console.log(e)
                    playGame()
                }
            }))
        }
        if (currPlayer === 'opponent') {
            turnDisplay.innerHTML = "Opponent's Turn"
            document.querySelector('.grid').classList.add('loading');
            setTimeout(computerGo, 1000, columnChipCounts)
        }
    }

    startButton.addEventListener('click', playGame)

    let columnChipCounts = new Array(width).fill(0)

    function addChipToColumn(columnChipCounts, column) {
        if (columnChipCounts[column] >= height) {
            throw "invalid column"
        }
        columnChipCounts[column]++
        let row = columnChipCounts[column]
        let reverseRowId = height - row
        id = parseInt(column) + width * reverseRowId
        currSquare = gridData[id]
        addChipToSquare(currSquare, "red-chip")
        checkForWins()
        currPlayer = 'opponent'
        playGame()
    }

    function addChipToSquare(square, color) {
        square.classList.add(color)
    }

    playGame()

    function computerGo(columnChipCounts) {
        let randColumn = Math.floor(Math.random() * width)
        try {
            if (columnChipCounts[randColumn] >= height) {
                throw 'invalid column'
            }
            columnChipCounts[randColumn]++
            let row = columnChipCounts[randColumn]
            let reverseRowId = height - row
            id = parseInt(randColumn) + width * reverseRowId
            currSquare = gridData[id]
            addChipToSquare(currSquare, "yellow-chip")
            checkForWins()
        } catch (e) {
            computerGo(columnChipCounts)
        }
        currentPlayer = 'user'
        turnDisplay.innerHTML = 'Your Go'
        document.querySelector('.grid').classList.remove('loading');
    }

    function checkForWins() {
        return
    }
})