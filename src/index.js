// Module dependencies.
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const redis = require('socket.io-redis');
const app = module.exports = express();
app.set('port', process.env.PORT || 3000);

const server = app.listen(app.get('port'), () => {
    console.log('Express server listening on port ' + app.get('port'));
});

const io_s = require('socket.io')(server);
io_s.adapter(redis({ host: 'redis-13184.c78.eu-west-1-2.ec2.cloud.redislabs.com', port: 13184, auth_pass: "oERk63TBgqihQWMYHakRnyCQoi0MSni7" }));


const io = io_s.of('/socket_your-namespace');

// view engine setup




io.on('connection', (socket) => {

    socket.on('message-all', (data) => {
        console.log('message')
        io.emit('message-all', data);
    });

    socket.on('join', (room) => {
        console.log('join')
    //    socket.join(room);
        io.emit('message-all', "Socket " + socket.id + " joined to room " + room);
    });

    socket.on('message-room', (data) => {
        const room = data.room;
        const message = data.message;
        io.to(room).emit('message-room', data);
    });


});

app.get('/clients', (req, res, next) => {
    res.send(Object.keys(io.connected));
});