// Module dependencies.
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const redis = require('socket.io-redis');
const app = module.exports = express();
const axios = require('axios')
const { QueryList } = require('justshare-shared')
require('dotenv').config()
const { http_request } = require('./http_request.js')

app.set('port', process.env.PORT || (process.argv[2] && process.argv[2].split('=')[1]) || 3000);

const server = app.listen(app.get('port'), () => {
    console.log('Express server listening on port ' + app.get('port'));
});
/// promArray.push(store.dispatch(new BaseService().queryThunt(QueryList.Project.LOGIN, {
///     id: '24823D31-43D5-4B08-ACAA-8AEF78484FD6',
///      secretKey: '8E9A86D9-6193-44F7-BFB2-92C7881733A8'
///  })));

const io_s = require('socket.io')(server);
io_s.adapter(redis({ host: process.env.REDIS_HOST || 'redis-13184.c78.eu-west-1-2.ec2.cloud.redislabs.com', port: process.env.REDIS_PORT || 13184, auth_pass: process.env.REDIS_PASSWORD || "oERk63TBgqihQWMYHakRnyCQoi0MSni7" }));


let createIo = (socket) => {
    console.log(`/socket_${socket}`)
    const io = io_s.of(`/socket_${socket}`);
    // view engine setup

    io.on('connection', (socket, err) => {
        console.log(err)
        let user_id = ''
        try {
         //   console.log(socket.handshake.query)
            ///   console.log(socket)

            user_id = socket.handshake.query.user_id
           // console.log(user_id)
        } catch (err) {
            console.log(err)
        }
        //console.log(socketsChat) 
        socket.on('ping', ({ id, user_id, userlist_ids }) => {
            userlist_ids.forEach(i => {
                io.emit(i + '#ping', { id, user_id });
            })

        });

        socket.on('pong', ({ id, user_id, user_dest_id }) => {
            userlist_ids.forEach(i => {
                io.emit(user_dest_id + '#pong', { id, user_id });
            })
        });

        socket.on('info', ({ id, user_src_id, msg }) => {
            io.emit(user_src_id + '#info', { id, type: 'INFO', msg: msg });
        });

        socket.on('invite', ({ id, user_src_id, user_dest_id, conv_id }) => {

            io.emit(user_dest_id + '#invite', { id, type: 'INVITE', conv_id: conv_id, user_src_id: user_src_id });
        });
        socket.on('join-room', ({ id, conv_id }) => {
            console.log('USER:' + user_id + ' join-' + conv_id)

            socket.join(conv_id);
            io.to(conv_id).emit('message-new-member', { id, user_id, conv_id });
        });
       
        socket.on('leave-room', ({ id, user_id, conv_id }) => {
            console.log('join')
            socket.leave(conv_id);
            io.to(conv_id).emit('message-room', { id, user_id, conv_id });
        });
        /*socket.on('message-join', ({ conv_id, user_id, message, createdDate }) => {
            io.to(conv_id).emit('message-room', { conv_id, user_id, message, createdDate });
        });*/
        socket.on('message-room', ({ id, conv_id, message, created_at,is_saved,users }) => {
            console.log(conv_id)
            io.to(conv_id).emit('message-room', { id, conv_id, user_id: user_id, message, created_at ,is_saved,users});
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
        succ.data.forEach(i => {
            let socket = Buffer.from(i.socket).toString('base64').replace(/=/g, '')
            if (Object.keys(io_s.nsps).filter(k => {
                return `/socket_${socket}` == k
            }).length == 0) {
                createIo(socket)
            }

        });
    })
}
init()
setInterval(() => {
    init()
}, 3600000)