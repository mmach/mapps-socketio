var socket = require('socket.io-client');

socket = socket('http://localhost:4000/socket_your-namespace', { transports: ['websocket'], query: { source_id: 'user_id_2', auth: 'auth' } });



socket.on('connect', function () {
    console.log('connected')
    setTimeout(function () {
        socket.emit('join',3);
    }, 5000);
});
socket.on('#user_id_2', function (data) {
    setInterval(function () {
        socket.emit('time', new Date);
    }, 5000);
    console.log(data)
});

socket.on(`#conva_id`, function (msg) {

})
socket.on(`#user_id_2#invite`, function (msg) {

})
socket.on(`#devices`, function (msg) {

})

socket.on(`message-all`, function (msg) {

    console.log(msg)

})

socket.on('disconnect', function () { console.log('disconnected') });