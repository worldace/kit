// https://cdn.jsdelivr.net/gh/worldace/kit/kit.js

import {html, render} from "https://unpkg.com/htm/preact/standalone.module.js"

function kit(self){
    if(!self.shadowRoot){
        self.attachShadow({mode:'open'})

        self.$ = new Proxy({}, {'get':function(target,name){
            return self.shadowRoot.querySelector(`#${name}`)
        }})

        for(const v of Object.getOwnPropertyNames(self.constructor.prototype)){
            if(typeof self[v] === 'function'){
                self[v] = self[v].bind(self)
            }
        }
    }
    render(self.html(), self.shadowRoot)
}

kit.h = html

export default kit
