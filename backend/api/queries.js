const Pool = require('pg').Pool
const pool = new Pool({
    user: 'me',
    host: 'localhost',
    database: 'sp_test',
    password: 'password',
    port: 7000,
})

var url = require('url');

const getUsers = (request, response) => {
    pool.query('SELECT * FROM users ORDER BY userID ASC', (error,results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows)
    })
}

const getUsernameById = (request, response) => {
    var q = url.parse(request.url,true).query;
    console.log(q);

    pool.query('SELECT username FROM users WHERE userID = $1',[q.userID], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const createUser = (request, response) => {
    var q = url.parse(request.url,true).query;
    console.log(q);

    pool.query('INSERT INTO users (username,email) VALUES ($1, $2)', [q.username, q.email], (error, results) => {
        if (error) {
            throw error
        }
        //console.log(results)
        response.status(200).send('Success!')
    })
    // pool.query('SELECT userID FROM users WHERE username = $1',[q.username], (error, results) => {
    //     if (error) {
    //         throw error
    //     }
    //     console.log(results.rows)
    //     response.status(200).json(results.rows) 
    // })
}

const createChatRoom = (request, response) => {
    var q = url.parse(request.url,true).query;
    console.log(q);

    pool.query('INSERT INTO rooms (roomname, roompass) VALUES ($1, $2)', [q.roomname, q.roompass], (error, results) => {
        if (error) {
            throw error
        }
        response.status(201).json({roomID: results.insertID})
    })
}

const getRoomNameById = (request, response) => {
    var q = url.parse(request.url,true).query;
    console.log(q);

    pool.query('SELECT roomname FROM rooms WHERE roomID = $1',[q.roomID], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const getChatByRoomID = (request, response) => {
    var q = url.parse(request.url,true).query;

    pool.query('SELECT data FROM chats WHERE data -> roomID == $1', [q.roomID], (error, results) => {

    })
}

const insertChat = (request, response) => {
    var q = url.parse(request.url,true).query;

    pool.query('INSERT INTO chats (data) VALUES ($1)', [q.msg], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).send('success')
    })
}

module.exports = {
    getUsers,
    getUsernameById,
    getRoomNameById,
    getChatByRoomID,
    createUser,
    createChatRoom,
    insertChat
}