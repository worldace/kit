// https://cdn.jsdelivr.net/gh/worldace/kit/kit.js

import {html, render} from 'https://unpkg.com/htm@3.1.1/preact/standalone.module.js'



function kit(self, ...vars){
    if(Array.isArray(self)){
        return html(self, ...vars)
    }
    else if(!self.shadowRoot){
        self.attachShadow({mode:'open'})
        self.$ = new Proxy(function(){}, {get:get.bind(self), apply:apply.bind(self)})

        const method = Object.getOwnPropertyNames(self.constructor.prototype).filter(v => typeof self[v] === 'function' && v !== 'constructor')
        method.forEach(v => self[v] = self[v].bind(self))

        if(self.css && document.adoptedStyleSheets){
            let css = kit.StyleSheets.get(self.constructor)
            if(!css){
                css = new CSSStyleSheet()
                css.replaceSync(self.css())
                kit.StyleSheets.set(self.constructor, css)
            }
            self.shadowRoot.adoptedStyleSheets = [css]
        }

        let dom = self.html()
        self.isVDOM = dom.constructor === undefined || Array.isArray(dom)

        if(self.isVDOM){
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
        else if(dom instanceof Node){
            if(self.css && !document.adoptedStyleSheets){
                self.shadowRoot.innerHTML = `<style>${self.css()}</style>`
            }
            if(dom.tagName === 'TEMPLATE'){
                dom = dom.content.cloneNode(true)
            }
            self.shadowRoot.append(dom)
        }

        const specialID = {'':self.shadowRoot, 'Host':self, 'Window':window, 'Document':document, 'Body':document.body}

        for(const v of method){
            const match = v.match(/^\$(.*?)_([^_]+)$/)
            if(match){
                const el = specialID[match[1]] ?? self.shadowRoot.querySelector(`#${match[1]}`)

                if(el){
                    el.addEventListener(match[2], self[v])
                }
                else{
                    throw `kit.js?????????????????????????????? ${self.constructor.name}.${match[0]} ?????????????????????????????????`
                }
            }
        }
    }
    else if(self.isVDOM){
        let dom = self.html()
        if(self.css && !document.adoptedStyleSheets){
            dom = [dom, html`<style>${self.css()}</style>`]
        }
        render(dom, self.shadowRoot)
    }
}



function get(_, name){
    return this.shadowRoot.querySelector(`#${name}`)
}



function apply(_, __, [arg, ...values]){
    if(typeof arg === 'string'){
        if(arg.startsWith('*')){
            return Array.from(this.shadowRoot.querySelectorAll(arg.substring(1) || '*'))
        }
        else{
            return this.shadowRoot.querySelector(arg)
        }
    }
    else if(Array.isArray(arg)){
        const template = document.createElement('template')
        template.innerHTML = arg.reduce((result, v, i) => result + values[i-1] + v).trim()

        return template.content.childNodes.length === 1 ? template.content.firstChild : template.content
    }
    else if(typeof arg === 'object'){
        Object.assign(this, arg)
        kit(this)
    }
}



kit.StyleSheets = new Map()


export default kit
