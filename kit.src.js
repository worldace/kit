import {html, render} from 'https://unpkg.com/htm@3.1.1/preact/standalone.module.js'

// https://qiita.com/economist/items/2c45b992f78481ef0a08

function kit(self, ...vars){
    if(Array.isArray(self)){
        return html(self, ...vars)
    }
    else if(self.vDOM){
        render(self.html(), self.shadowRoot)
    }
    else if(!self.shadowRoot){
        self.attachShadow({mode:'open'})
        self.$ = new Proxy(function(){}, {
            get  : (_, name) => self.shadowRoot.querySelector('#'+name),
            apply: apply.bind(self),
        })

        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(self))
        methods.forEach(method => self[method] = self[method].bind(self))

        if(self.css){
            if(!self.constructor.css){
                self.constructor.css = new CSSStyleSheet()
                self.constructor.css.replaceSync(self.css())
            }
            self.shadowRoot.adoptedStyleSheets = [self.constructor.css]
        }

        const dom = self.html()
        if(typeof dom === 'string'){
            self.shadowRoot.innerHTML = dom
        }
        else if(dom instanceof Node){
            const el = dom.tagName === 'TEMPLATE' ? dom.content : dom
            self.shadowRoot.append(el.cloneNode(true))
        }
        else if(!dom.constructor || Array.isArray(dom)){
            self.vDOM = true
            render(dom, self.shadowRoot)
        }

        const specialID = {'':self.shadowRoot, 'Host':self, 'Window':window, 'Document':document}

        for(const method of methods){
            const m = method.match(/^\$(.*?)_([^_]+)$/)
            if(m){
                const el = specialID[m[1]] ?? self.$('#'+m[1])
                el.addEventListener(m[2], self[method])
            }
        }
    }
}

function apply(_, __, [arg, ...values]){
    if(typeof arg === 'string'){
        if(arg.startsWith('*')){
            return Array.from(this.shadowRoot.querySelectorAll(arg.slice(1) || '*'))
        }
        else{
            return this.shadowRoot.querySelector(arg)
        }
    }
    else if(Array.isArray(arg)){ //タグ関数で起動
        const template = document.createElement('template')
        template.innerHTML = arg.reduce((result, v, i) => result + values[i-1] + v).trim()

        return template.content.childNodes.length === 1 ? template.content.firstChild : template.content
    }
}

export default kit
