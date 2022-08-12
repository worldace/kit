// https://cdn.jsdelivr.net/gh/worldace/kit/kit.js

import {html, render} from 'https://unpkg.com/htm/preact/standalone.module.js'

const CSS = new Map()


function kit(self, ...vars){
    if(Array.isArray(self)){
        return html(self, ...vars)
    }

    if(!self.shadowRoot){
        self.attachShadow({mode:'open'})
        self.$ = createProxy(self)

        const method = Object.getOwnPropertyNames(self.constructor.prototype).filter(v => typeof self[v] === 'function')
        method.forEach(v => self[v] = self[v].bind(self))

        if(self.css && document.adoptedStyleSheets){
            let css = CSS.get(self.constructor)
            if(!css){
                css = new CSSStyleSheet()
                css.replaceSync(self.css())
                CSS.set(self.constructor, css)
            }
            self.shadowRoot.adoptedStyleSheets = [css]
        }

        let dom = self.html()
        self.vdom = dom.constructor === undefined || Array.isArray(dom)

        if(self.vdom){
            if(self.css && !document.adoptedStyleSheets){
                dom = [dom, html`<style>${self.css()}</style>`]
            }
            render(dom, self.shadowRoot)
        }
        else if(typeof dom === 'string'){
            if(self.css && !document.adoptedStyleSheets){
                dom += `<style>${self.css()}</style>`
            }
            self.shadowRoot.innerHTML = dom
        }
        else{
            if(self.css && !document.adoptedStyleSheets){
                self.shadowRoot.innerHTML = `<style>${self.css()}</style>`
            }
            self.shadowRoot.append(dom)
        }

        for(const v of method){
            const match = v.match(/^\$(.*?)_([^_]+)$/)
            if(match){
                const el = match[1] === '' ? self.shadowRoot : self.shadowRoot.querySelector(`#${match[1]}`)
                el.addEventListener(match[2], self[v])
            }
        }
    }
    else if(self.vdom){
        let dom = self.html()
        if(self.css && !document.adoptedStyleSheets){
            dom = [dom, html`<style>${self.css()}</style>`]
        }
        render(dom, self.shadowRoot)
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
            return Array.from(self.shadowRoot.querySelectorAll(selector.substring(1) || '*'))
        }
        else{
            return self.shadowRoot.querySelector(selector)
        }
    }

    return new Proxy(function(){}, {get, set, apply})
}


export default kit
