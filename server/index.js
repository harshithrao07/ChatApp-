// IMPORTING THE PACKAGES
import express from 'express'
import {createServer} from 'http'
import {Server} from 'socket.io'
import cors from 'cors'

// CREATING THE INSTANCES
const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: 'https://chat-app-client-phi.vercel.app/',
        methods: ['GET', 'POST']
    }
})

// MIDDLEWARES
app.use(cors())
app.use(express.json())

// SOCKET.IO LOGIC
io.on("connection", (socket) => {
    console.log('New Client connected')

    socket.on('app/message', (payload) => {
        io.emit('app/message', payload)
    })

    socket.on("app/private-message", (payload) => {
        io.emit('app/private-message', payload)
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected')
    })
})


// RUN THE SERVER
const PORT = 3000
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})