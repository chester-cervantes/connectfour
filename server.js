const express = require('express')
const path = require('path')
const http = require('http')
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(express.static(path.join(__dirname, "public")))

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

const connections = [null, null]
io.on('connection', socket => {
    console.log('new connection')
    let playerIndex = -1
    for (const i in connections) {
        if (connections[i] == null) {
            playerIndex = i
            break
        }
    }

    socket.emit('player-number', playerIndex);
    
    console.log(`Player ${playerIndex} has connected`)
    if (playerIndex == -1) return

    // False indicates player at index playerIndex is not ready
    connections[playerIndex] = false

    socket.broadcast.emit('player-connection', playerIndex)

    socket.on('disconnect', () => {
        console.log(`Player ${playerIndex} disconnected`)
        connections[playerIndex] = null
        socket.broadcast.emit('player-connection', playerIndex)
    })

    socket.on('player-ready', () => {
        socket.broadcast.emit('opponent-ready', playerIndex)
        connections[playerIndex] = true
    })

    socket.on('check-players', () => {
        const players = []
        for (const i in connections) {
            connections[i] == null ? players.push({connected: false, ready: false}) : 
                players.push({connected: true, ready: connections[i]})
        }
        socket.emit('check-players', players)
    })

    socket.on('click', id => {
        console.log(`Shot fired from ${playerIndex}`, id)
        socket.broadcast.emit('click', id)
    })

    
    socket.on('click-reply', id => {
        console.log("square")
        console.log(id)


        // Forward the reply to the other player
        socket.broadcast.emit('click-reply', id)
    })

    // setTimeout(() => {
    //     connections[playerIndex] = null
    //     socket.emit('timeout')
    //     socket.disconnect()
    // , 5000000})
})