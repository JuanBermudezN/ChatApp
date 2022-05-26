const path = require('path')
const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const Filter = require('bad-words')
const port = process.env.PORT 
const publicDirectory = path.join(__dirname, '../public')
app.use(express.static(publicDirectory))
const {generateMessage, generateLocationMessage}  = require('./utils/messages')
const {addUser,removeUser, getUser, getUsersInRoom} = require('./utils/users')
let count = 0
io.on('connection', (socket) =>{
    socket.on('join', (options, callback) => {
        const {error, user} = addUser({id: socket.id, ...options})
        if(error) return callback(error)
        socket.join(user.room)
        socket.emit('message', generateMessage('Welcome!', 'admin'))
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`, 'admin'))    
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        // socket.emit, io.emit, socket.broadcast.emit
        // io.to.emit, socket.broacast.to.emit
    })
    socket.on('clientMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message', generateMessage(message, user.username))
        callback()
    })
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
//        io.emit('message', `Location: ${data.latitude},${data.longitude}`)
//          io.emit('message', `https://google.com/maps?q=${coords.latitude},${coords.longitude}`)
            if(user) io.to(user.room).emit('locationMessage', generateLocationMessage(`https://google.com/maps?q=${coords.latitude},${coords.longitude}`, user.username))
          callback()
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left`, 'admin'))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
    }
    }) 
})
server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})