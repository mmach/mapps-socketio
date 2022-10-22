
import axios from 'axios'
import { stringify } from 'flatted';

export const  http_request = async (action, model, lang, token, proj) => {
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


