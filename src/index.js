// Module dependencies.
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
//const redis = require('socket.io-redis');
const app = module.exports = express();
const axios = require('axios')
const { QueryList } = require('justshare-shared')
require('dotenv').config()
const { http_request } = require('./http_request.js')
const ioredis = require('ioredis')
const { createAdapter } = require('@socket.io/redis-adapter');
const { Emitter } = require("@socket.io/redis-emitter");
const cors = require('cors');
console.log('RUN SOCKETS')
app.set('port', process.env.PORT || (process.argv[2] && process.argv[2].split('=')[1]) || 3005);
app.use(cors())

const server = app.listen(app.get('port'), () => {
    console.log('Express server listening on port ' + app.get('port'));
});

const pubClient = require('redis').createClient({
    url: 'redis://default:9GP9aoV3BrtzyRu61ovBVnCmmiw1DKkE@redis-16920.c233.eu-west-1-1.ec2.cloud.redislabs.com:16920'
})
const subClient = pubClient.duplicate();

let io_s = require('socket.io')(server, {
    cors: { origin: "*", credentials: false },
})
Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io_s.adapter(createAdapter(pubClient, subClient,
        {
            requestsTimeout: 5000
        }));

})



//const emmiter = new Emitter(client);

const userMapper = []

let createIo = (soc) => {
    console.log(` create new socket namespace : /socket_${soc}`)
    const io = io_s.of(`/socket_${soc}`);
    // view engine setup

    io.on('connection', async (socket, err) => {
        let user_id = ''
        let Kupa = 'przed'
        try {
            user_id = socket.handshake.query.user_id
            console.log('connected - ' + user_id)
            console.log('socket id - ' + socket.id)

            //socket.join('USER-' + user_id);

            await io.adapter.remoteJoin(socket.id, 'USER-' + user_id);

        } catch (err) {
            console.log(err)
        }

        socket.on('time', (time) => {
            console.log(`PING : ${time}`)


        });
        socket.on('connected', (time) => {
            console.log(`PING : ${time}`)
        });
        socket.on('ping', ({ user_id }) => {
            console.log(`PING : ${socket.id}`)
        });

        socket.on('info', ({ id, user_src_id, msg }) => {
            io.emit(user_src_id + '#info', { id, type: 'INFO', msg: msg });
        });

        socket.on('invite', ({ id, user_src_id, user_dest_id, conversation_id }) => {
            console.log('invite ' + user_dest_id + 'to' + conversation_id)

            socket.to('USER-' + user_dest_id).emit('invite', { id, type: 'INVITE', conversation_id: conversation_id, user_src_id: user_src_id });
        });

        socket.on('join-room', async ({ id, conversation_id }) => {
            try {
                //if (!socket.adapter.rooms[conversation_id]) {
                console.log('USER: ' + user_id + ' joined to CONVERSATION: ' + conversation_id)
                const sockets = await io.in(conversation_id).allSockets();
                console.log(sockets)
                console.log(sockets[socket.id])

                await io.adapter.remoteJoin(socket.id, conversation_id);
                socket.to('joined-room').emit({
                    conversation_id
                });
                //socket.to(conversation_id).emit('message-new-member', { id, user_id, conversation_id });
            } catch (er) {
                console.log(er)
            }
            //}
        });
        socket.on('join-iua', async ({ id, iua_id }) => {
            //if (!socket.adapter.rooms['IUA-' + iua_id]) {
            try {
                console.log('USER: ' + user_id + ' joined to IUA: ' + iua_id)
                //socket.join('IUA-' + iua_id)
                //console.log(socket.id)
                const sockets = await io.in('IUA-' + iua_id).allSockets();
                console.log(sockets)
                console.log(sockets[socket.id])

                await io.adapter.remoteJoin(socket.id, 'IUA-' + iua_id);
                socket.to('joined-iua').emit({
                    iua_id
                });

            } catch (er) {
                console.log(er)
            }
            //socket.to('IUA-' + iua_id).emit(user_id, { id, user_id, iua_id });
            // }
        });
        socket.on('leave-iua', async ({ id, iua_id }) => {
            try {
                console.log('USER: ' + user_id + ' leave IUA: ' + iua_id)

                await io.adapter.remoteLeave(socket.id, 'IUA-' + iua_id);
                socket.to('leaved-iua').emit({
                    iua_id
                });
            } catch (er) {

            }
            //  socket.to(iua_id).emit('message-new-member', { id, user_id, conversation_id });

        });
        socket.on('leave-room', async ({ id, user_id, conversation_id }) => {
            try {
                console.log('USER: ' + user_id + ' leaved CONVERSATION: ' + conversation_id)

                await io.adapter.remoteLeave(user_id, conversation_id);
                socket.to('leaved-room').emit({
                    conversation_id
                });
            } catch (er) {

            }

            //socket.leave(conversation_id);
        });
        /*socket.on('message-join', ({ conv_id, user_id, message, createdDate }) => {
            io.to(conv_id).emit('message-room', { conv_id, user_id, message, createdDate });
        });*/

        socket.on('msg-saved', (obj) => {
            console.log('msg-saved')
            io.emit('msg-saved', obj);
        });


        socket.on("disconnect", async (reason) => {
            try {
                console.log('Socket disconnected. Reason:', reason);

                await io.adapter.remoteDisconnect(socket.id, true);
            } catch (er) {
                console.log(er)
            }
        });
        socket.on('message-room', ({ id, conversation_id, conversation }) => {
            console.log('message to conv_id' + conversation_id + ' user_id ' + user_id)
            io.to(conversation_id).emit('message-room', { id, conversation_id, conversation });
        });
    });

}
let init = () => {
    let proj = '';
    let user = ''
    http_request(QueryList.Project.LOGIN, {
        id: process.env.MAPPS_ID,
        secretKey: process.env.MAPPS_SECRET,
    }, 'pl-PL').then(succ => {
        proj = succ.data.token
        return http_request(QueryList.User.LOG_IN_INTERNAL, {
            email: process.env.USER,
            password: process.env.PASSWORD,
        }, 'pl-PL', null, succ.data.token)
    }).then(succ2 => {
        user = succ2.data.token
        return http_request(QueryList.Project.GET_PROJECT_SOCKETS, {

        }, 'pl-PL', user, proj)
    }).then(succ => {
        // console.log(io_s)
      
        succ.data.forEach(i => {
            let socket = Buffer.from(i.socket).toString('base64').replace(/=/g, '')
            // console.log(io_s)
            const test = io_s._nsps.keys()
            let exist = false
            for (const item of test) {
              
                if (item == `/socket_${socket}`) {
                    exist = true
                }
            }
       
            //console.log(io_s._nsps[`/socket_${socket}`])
            if (!exist) {

                createIo(socket)
            }

        });
    })
}
init()
setInterval(() => {
    init()
}, 360000)