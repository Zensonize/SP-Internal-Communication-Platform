CREATE TABLE chats (
    id serial NOT NULL PRIMARY KEY,
    data json NOT NULL
);

CREATE TABLE users (
    userID serial NOT NULL PRIMARY KEY,
    username VARCHAR(30) NOT NULL,
    email VARCHAR(30) NOT NULL
);

CREATE TABLE rooms (
    roomID serial NOT NULL PRIMARY KEY,
    roomname VARCHAR(30) NOT NULL,
    roompass VARCHAR(30) NOT NULL
);