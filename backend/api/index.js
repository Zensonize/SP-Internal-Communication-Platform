const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 4000
const db = require('./queries')

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.get('/', (request, response) => {
    response.json({ info: 'Node.js, Express, and Postgres API' })
})

app.get('/users', db.getUsers)
app.get('/room/id/', db.getRoomNameById)
app.get('/users/id/', db.getUsernameById)
app.get('/chat/room/', db.getChatByRoomID)

app.post('/users', db.createUser)
app.post('/rooms', db.createChatRoom)
app.post('/chat', db.insertChat)

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
  })