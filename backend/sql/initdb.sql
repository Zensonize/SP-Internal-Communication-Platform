CREATE TABLE users(
    userID SERIAL NOT NULL PRIMARY KEY,
    username VARCHAR(10) NOT NULL,
    alias SMALLINT NOT NULL,
    e_mail VARCHAR(60) NOT NULL,
    pwd TEXT NOT NULL,
    dateCreated TIMESTAMPZ NOT NULL,
    friendList INTEGER[]
);

CREATE TABLE servers(
    serverID SERIAL NOT NULL PRIMARY KEY,
    creator ITEGER NOT NULL,
    serverName VARCHAR(30) NOT NULL,
    serverType VARCHAR(10) NOT NULL,
    joiningLink VARCHAR(30),
    linkValid date,
    members JSON NOT NULL,
    roles JSON NOT NULL,
    dateCreated TIMESTAMPZ NOT NULL,
    pwd TEXT
);

CREATE TABLE rooms(
    roomID SERIAL NOT NULL PRIMARY KEY,
    serverID INTEGER,
    roomName VARCHAR(30),
    roomType VARCHAR(10) NOT NULL,
    stat VARCHAR(10),
    allowedRoles TEXT[] NOT NULL,
    members INTEGER[],
    dateCreated TIMESTAMPZ NOT NULL
);

CREATE TABLE chats(
    msgID SERIAL NOT NULL PRIMARY KEY,
    roomID INTEGER,
    userID INTEGER NOT NULL,
    tstamp TIMESTAMPZ NOT NULL,
    msg JSON NOT NULL
);

CREATE TABLE dms(
    msgID SERIAL NOT NULL PRIMARY KEY,
    roomID INTEGER,
    userID INTEGER NOT NULL,
    tstamp TIMESTAMPZ NOT NULL,
    msg JSON NOT NULL
);