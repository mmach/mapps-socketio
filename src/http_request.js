
const axios = require('axios')
const { QueryList } = require('justshare-shared')
const  stringify  = require('flatted').stringify;

var http_request = async (action, model, lang, token, proj) => {
   return await axios({
        method: 'get',
        url: process.env.URL + '/query?action=' + encodeURIComponent(stringify({
            "action": action, "model": encodeURIComponent(stringify(
                model
            ))
        })),
        headers: { "Authorization": `Bearer ${token}`, "Language": lang, "ProjectAuthorization": `Bearer ${proj}` }
    })
}


module.exports = { http_request }