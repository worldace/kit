// https://cdn.jsdelivr.net/gh/worldace/kit/kit.js

import {html, render} from 'https://unpkg.com/htm/preact/standalone.module.js'

function kit(self){
    if(!self.shadowRoot){
        self.attachShadow({mode:'open'})
        self.$ = createProxy(self)

        const method = Object.getOwnPropertyNames(self.constructor.prototype).filter(v => typeof self[v] === 'function')
        method.forEach(v => self[v] = self[v].bind(self))

        const dom = self.html()
        self.vdom = dom.constructor === undefined || Array.isArray(dom)

        if(self.vdom){
            render(dom, self.shadowRoot)
        }
        else if(typeof dom === 'string'){
            self.shadowRoot.innerHTML = dom
        }
        else{
            self.shadowRoot.append(dom)
        }

        for(const v of method){
            const match = v.match(/^\$(.*?)_([^_]+)$/)
            if(match){
                self.shadowRoot.querySelector(`#${match[1]}`)?.addEventListener(match[2], self[v])
            }
        }
    }
    else if(self.vdom){
        render(self.html(), self.shadowRoot)
    }
}


function createProxy(self){

    function get(_, name){
        return self.shadowRoot.querySelector(`#${name}`)
    }

    function set(_, name, value){
        self[name] = value
        render(self.html(), self.shadowRoot)
        return true
    }

    function apply(_, __, args){
        const selector = args[0]

        if(selector.startsWith('*')){
            return self.shadowRoot.querySelectorAll(selector.substring(1) || '*')
        }
        else{
            return self.shadowRoot.querySelector(selector)
        }
    }

    return new Proxy(function(){}, {get, set, apply})
}


kit.h = html

export default kit
