// https://cdn.jsdelivr.net/gh/worldace/kit/kit.js

import {html, render} from 'https://unpkg.com/htm/preact/standalone.module.js'

const StyleSheets = new Map()


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
            let css = StyleSheets.get(self.constructor)
            if(!css){
                css = new CSSStyleSheet()
                css.replaceSync(self.css())
                StyleSheets.set(self.constructor, css)
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
                    throw `kit.jsイベント登録エラー： ${self.constructor.name}.${match[0]} の登録先が存在しません`
                }
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



function get(_, name){
    return this.shadowRoot.querySelector(`#${name}`)
}

function apply(_, __, [arg]){
    if(typeof arg === 'string'){
        if(arg.startsWith('*')){
            return Array.from(this.shadowRoot.querySelectorAll(arg.substring(1) || '*'))
        }
        else{
            return this.shadowRoot.querySelector(arg)
        }
    }
    else if(typeof arg === 'object'){
        Object.assign(this, arg)
        kit(this)
    }
}


kit.ready = async function(el = document){
    const set = new Set
    el.querySelectorAll(':not(:defined)').forEach(v => set.add(v.localName))
    await Promise.all( Array.from(set).map(v => customElements.whenDefined(v)) )
    el.dispatchEvent(new CustomEvent('kitready', {bubbles:true, composed:true}))
}



export default kit
