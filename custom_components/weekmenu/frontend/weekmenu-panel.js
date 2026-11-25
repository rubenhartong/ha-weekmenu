var j2=Object.defineProperty;var K2=(V,C,H)=>C in V?j2(V,C,{enumerable:!0,configurable:!0,writable:!0,value:H}):V[C]=H;var t1=(V,C,H)=>K2(V,typeof C!="symbol"?C+"":C,H);var j=globalThis,K=j.ShadowRoot&&(j.ShadyCSS===void 0||j.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i1=Symbol(),f1=new WeakMap,_=class{constructor(C,H,L){if(this._$cssResult$=!0,L!==i1)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=C,this.t=H}get styleSheet(){let C=this.o,H=this.t;if(K&&C===void 0){let L=H!==void 0&&H.length===1;L&&(C=f1.get(H)),C===void 0&&((this.o=C=new CSSStyleSheet).replaceSync(this.cssText),L&&f1.set(H,C))}return C}toString(){return this.cssText}},f=V=>new _(typeof V=="string"?V:V+"",void 0,i1),a1=(V,...C)=>{let H=V.length===1?V[0]:C.reduce((L,M,e)=>L+(t=>{if(t._$cssResult$===!0)return t.cssText;if(typeof t=="number")return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(M)+V[e+1],V[0]);return new _(H,V,i1)},w1=(V,C)=>{if(K)V.adoptedStyleSheets=C.map(H=>H instanceof CSSStyleSheet?H:H.styleSheet);else for(let H of C){let L=document.createElement("style"),M=j.litNonce;M!==void 0&&L.setAttribute("nonce",M),L.textContent=H.cssText,V.appendChild(L)}},o1=K?V=>V:V=>V instanceof CSSStyleSheet?(C=>{let H="";for(let L of C.cssRules)H+=L.cssText;return f(H)})(V):V;var{is:q2,defineProperty:X2,getOwnPropertyDescriptor:Y2,getOwnPropertyNames:J2,getOwnPropertySymbols:C5,getPrototypeOf:H5}=Object,q=globalThis,k1=q.trustedTypes,V5=k1?k1.emptyScript:"",L5=q.reactiveElementPolyfillSupport,W=(V,C)=>V,A1={toAttribute(V,C){switch(C){case Boolean:V=V?V5:null;break;case Object:case Array:V=V==null?V:JSON.stringify(V)}return V},fromAttribute(V,C){let H=V;switch(C){case Boolean:H=V!==null;break;case Number:H=V===null?null:Number(V);break;case Object:case Array:try{H=JSON.parse(V)}catch{H=null}}return H}},y1=(V,C)=>!q2(V,C),b1={attribute:!0,type:String,converter:A1,reflect:!1,useDefault:!1,hasChanged:y1};Symbol.metadata??=Symbol("metadata"),q.litPropertyMetadata??=new WeakMap;var h=class extends HTMLElement{static addInitializer(C){this._$Ei(),(this.l??=[]).push(C)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(C,H=b1){if(H.state&&(H.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(C)&&((H=Object.create(H)).wrapped=!0),this.elementProperties.set(C,H),!H.noAccessor){let L=Symbol(),M=this.getPropertyDescriptor(C,L,H);M!==void 0&&X2(this.prototype,C,M)}}static getPropertyDescriptor(C,H,L){let{get:M,set:e}=Y2(this.prototype,C)??{get(){return this[H]},set(t){this[H]=t}};return{get:M,set(t){let A=M?.call(this);e?.call(this,t),this.requestUpdate(C,A,L)},configurable:!0,enumerable:!0}}static getPropertyOptions(C){return this.elementProperties.get(C)??b1}static _$Ei(){if(this.hasOwnProperty(W("elementProperties")))return;let C=H5(this);C.finalize(),C.l!==void 0&&(this.l=[...C.l]),this.elementProperties=new Map(C.elementProperties)}static finalize(){if(this.hasOwnProperty(W("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(W("properties"))){let H=this.properties,L=[...J2(H),...C5(H)];for(let M of L)this.createProperty(M,H[M])}let C=this[Symbol.metadata];if(C!==null){let H=litPropertyMetadata.get(C);if(H!==void 0)for(let[L,M]of H)this.elementProperties.set(L,M)}this._$Eh=new Map;for(let[H,L]of this.elementProperties){let M=this._$Eu(H,L);M!==void 0&&this._$Eh.set(M,H)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(C){let H=[];if(Array.isArray(C)){let L=new Set(C.flat(1/0).reverse());for(let M of L)H.unshift(o1(M))}else C!==void 0&&H.push(o1(C));return H}static _$Eu(C,H){let L=H.attribute;return L===!1?void 0:typeof L=="string"?L:typeof C=="string"?C.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(C=>this.enableUpdating=C),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(C=>C(this))}addController(C){(this._$EO??=new Set).add(C),this.renderRoot!==void 0&&this.isConnected&&C.hostConnected?.()}removeController(C){this._$EO?.delete(C)}_$E_(){let C=new Map,H=this.constructor.elementProperties;for(let L of H.keys())this.hasOwnProperty(L)&&(C.set(L,this[L]),delete this[L]);C.size>0&&(this._$Ep=C)}createRenderRoot(){let C=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return w1(C,this.constructor.elementStyles),C}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(C=>C.hostConnected?.())}enableUpdating(C){}disconnectedCallback(){this._$EO?.forEach(C=>C.hostDisconnected?.())}attributeChangedCallback(C,H,L){this._$AK(C,L)}_$ET(C,H){let L=this.constructor.elementProperties.get(C),M=this.constructor._$Eu(C,L);if(M!==void 0&&L.reflect===!0){let e=(L.converter?.toAttribute!==void 0?L.converter:A1).toAttribute(H,L.type);this._$Em=C,e==null?this.removeAttribute(M):this.setAttribute(M,e),this._$Em=null}}_$AK(C,H){let L=this.constructor,M=L._$Eh.get(C);if(M!==void 0&&this._$Em!==M){let e=L.getPropertyOptions(M),t=typeof e.converter=="function"?{fromAttribute:e.converter}:e.converter?.fromAttribute!==void 0?e.converter:A1;this._$Em=M;let A=t.fromAttribute(H,e.type);this[M]=A??this._$Ej?.get(M)??A,this._$Em=null}}requestUpdate(C,H,L,M=!1,e){if(C!==void 0){let t=this.constructor;if(M===!1&&(e=this[C]),L??=t.getPropertyOptions(C),!((L.hasChanged??y1)(e,H)||L.useDefault&&L.reflect&&e===this._$Ej?.get(C)&&!this.hasAttribute(t._$Eu(C,L))))return;this.C(C,H,L)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(C,H,{useDefault:L,reflect:M,wrapped:e},t){L&&!(this._$Ej??=new Map).has(C)&&(this._$Ej.set(C,t??H??this[C]),e!==!0||t!==void 0)||(this._$AL.has(C)||(this.hasUpdated||L||(H=void 0),this._$AL.set(C,H)),M===!0&&this._$Em!==C&&(this._$Eq??=new Set).add(C))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(H){Promise.reject(H)}let C=this.scheduleUpdate();return C!=null&&await C,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[M,e]of this._$Ep)this[M]=e;this._$Ep=void 0}let L=this.constructor.elementProperties;if(L.size>0)for(let[M,e]of L){let{wrapped:t}=e,A=this[M];t!==!0||this._$AL.has(M)||A===void 0||this.C(M,void 0,e,A)}}let C=!1,H=this._$AL;try{C=this.shouldUpdate(H),C?(this.willUpdate(H),this._$EO?.forEach(L=>L.hostUpdate?.()),this.update(H)):this._$EM()}catch(L){throw C=!1,this._$EM(),L}C&&this._$AE(H)}willUpdate(C){}_$AE(C){this._$EO?.forEach(H=>H.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(C)),this.updated(C)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(C){return!0}update(C){this._$Eq&&=this._$Eq.forEach(H=>this._$ET(H,this[H])),this._$EM()}updated(C){}firstUpdated(C){}};h.elementStyles=[],h.shadowRootOptions={mode:"open"},h[W("elementProperties")]=new Map,h[W("finalized")]=new Map,L5?.({ReactiveElement:h}),(q.reactiveElementVersions??=[]).push("2.1.2");var p1=globalThis,B1=V=>V,X=p1.trustedTypes,P1=X?X.createPolicy("lit-html",{createHTML:V=>V}):void 0,m1="$lit$",O=`lit$${Math.random().toFixed(9).slice(2)}$`,n1="?"+O,M5=`<${n1}>`,B=document,U=()=>B.createComment(""),z=V=>V===null||typeof V!="object"&&typeof V!="function",v1=Array.isArray,E1=V=>v1(V)||typeof V?.[Symbol.iterator]=="function",d1=`[ 	
\f\r]`,I=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,T1=/-->/g,F1=/>/g,b=RegExp(`>|${d1}(?:([^\\s"'>=/]+)(${d1}*=${d1}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),R1=/'/g,$1=/"/g,N1=/^(?:script|style|textarea|title)$/i,l1=V=>(C,...H)=>({_$litType$:V,strings:C,values:H}),r=l1(1),_1=l1(2),_5=l1(3),g=Symbol.for("lit-noChange"),a=Symbol.for("lit-nothing"),D1=new WeakMap,y=B.createTreeWalker(B,129);function W1(V,C){if(!v1(V)||!V.hasOwnProperty("raw"))throw Error("invalid template strings array");return P1!==void 0?P1.createHTML(C):C}var I1=(V,C)=>{let H=V.length-1,L=[],M,e=C===2?"<svg>":C===3?"<math>":"",t=I;for(let A=0;A<H;A++){let i=V[A],v,l,m=-1,p=0;for(;p<i.length&&(t.lastIndex=p,l=t.exec(i),l!==null);)p=t.lastIndex,t===I?l[1]==="!--"?t=T1:l[1]!==void 0?t=F1:l[2]!==void 0?(N1.test(l[2])&&(M=RegExp("</"+l[2],"g")),t=b):l[3]!==void 0&&(t=b):t===b?l[0]===">"?(t=M??I,m=-1):l[1]===void 0?m=-2:(m=t.lastIndex-l[2].length,v=l[1],t=l[3]===void 0?b:l[3]==='"'?$1:R1):t===$1||t===R1?t=b:t===T1||t===F1?t=I:(t=b,M=void 0);let n=t===b&&V[A+1].startsWith("/>")?" ":"";e+=t===I?i+M5:m>=0?(L.push(v),i.slice(0,m)+m1+i.slice(m)+O+n):i+O+(m===-2?A:n)}return[W1(V,e+(V[H]||"<?>")+(C===2?"</svg>":C===3?"</math>":"")),L]},G=class V{constructor({strings:C,_$litType$:H},L){let M;this.parts=[];let e=0,t=0,A=C.length-1,i=this.parts,[v,l]=I1(C,H);if(this.el=V.createElement(v,L),y.currentNode=this.el.content,H===2||H===3){let m=this.el.content.firstChild;m.replaceWith(...m.childNodes)}for(;(M=y.nextNode())!==null&&i.length<A;){if(M.nodeType===1){if(M.hasAttributes())for(let m of M.getAttributeNames())if(m.endsWith(m1)){let p=l[t++],n=M.getAttribute(m).split(O),x=/([.?@])?(.*)/.exec(p);i.push({type:1,index:e,name:x[2],strings:n,ctor:x[1]==="."?J:x[1]==="?"?C1:x[1]==="@"?H1:T}),M.removeAttribute(m)}else m.startsWith(O)&&(i.push({type:6,index:e}),M.removeAttribute(m));if(N1.test(M.tagName)){let m=M.textContent.split(O),p=m.length-1;if(p>0){M.textContent=X?X.emptyScript:"";for(let n=0;n<p;n++)M.append(m[n],U()),y.nextNode(),i.push({type:2,index:++e});M.append(m[p],U())}}}else if(M.nodeType===8)if(M.data===n1)i.push({type:2,index:e});else{let m=-1;for(;(m=M.data.indexOf(O,m+1))!==-1;)i.push({type:7,index:e}),m+=O.length-1}e++}}static createElement(C,H){let L=B.createElement("template");return L.innerHTML=C,L}};function P(V,C,H=V,L){if(C===g)return C;let M=L!==void 0?H._$Co?.[L]:H._$Cl,e=z(C)?void 0:C._$litDirective$;return M?.constructor!==e&&(M?._$AO?.(!1),e===void 0?M=void 0:(M=new e(V),M._$AT(V,H,L)),L!==void 0?(H._$Co??=[])[L]=M:H._$Cl=M),M!==void 0&&(C=P(V,M._$AS(V,C.values),M,L)),C}var Y=class{constructor(C,H){this._$AV=[],this._$AN=void 0,this._$AD=C,this._$AM=H}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(C){let{el:{content:H},parts:L}=this._$AD,M=(C?.creationScope??B).importNode(H,!0);y.currentNode=M;let e=y.nextNode(),t=0,A=0,i=L[0];for(;i!==void 0;){if(t===i.index){let v;i.type===2?v=new R(e,e.nextSibling,this,C):i.type===1?v=new i.ctor(e,i.name,i.strings,this,C):i.type===6&&(v=new V1(e,this,C)),this._$AV.push(v),i=L[++A]}t!==i?.index&&(e=y.nextNode(),t++)}return y.currentNode=B,M}p(C){let H=0;for(let L of this._$AV)L!==void 0&&(L.strings!==void 0?(L._$AI(C,L,H),H+=L.strings.length-2):L._$AI(C[H])),H++}},R=class V{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(C,H,L,M){this.type=2,this._$AH=a,this._$AN=void 0,this._$AA=C,this._$AB=H,this._$AM=L,this.options=M,this._$Cv=M?.isConnected??!0}get parentNode(){let C=this._$AA.parentNode,H=this._$AM;return H!==void 0&&C?.nodeType===11&&(C=H.parentNode),C}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(C,H=this){C=P(this,C,H),z(C)?C===a||C==null||C===""?(this._$AH!==a&&this._$AR(),this._$AH=a):C!==this._$AH&&C!==g&&this._(C):C._$litType$!==void 0?this.$(C):C.nodeType!==void 0?this.T(C):E1(C)?this.k(C):this._(C)}O(C){return this._$AA.parentNode.insertBefore(C,this._$AB)}T(C){this._$AH!==C&&(this._$AR(),this._$AH=this.O(C))}_(C){this._$AH!==a&&z(this._$AH)?this._$AA.nextSibling.data=C:this.T(B.createTextNode(C)),this._$AH=C}$(C){let{values:H,_$litType$:L}=C,M=typeof L=="number"?this._$AC(C):(L.el===void 0&&(L.el=G.createElement(W1(L.h,L.h[0]),this.options)),L);if(this._$AH?._$AD===M)this._$AH.p(H);else{let e=new Y(M,this),t=e.u(this.options);e.p(H),this.T(t),this._$AH=e}}_$AC(C){let H=D1.get(C.strings);return H===void 0&&D1.set(C.strings,H=new G(C)),H}k(C){v1(this._$AH)||(this._$AH=[],this._$AR());let H=this._$AH,L,M=0;for(let e of C)M===H.length?H.push(L=new V(this.O(U()),this.O(U()),this,this.options)):L=H[M],L._$AI(e),M++;M<H.length&&(this._$AR(L&&L._$AB.nextSibling,M),H.length=M)}_$AR(C=this._$AA.nextSibling,H){for(this._$AP?.(!1,!0,H);C!==this._$AB;){let L=B1(C).nextSibling;B1(C).remove(),C=L}}setConnected(C){this._$AM===void 0&&(this._$Cv=C,this._$AP?.(C))}},T=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(C,H,L,M,e){this.type=1,this._$AH=a,this._$AN=void 0,this.element=C,this.name=H,this._$AM=M,this.options=e,L.length>2||L[0]!==""||L[1]!==""?(this._$AH=Array(L.length-1).fill(new String),this.strings=L):this._$AH=a}_$AI(C,H=this,L,M){let e=this.strings,t=!1;if(e===void 0)C=P(this,C,H,0),t=!z(C)||C!==this._$AH&&C!==g,t&&(this._$AH=C);else{let A=C,i,v;for(C=e[0],i=0;i<e.length-1;i++)v=P(this,A[L+i],H,i),v===g&&(v=this._$AH[i]),t||=!z(v)||v!==this._$AH[i],v===a?C=a:C!==a&&(C+=(v??"")+e[i+1]),this._$AH[i]=v}t&&!M&&this.j(C)}j(C){C===a?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,C??"")}},J=class extends T{constructor(){super(...arguments),this.type=3}j(C){this.element[this.name]=C===a?void 0:C}},C1=class extends T{constructor(){super(...arguments),this.type=4}j(C){this.element.toggleAttribute(this.name,!!C&&C!==a)}},H1=class extends T{constructor(C,H,L,M,e){super(C,H,L,M,e),this.type=5}_$AI(C,H=this){if((C=P(this,C,H,0)??a)===g)return;let L=this._$AH,M=C===a&&L!==a||C.capture!==L.capture||C.once!==L.once||C.passive!==L.passive,e=C!==a&&(L===a||M);M&&this.element.removeEventListener(this.name,this,L),e&&this.element.addEventListener(this.name,this,C),this._$AH=C}handleEvent(C){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,C):this._$AH.handleEvent(C)}},V1=class{constructor(C,H,L){this.element=C,this.type=6,this._$AN=void 0,this._$AM=H,this.options=L}get _$AU(){return this._$AM._$AU}_$AI(C){P(this,C)}},U1={M:m1,P:O,A:n1,C:1,L:I1,R:Y,D:E1,V:P,I:R,H:T,N:C1,U:H1,B:J,F:V1},r5=p1.litHtmlPolyfillSupport;r5?.(G,R),(p1.litHtmlVersions??=[]).push("3.3.3");var z1=(V,C,H)=>{let L=H?.renderBefore??C,M=L._$litPart$;if(M===void 0){let e=H?.renderBefore??null;L._$litPart$=M=new R(C.insertBefore(U(),e),e,void 0,H??{})}return M._$AI(V),M};var x1=globalThis,w=class extends h{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let C=super.createRenderRoot();return this.renderOptions.renderBefore??=C.firstChild,C}update(C){let H=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(C),this._$Do=z1(H,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return g}};w._$litElement$=!0,w.finalized=!0,x1.litElementHydrateSupport?.({LitElement:w});var e5=x1.litElementPolyfillSupport;e5?.({LitElement:w});(x1.litElementVersions??=[]).push("4.2.2");var t5={light:{bg:"#fafafa",surface:"#ffffff",surface2:"#f3f3f3",text:"#212121",text2:"#626262",line:"#e6e6e6",border:"#878787",accent:"#1f7a45",onAccent:"#ffffff",accentSoft:"#e9f2ec",attention:"#9a4f0c",attentionSoft:"#f6ede6",danger:"#c62f37",onDanger:"#ffffff",dangerSoft:"#faeaeb",deal:"#6b4a00",dealSoft:"#fff1c2",scrim:"rgba(0,0,0,.45)",toast:"#2a2a2a",onToast:"#ffffff",toastAction:"#8fe0b0"},dark:{bg:"#111111",surface:"#1c1c1c",surface2:"#262626",text:"#e1e1e1",text2:"#a3a3a3",line:"#2e2e2e",border:"#7c7c7c",accent:"#5fcf8d",onAccent:"#0b1f14",accentSoft:"#1f3328",attention:"#f0a25a",attentionSoft:"#35291e",danger:"#ff7a7a",onDanger:"#2a0b0b",dangerSoft:"#3a2223",deal:"#ffd666",dealSoft:"#3a3320",scrim:"rgba(0,0,0,.6)",toast:"#e8e8e8",onToast:"#121212",toastAction:"#19683a"}},G1={bg:"--primary-background-color",surface:"--card-background-color",text:"--primary-text-color"},i5=V=>V.replace(/[A-Z0-9]/g,C=>"-"+C.toLowerCase());function Z1(V){return Object.entries(t5[V]).map(([C,H])=>`--wm-${i5(C)}: ${G1[C]?`var(${G1[C]}, ${H})`:H};`).join(`
  `)}var Q1=`
  --wm-font: var(--ha-font-family-body, var(--mdc-typography-font-family, Roboto, system-ui, -apple-system, "Segoe UI", sans-serif));
  --wm-fs-xs: 12px; --wm-fs-sm: 14px; --wm-fs-md: 16px; --wm-fs-lg: 20px; --wm-fs-xl: 28px; --wm-fs-cook: clamp(24px, 4.4vw, 38px);
  --wm-fw-regular: 400; --wm-fw-medium: 500; --wm-fw-bold: 700;
  --wm-s1: 4px; --wm-s2: 8px; --wm-s3: 12px; --wm-s4: 16px; --wm-s5: 24px; --wm-s6: 32px;
  --wm-r-sm: 8px; --wm-r-md: 12px; --wm-r-lg: 20px; --wm-r-full: 999px;
  --wm-ease: cubic-bezier(.2, .8, .2, 1);
`,s1={light:"--wm-shadow-1: 0 1px 2px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.04); --wm-shadow-2: 0 8px 28px rgba(0,0,0,.18); --wm-edge: transparent;",dark:"--wm-shadow-1: none; --wm-shadow-2: 0 8px 28px rgba(0,0,0,.6); --wm-edge: rgba(255,255,255,.07);"};var j1=a1`
:host {
  ${f(Z1("light"))}
  ${f(s1.light)}
  ${f(Q1)}
  display: block; height: 100%;
  font-family: var(--wm-font); font-size: var(--wm-fs-md); line-height: 1.4;
  color: var(--wm-text); background: var(--wm-bg);
  -webkit-tap-highlight-color: transparent;
}
:host([dark]) {
  ${f(Z1("dark"))}
  ${f(s1.dark)}
}
* { box-sizing: border-box; }
button { font: inherit; color: inherit; border: 0; background: none; cursor: pointer; padding: 0; text-align: inherit; }
button:focus-visible, input:focus-visible, [tabindex]:focus-visible { outline: 2px solid var(--wm-accent); outline-offset: 2px; }
button[disabled] { cursor: default; }
svg.i { width: 20px; height: 20px; flex: none; fill: currentColor; display: block; }
svg.i.sm { width: 16px; height: 16px; }
svg.i.lg { width: 24px; height: 24px; }
.vh { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* ---------- shell ---------- */
.app { display: flex; flex-direction: column; height: 100%; }
header {
  display: flex; align-items: center; gap: var(--wm-s2); height: 56px; flex: none;
  padding: 0 var(--wm-s3); padding-top: env(safe-area-inset-top);
  box-sizing: content-box;
  background: var(--app-header-background-color, var(--wm-surface)); color: var(--app-header-text-color, var(--wm-text));
  border-bottom: 1px solid var(--wm-line);
}
header h1 { margin: 0; font-size: var(--wm-fs-lg); font-weight: var(--wm-fw-medium); flex: 1; min-width: 0; }
header .sub { display: block; font-size: var(--wm-fs-xs); font-weight: var(--wm-fw-regular); opacity: .75; }
.htabs { display: flex; gap: var(--wm-s1); }
.htabs button { display: flex; align-items: center; gap: var(--wm-s2); height: 40px; padding: 0 var(--wm-s4); border-radius: var(--wm-r-full); font-size: var(--wm-fs-sm); font-weight: var(--wm-fw-medium); opacity: .8; }
.htabs button[aria-selected="true"] { background: var(--wm-accent-soft); color: var(--wm-accent); opacity: 1; }
main { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
.wrap { max-width: 1120px; margin: 0 auto; padding: var(--wm-s4) var(--wm-s4) calc(var(--wm-s6) + var(--bar-h, 0px)); }
.tabbar {
  display: flex; flex: none; background: var(--wm-surface); border-top: 1px solid var(--wm-line);
  padding-bottom: env(safe-area-inset-bottom);
}
.tabbar button { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: var(--wm-s2) 0 6px; font-size: var(--wm-fs-xs); font-weight: var(--wm-fw-medium); color: var(--wm-text2); }
.tabbar button .pill { padding: 4px 18px; border-radius: var(--wm-r-full); transition: background .2s; }
.tabbar button[aria-selected="true"] { color: var(--wm-text); }
.tabbar button[aria-selected="true"] .pill { background: var(--wm-accent-soft); color: var(--wm-accent); }
.tabbar .badge { position: absolute; margin: -4px 0 0 18px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px; background: var(--wm-attention); color: var(--wm-surface); font-size: 11px; line-height: 16px; text-align: center; }

/* ---------- action bar (sticky primary action) ---------- */
.actionbar {
  flex: none; display: flex; align-items: center; gap: var(--wm-s3);
  padding: var(--wm-s3) max(var(--wm-s4), calc((100% - 1120px) / 2 + var(--wm-s4))); background: var(--wm-surface); border-top: 1px solid var(--wm-line);
}
.actionbar .sum { flex: 1; min-width: 0; line-height: 1.25; }
.actionbar .sum b { font-size: var(--wm-fs-lg); font-weight: var(--wm-fw-bold); font-variant-numeric: tabular-nums; }
.actionbar .sum span { display: block; font-size: var(--wm-fs-xs); color: var(--wm-text2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.progress { height: 4px; border-radius: 2px; background: var(--wm-accent-soft); overflow: hidden; margin-top: 6px; }
.progress i { display: block; height: 100%; background: var(--wm-accent); transition: width .3s var(--wm-ease); }

/* ---------- buttons ---------- */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--wm-s2);
  min-height: 48px; padding: 0 var(--wm-s5); border-radius: var(--wm-r-md);
  font-weight: var(--wm-fw-medium); background: var(--wm-accent); color: var(--wm-on-accent);
  transition: transform .1s, opacity .2s; white-space: nowrap;
}
.btn:active:not([disabled]) { transform: scale(.98); }
.btn[disabled] { opacity: .45; }
.btn.tonal { background: var(--wm-accent-soft); color: var(--wm-accent); }
.btn.outline { background: transparent; color: var(--wm-accent); box-shadow: inset 0 0 0 1.5px var(--wm-accent); }
.btn.plain { background: transparent; color: var(--wm-text); box-shadow: inset 0 0 0 1px var(--wm-border); }
.btn.danger { background: var(--wm-danger); color: var(--wm-on-danger); }
.btn.sm { min-height: 40px; padding: 0 var(--wm-s4); font-size: var(--wm-fs-sm); }
.btn.block { width: 100%; }
.link { color: var(--wm-accent); font-weight: var(--wm-fw-medium); font-size: var(--wm-fs-sm); display: inline-flex; align-items: center; gap: var(--wm-s1); min-height: 40px; }
.iconbtn { width: 40px; height: 40px; border-radius: var(--wm-r-full); display: grid; place-items: center; color: var(--wm-text2); }
.iconbtn:hover { background: var(--wm-surface2); }

/* ---------- surfaces & text ---------- */
.card { background: var(--wm-surface); border-radius: var(--wm-r-lg); padding: var(--wm-s4); box-shadow: var(--wm-shadow-1), inset 0 0 0 1px var(--wm-edge); }
.card + .card, .card + .section, .section + .card { margin-top: var(--wm-s4); }
.section { margin-top: var(--wm-s5); }
.section:first-child { margin-top: 0; }
.sh { display: flex; align-items: baseline; justify-content: space-between; gap: var(--wm-s3); margin: 0 var(--wm-s1) var(--wm-s3); }
.sh h2 { margin: 0; font-size: var(--wm-fs-lg); font-weight: var(--wm-fw-medium); }
.sh .meta { font-size: var(--wm-fs-sm); color: var(--wm-text2); font-variant-numeric: tabular-nums; }
.muted { color: var(--wm-text2); }
.xs { font-size: var(--wm-fs-xs); }
.sm { font-size: var(--wm-fs-sm); }
.num { font-variant-numeric: tabular-nums; }
.row { display: flex; align-items: center; gap: var(--wm-s3); }
.row.wrap { flex-wrap: wrap; }
.grow { flex: 1; min-width: 0; }
.stack > * + * { margin-top: var(--wm-s3); }

/* tags: one look per colour role */
.tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: var(--wm-r-sm); font-size: var(--wm-fs-xs); font-weight: var(--wm-fw-medium); line-height: 18px; white-space: nowrap; }
.tag.neutral { background: var(--wm-surface2); color: var(--wm-text2); }
.tag.ok { background: var(--wm-accent-soft); color: var(--wm-accent); }
.tag.deal { background: var(--wm-deal-soft); color: var(--wm-deal); }
.tag.attention { background: var(--wm-attention-soft); color: var(--wm-attention); }
.tag.danger { background: var(--wm-danger-soft); color: var(--wm-danger); }
.save { color: var(--wm-accent); font-weight: var(--wm-fw-medium); }

/* ---------- week: status ---------- */
.status .total { font-size: var(--wm-fs-xl); font-weight: var(--wm-fw-bold); letter-spacing: -.01em; font-variant-numeric: tabular-nums; line-height: 1.1; }
.status .facts { display: flex; flex-wrap: wrap; gap: var(--wm-s1) var(--wm-s3); font-size: var(--wm-fs-sm); color: var(--wm-text2); }
.status .actions { display: flex; gap: var(--wm-s2); flex-wrap: wrap; }
.status .actions .btn { flex: 1; }
.note { display: flex; gap: var(--wm-s2); align-items: flex-start; font-size: var(--wm-fs-sm); padding: var(--wm-s3); border-radius: var(--wm-r-md); background: var(--wm-surface2); }
.note svg { color: var(--wm-text2); margin-top: 1px; }
.note.attention { background: var(--wm-attention-soft); color: var(--wm-attention); }
.note.attention svg { color: inherit; }
.note.danger { background: var(--wm-danger-soft); color: var(--wm-danger); }
.note.danger svg { color: inherit; }
.note ul { margin: 4px 0 0; padding-left: 18px; }

/* ---------- tonight / rate ---------- */
.tonight { padding: 0; overflow: hidden; display: grid; grid-template-columns: 1fr; }
.tonight .photo { aspect-ratio: 16 / 8; background: var(--wm-surface2); display: grid; place-items: center; font-size: 56px; overflow: hidden; }
.tonight .photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.tonight .body { padding: var(--wm-s4); display: grid; gap: var(--wm-s3); }
.eyebrow { font-size: var(--wm-fs-xs); font-weight: var(--wm-fw-bold); letter-spacing: .06em; text-transform: uppercase; color: var(--wm-text2); }
.tonight h3 { margin: 0; font-size: var(--wm-fs-lg); font-weight: var(--wm-fw-medium); line-height: 1.25; }
.rate { display: flex; gap: var(--wm-s2); }
.rate button { flex: 1; min-height: 48px; border-radius: var(--wm-r-md); display: flex; align-items: center; justify-content: center; gap: var(--wm-s2); box-shadow: inset 0 0 0 1px var(--wm-border); font-weight: var(--wm-fw-medium); }
.rate button[aria-pressed="true"] { background: var(--wm-accent-soft); color: var(--wm-accent); box-shadow: inset 0 0 0 1.5px var(--wm-accent); }

/* ---------- week: days ---------- */
.prog { display: flex; gap: 4px; margin: 0 var(--wm-s1) var(--wm-s3); }
.prog i { flex: 1; height: 6px; border-radius: 3px; box-shadow: inset 0 0 0 1.5px var(--wm-border); }
.prog i.on { background: var(--wm-accent); box-shadow: none; }
.prog i.none { box-shadow: none; background: repeating-linear-gradient(135deg, var(--wm-border) 0 3px, transparent 3px 6px); }
.days { background: var(--wm-surface); border-radius: var(--wm-r-lg); overflow: hidden; box-shadow: var(--wm-shadow-1), inset 0 0 0 1px var(--wm-edge); }
.day + .day { border-top: 1px solid var(--wm-line); }
.dhead { width: 100%; display: flex; align-items: center; gap: var(--wm-s3); padding: var(--wm-s3) var(--wm-s4); min-height: 72px; }
.day.past .dhead { opacity: .55; }
.dtile { width: 48px; height: 52px; flex: none; border-radius: var(--wm-r-md); background: var(--wm-surface2); display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1; }
.dtile small { font-size: 11px; font-weight: var(--wm-fw-bold); letter-spacing: .06em; text-transform: uppercase; color: var(--wm-text2); }
.dtile b { font-size: var(--wm-fs-lg); font-weight: var(--wm-fw-bold); margin-top: 4px; font-variant-numeric: tabular-nums; }
.day.today .dtile { background: var(--wm-accent); color: var(--wm-on-accent); }
.day.today .dtile small { color: inherit; opacity: .85; }
.dmid { flex: 1; min-width: 0; display: grid; gap: 2px; }
.dslot { font-size: var(--wm-fs-xs); font-weight: var(--wm-fw-medium); letter-spacing: .04em; text-transform: uppercase; color: var(--wm-text2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dmain { display: flex; align-items: center; gap: var(--wm-s2); min-width: 0; font-weight: var(--wm-fw-medium); }
.dmain .tt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dmain.open { color: var(--wm-attention); }
.dmain.open::before { content: ""; width: 8px; height: 8px; border-radius: 50%; flex: none; box-shadow: inset 0 0 0 2px currentColor; }
.dmain.none { color: var(--wm-text2); font-weight: var(--wm-fw-regular); }
.dthumb { width: 28px; height: 28px; border-radius: var(--wm-r-sm); object-fit: cover; flex: none; background: var(--wm-surface2); }
.dnote { font-size: var(--wm-fs-xs); color: var(--wm-text2); }
.dright { display: flex; align-items: center; gap: var(--wm-s1); color: var(--wm-text2); font-size: var(--wm-fs-sm); font-variant-numeric: tabular-nums; }
.chev { transition: transform .2s var(--wm-ease); }
.day.open .chev { transform: rotate(90deg); }
.dbody { animation: reveal .22s var(--wm-ease); }
@keyframes reveal { from { opacity: 0; transform: translateY(-4px); } }
.strip { display: flex; gap: var(--wm-s3); overflow-x: auto; scroll-snap-type: x mandatory; padding: 2px var(--wm-s4) var(--wm-s3); scrollbar-width: none; scroll-padding: 0 var(--wm-s4); }
.strip::-webkit-scrollbar { display: none; }
.ocard { scroll-snap-align: start; flex: 0 0 min(84%, 340px); border-radius: var(--wm-r-lg); background: var(--wm-surface2); display: flex; flex-direction: column; overflow: hidden; position: relative; box-shadow: inset 0 0 0 1px transparent; transition: box-shadow .2s; }
.ocard.on { box-shadow: inset 0 0 0 2px var(--wm-accent); }
.ocard .photo { aspect-ratio: 16 / 9; background: var(--wm-line); overflow: hidden; }
.ocard .photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ocard .chosen { position: absolute; top: var(--wm-s3); right: var(--wm-s3); display: inline-flex; align-items: center; gap: 4px; background: var(--wm-accent); color: var(--wm-on-accent); font-size: var(--wm-fs-xs); font-weight: var(--wm-fw-bold); padding: 4px 10px 4px 6px; border-radius: var(--wm-r-full); }
.ocard.on:not(:has(.photo)) .ohead { padding-right: 96px; }
.ocard .in { padding: var(--wm-s4); display: flex; flex-direction: column; gap: var(--wm-s3); flex: 1; }
.ohead { display: flex; gap: var(--wm-s3); align-items: flex-start; }
.oemoji { width: 48px; height: 48px; flex: none; border-radius: var(--wm-r-md); background: var(--wm-surface); display: grid; place-items: center; font-size: 26px; color: var(--wm-text2); }
.otitle { font-weight: var(--wm-fw-medium); line-height: 1.3; }
.ometa { font-size: var(--wm-fs-sm); color: var(--wm-text2); display: flex; flex-wrap: wrap; gap: 0 var(--wm-s2); margin-top: 2px; }
.ometa span + span::before { content: "·"; margin-right: var(--wm-s2); }
.ings { margin: 0; padding: 0; list-style: none; font-size: var(--wm-fs-sm); display: grid; gap: 4px; }
.ings li { display: flex; gap: var(--wm-s2); align-items: baseline; min-width: 0; }
.ings .q { color: var(--wm-text2); font-variant-numeric: tabular-nums; }
.ings .n { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ings .more { color: var(--wm-text2); }
.ofoot { margin-top: auto; display: grid; gap: var(--wm-s1); }
.ocard.on .ofoot .btn { background: transparent; color: var(--wm-accent); box-shadow: inset 0 0 0 1.5px var(--wm-accent); }
.ocard.more { background: transparent; box-shadow: inset 0 0 0 1.5px var(--wm-border); }
.ocard.more input { width: 100%; }
.spin { animation: spin 1.2s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.sdots { display: flex; gap: 6px; justify-content: center; padding: 0 0 var(--wm-s4); }
.sdots i { width: 6px; height: 6px; border-radius: 3px; background: var(--wm-border); opacity: .5; transition: width .2s, opacity .2s, background .2s; }
.sdots i.on { width: 18px; opacity: 1; background: var(--wm-text2); }
.sdots i.ch { background: var(--wm-accent); opacity: 1; }
.weekgrid { display: grid; gap: var(--wm-s5); align-items: start; }
.weekgrid > div { min-width: 0; }

/* ---------- questions / michelle ---------- */
.q + .q { border-top: 1px solid var(--wm-line); margin-top: var(--wm-s4); padding-top: var(--wm-s4); }
.qt { display: flex; gap: var(--wm-s2); align-items: center; font-weight: var(--wm-fw-medium); margin-bottom: var(--wm-s2); }
.qt .who { width: 28px; height: 28px; border-radius: 50%; background: var(--wm-surface2); display: grid; place-items: center; font-size: var(--wm-fs-xs); font-weight: var(--wm-fw-bold); color: var(--wm-text2); flex: none; }
.qt .sub { font-weight: var(--wm-fw-regular); color: var(--wm-text2); font-size: var(--wm-fs-sm); }
.chips { display: flex; flex-wrap: wrap; gap: var(--wm-s2); }
.chip { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border-radius: var(--wm-r-full); box-shadow: inset 0 0 0 1px var(--wm-border); font-size: var(--wm-fs-sm); font-weight: var(--wm-fw-medium); }
.chip[aria-pressed="true"] { background: var(--wm-accent); color: var(--wm-on-accent); box-shadow: none; }
.chip .new { font-size: 11px; color: var(--wm-text2); font-weight: var(--wm-fw-regular); }
.chip[aria-pressed="true"] .new { color: inherit; opacity: .8; }
.opts { display: grid; gap: var(--wm-s2); margin-top: var(--wm-s3); }
.opt { display: flex; align-items: center; gap: var(--wm-s3); padding: var(--wm-s3); border-radius: var(--wm-r-md); background: var(--wm-surface2); min-height: 56px; }
.opt[aria-pressed="true"] { background: var(--wm-accent-soft); box-shadow: inset 0 0 0 2px var(--wm-accent); }
.opt .e { font-size: 24px; }
.opt .n { flex: 1; font-weight: var(--wm-fw-medium); }

/* ---------- inputs & search ---------- */
.field { position: relative; }
.input {
  width: 100%; min-width: 0; height: 48px; padding: 0 var(--wm-s4) 0 44px; border-radius: var(--wm-r-md);
  border: 1px solid var(--wm-border); background: var(--wm-surface); color: var(--wm-text);
  font: inherit; font-size: 16px; outline: none;
}
.input.plain { padding-left: var(--wm-s4); }
.input::placeholder { color: var(--wm-text2); }
.input:focus { border-color: var(--wm-accent); box-shadow: 0 0 0 1px var(--wm-accent); outline: none; }
.field > svg { position: absolute; left: 14px; top: 14px; color: var(--wm-text2); pointer-events: none; }
.sugg { margin-top: var(--wm-s1); background: var(--wm-surface); border-radius: var(--wm-r-md); box-shadow: var(--wm-shadow-2), inset 0 0 0 1px var(--wm-edge); overflow: hidden; }
.sugg button { width: 100%; display: flex; align-items: center; gap: var(--wm-s3); padding: var(--wm-s2) var(--wm-s3); min-height: 56px; }
.sugg button + button, .sugg .hint + button { border-top: 1px solid var(--wm-line); }
.sugg button:hover, .sugg button:focus-visible { background: var(--wm-surface2); }
.sugg .hint { padding: var(--wm-s3); font-size: var(--wm-fs-sm); color: var(--wm-text2); }
.sugg .plus { color: var(--wm-accent); }

/* ---------- list ---------- */
.seg { display: flex; padding: 4px; border-radius: var(--wm-r-md); background: var(--wm-surface2); margin-bottom: var(--wm-s4); }
.seg button { flex: 1; height: 40px; border-radius: var(--wm-r-sm); font-size: var(--wm-fs-sm); font-weight: var(--wm-fw-medium); color: var(--wm-text2); text-align: center; }
.seg button[aria-selected="true"] { background: var(--wm-surface); color: var(--wm-text); box-shadow: var(--wm-shadow-1), inset 0 0 0 1px var(--wm-edge); }
.tools { display: grid; gap: var(--wm-s2); margin-bottom: var(--wm-s2); }
.gh { display: flex; justify-content: space-between; align-items: baseline; margin: var(--wm-s5) var(--wm-s1) var(--wm-s2); font-weight: var(--wm-fw-medium); }
.gh span:last-child { color: var(--wm-text2); font-weight: var(--wm-fw-regular); font-size: var(--wm-fs-sm); font-variant-numeric: tabular-nums; }
.group { background: var(--wm-surface); border-radius: var(--wm-r-lg); overflow: hidden; box-shadow: var(--wm-shadow-1), inset 0 0 0 1px var(--wm-edge); }
.rowwrap { position: relative; overflow: hidden; }
.rowwrap + .rowwrap { border-top: 1px solid var(--wm-line); }
.rowwrap .behind { position: absolute; inset: 0; background: var(--wm-danger); color: var(--wm-on-danger); display: flex; align-items: center; justify-content: flex-end; gap: var(--wm-s2); padding-right: var(--wm-s5); font-weight: var(--wm-fw-medium); opacity: 0; }
.rowwrap.drag .behind { opacity: 1; }
.item { position: relative; display: flex; align-items: center; gap: var(--wm-s3); padding: var(--wm-s3); background: var(--wm-surface); touch-action: pan-y; transition: transform .2s var(--wm-ease); }
.item.dragging { transition: none; }
.thumb { width: 48px; height: 48px; flex: none; border-radius: var(--wm-r-md); background: var(--wm-surface2); display: grid; place-items: center; overflow: hidden; color: var(--wm-text2); }
.thumb img { width: 100%; height: 100%; object-fit: contain; }
.info { flex: 1; min-width: 0; }
.info .n { font-weight: var(--wm-fw-medium); line-height: 1.25; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.info .s { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; margin-top: 4px; font-size: var(--wm-fs-xs); color: var(--wm-text2); }
.stepper { display: flex; align-items: center; border-radius: var(--wm-r-full); box-shadow: inset 0 0 0 1px var(--wm-border); }
.stepper button { width: 40px; height: 40px; border-radius: var(--wm-r-full); display: grid; place-items: center; color: var(--wm-accent); }
.stepper span { min-width: 20px; text-align: center; font-weight: var(--wm-fw-medium); font-variant-numeric: tabular-nums; }
.price { width: 64px; text-align: right; font-size: var(--wm-fs-sm); font-weight: var(--wm-fw-medium); font-variant-numeric: tabular-nums; }
.price.unknown { color: var(--wm-text2); font-weight: var(--wm-fw-regular); }
details.removed { margin-top: var(--wm-s5); }
details.removed summary { cursor: pointer; color: var(--wm-text2); font-weight: var(--wm-fw-medium); padding: var(--wm-s2) var(--wm-s1); list-style: none; display: flex; align-items: center; gap: var(--wm-s2); }
details.removed .r { display: flex; justify-content: space-between; align-items: center; padding: var(--wm-s2) var(--wm-s4); color: var(--wm-text2); }

/* ---------- empty / skeleton ---------- */
.empty { text-align: center; padding: var(--wm-s6) var(--wm-s4); color: var(--wm-text2); display: grid; justify-items: center; gap: var(--wm-s3); }
.empty svg { width: 48px; height: 48px; opacity: .6; }
.empty p { margin: 0; max-width: 32ch; }
.skel { background: linear-gradient(90deg, var(--wm-surface2) 25%, var(--wm-line) 50%, var(--wm-surface2) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: var(--wm-r-lg); }
@keyframes shimmer { to { background-position: -200% 0; } }

/* ---------- sheets ---------- */
.scrim { position: fixed; inset: 0; background: var(--wm-scrim); z-index: 15; animation: fade .2s; }
@keyframes fade { from { opacity: 0; } }
.sheet {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 16; max-height: 88vh; overflow-y: auto; overscroll-behavior: contain;
  background: var(--wm-surface); border-radius: var(--wm-r-lg) var(--wm-r-lg) 0 0;
  padding: var(--wm-s2) var(--wm-s5) calc(var(--wm-s5) + env(safe-area-inset-bottom));
  box-shadow: var(--wm-shadow-2); max-width: 640px; margin: 0 auto; animation: up .28s var(--wm-ease);
}
@keyframes up { from { transform: translateY(40px); opacity: 0; } }
.sheet .grab { width: 36px; height: 4px; border-radius: 2px; background: var(--wm-border); opacity: .6; margin: 0 auto var(--wm-s4); }
.sheet h3 { margin: 0; font-size: var(--wm-fs-lg); font-weight: var(--wm-fw-medium); line-height: 1.3; }
.sheet .sec { font-size: var(--wm-fs-xs); font-weight: var(--wm-fw-bold); letter-spacing: .06em; text-transform: uppercase; color: var(--wm-text2); margin: var(--wm-s5) 0 var(--wm-s2); }
.sheet ol { margin: 0; padding-left: 20px; display: grid; gap: var(--wm-s2); }
.sheet .photo { aspect-ratio: 16 / 9; border-radius: var(--wm-r-md); overflow: hidden; margin-bottom: var(--wm-s4); background: var(--wm-surface2); }
.sheet .photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sheet .acts { display: flex; gap: var(--wm-s2); margin-top: var(--wm-s5); position: sticky; bottom: calc(-1 * var(--wm-s5)); background: var(--wm-surface); padding: var(--wm-s3) 0 0; }
.sheet .acts .btn { flex: 1; }
.sheet .acts .btn.main { flex: 2; }
.lines { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
.lines li { display: flex; justify-content: space-between; gap: var(--wm-s3); padding: var(--wm-s2) 0; border-bottom: 1px solid var(--wm-line); font-size: var(--wm-fs-sm); }
.lines li:last-child { border-bottom: 0; }
.lines li b { font-weight: var(--wm-fw-medium); font-variant-numeric: tabular-nums; }
.prow { display: flex; gap: var(--wm-s3); align-items: flex-start; width: 100%; padding: var(--wm-s3); border-radius: var(--wm-r-md); background: var(--wm-surface2); }
.prow + .prow { margin-top: var(--wm-s2); }
.prow[aria-checked="true"] { background: var(--wm-accent-soft); }
.box { flex: none; width: 22px; height: 22px; border-radius: 6px; box-shadow: inset 0 0 0 2px var(--wm-border); display: grid; place-items: center; color: var(--wm-on-accent); margin-top: 1px; }
[aria-checked="true"] > .box { background: var(--wm-accent); box-shadow: none; }
.prow .pt { flex: 1; min-width: 0; font-size: var(--wm-fs-sm); }
.prow .was { color: var(--wm-text2); text-decoration: line-through; }
.prow .nu { font-weight: var(--wm-fw-medium); }
.prow .ps { flex: none; font-weight: var(--wm-fw-bold); color: var(--wm-accent); font-variant-numeric: tabular-nums; }

/* ---------- cooking ---------- */
.cook { position: fixed; inset: 0; z-index: 20; background: var(--wm-surface); display: flex; flex-direction: column; animation: fade .2s; }
.cook .top { display: flex; align-items: center; gap: var(--wm-s3); padding: calc(var(--wm-s2) + env(safe-area-inset-top)) var(--wm-s3) var(--wm-s2) var(--wm-s4); border-bottom: 1px solid var(--wm-line); }
.cook .top .t { flex: 1; font-weight: var(--wm-fw-medium); font-size: var(--wm-fs-md); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cook .stage { flex: 1; display: grid; grid-template-columns: 1fr; position: relative; overflow: hidden; }
.cook .side { display: none; padding: var(--wm-s5); border-right: 1px solid var(--wm-line); overflow-y: auto; }
.cook .main { padding: var(--wm-s6) var(--wm-s5) var(--wm-s5); display: flex; flex-direction: column; justify-content: center; gap: var(--wm-s5); overflow-y: auto; }
.cook .stepno { color: var(--wm-accent); font-weight: var(--wm-fw-bold); font-size: var(--wm-fs-sm); letter-spacing: .06em; text-transform: uppercase; }
.cook .txt { font-size: var(--wm-fs-cook); line-height: 1.3; font-weight: var(--wm-fw-regular); }
.cook .tap { position: absolute; top: 0; bottom: 0; width: 22%; z-index: 2; }
.cook .tap.l { left: 0; } .cook .tap.r { right: 0; }
.cook .bottom { display: flex; align-items: center; gap: var(--wm-s3); padding: var(--wm-s3) var(--wm-s4) calc(var(--wm-s3) + env(safe-area-inset-bottom)); border-top: 1px solid var(--wm-line); }
.dots { flex: 1; display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
.dots i { width: 8px; height: 8px; border-radius: 4px; background: var(--wm-border); opacity: .5; transition: width .2s; }
.dots i.on { width: 24px; background: var(--wm-accent); opacity: 1; }
.nav { width: 56px; height: 56px; border-radius: var(--wm-r-full); display: grid; place-items: center; box-shadow: inset 0 0 0 1px var(--wm-border); }
.nav.p { background: var(--wm-accent); color: var(--wm-on-accent); box-shadow: none; }
.nav[disabled] { opacity: .3; }
.timers { display: flex; gap: var(--wm-s2); flex-wrap: wrap; }
.tchip { display: inline-flex; align-items: center; gap: var(--wm-s2); min-height: 40px; padding: 0 14px; border-radius: var(--wm-r-full); background: var(--wm-surface2); font-weight: var(--wm-fw-medium); font-variant-numeric: tabular-nums; }
.tchip.done { background: var(--wm-attention); color: var(--wm-surface); animation: pulse 1s infinite; }
@keyframes pulse { 50% { opacity: .7; } }
.ing { list-style: none; padding: 0; margin: 0; }
.ing li + li { border-top: 1px solid var(--wm-line); }
.ing button { width: 100%; display: flex; gap: var(--wm-s3); align-items: center; padding: var(--wm-s3) var(--wm-s1); font-size: 18px; min-height: 52px; }
.ing button[aria-checked="true"] { color: var(--wm-text2); text-decoration: line-through; }
.pick { display: grid; gap: var(--wm-s2); }
.pick button { display: flex; align-items: center; gap: var(--wm-s3); padding: var(--wm-s3); border-radius: var(--wm-r-lg); background: var(--wm-surface); box-shadow: var(--wm-shadow-1), inset 0 0 0 1px var(--wm-edge); min-height: 72px; }
.pick .pthumb { width: 56px; height: 56px; flex: none; border-radius: var(--wm-r-md); background: var(--wm-surface2); overflow: hidden; display: grid; place-items: center; font-size: 26px; }
.pick .pthumb img { width: 100%; height: 100%; object-fit: cover; }
.pick button.now { box-shadow: inset 0 0 0 2px var(--wm-accent); }

/* ---------- toast ---------- */
.toast {
  position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(var(--bar-h, 0px) + var(--wm-s4) + env(safe-area-inset-bottom));
  z-index: 30; max-width: min(560px, calc(100vw - 32px)); display: flex; align-items: center; gap: var(--wm-s4);
  padding: var(--wm-s3) var(--wm-s4); border-radius: var(--wm-r-md); background: var(--wm-toast); color: var(--wm-on-toast);
  box-shadow: var(--wm-shadow-2); font-size: var(--wm-fs-sm); animation: up .25s var(--wm-ease);
}
.toast button { color: var(--wm-toast-action); font-weight: var(--wm-fw-bold); white-space: nowrap; min-height: 32px; }

@media (min-width: 900px) {
  .weekgrid { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); }
  .cook .stage.split { grid-template-columns: minmax(280px, 32%) 1fr; }
  .cook .stage.split .side { display: block; }
  .cook .main { padding: var(--wm-s6) 56px var(--wm-s5); }
  .sheet { bottom: auto; top: 50%; transform: translateY(-50%); border-radius: var(--wm-r-lg); max-height: 84vh; animation: fade .2s; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
`;var K1="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z";var q1="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z";var X1="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z";var Y1="M22 9H17.21L12.83 2.44C12.64 2.16 12.32 2 12 2S11.36 2.16 11.17 2.45L6.79 9H2C1.45 9 1 9.45 1 10C1 10.09 1 10.18 1.04 10.27L3.58 19.54C3.81 20.38 4.58 21 5.5 21H18.5C19.42 21 20.19 20.38 20.43 19.54L22.97 10.27L23 10C23 9.45 22.55 9 22 9M12 4.8L14.8 9H9.2L12 4.8M18.5 19L5.5 19L3.31 11H20.7L18.5 19M12 13C10.9 13 10 13.9 10 15S10.9 17 12 17 14 16.1 14 15 13.1 13 12 13Z";var J1="M5 3H6V1H8V3H16V1H18V3H19C20.11 3 21 3.89 21 5V19C21 20.1 20.11 21 19 21H5C3.9 21 3 20.11 3 19V5C3 3.89 3.9 3 5 3M5 19H19V9H5V19M5 7H19V5H5V7M17 11V13H7V11H17";var C2="M12 2C17.5 2 22 6.5 22 12S17.5 22 12 22 2 17.5 2 12 6.5 2 12 2M12 4C10.1 4 8.4 4.6 7.1 5.7L18.3 16.9C19.3 15.5 20 13.8 20 12C20 7.6 16.4 4 12 4M16.9 18.3L5.7 7.1C4.6 8.4 4 10.1 4 12C4 16.4 7.6 20 12 20C13.9 20 15.6 19.4 16.9 18.3Z";var H2="M10 0V4H8L12 8L16 4H14V0M1 2V4H3L6.6 11.6L5.2 14C5.1 14.3 5 14.6 5 15C5 16.1 5.9 17 7 17H19V15H7.4C7.3 15 7.2 14.9 7.2 14.8V14.7L8.1 13H15.5C16.2 13 16.9 12.6 17.2 12L21.1 5L19.4 4L15.5 11H8.5L4.3 2M7 18C5.9 18 5 18.9 5 20S5.9 22 7 22 9 21.1 9 20 8.1 18 7 18M17 18C15.9 18 15 18.9 15 20S15.9 22 17 22 19 21.1 19 20 18.1 18 17 18Z";var V2="M17,18A2,2 0 0,1 19,20A2,2 0 0,1 17,22C15.89,22 15,21.1 15,20C15,18.89 15.89,18 17,18M1,2H4.27L5.21,4H20A1,1 0 0,1 21,5C21,5.17 20.95,5.34 20.88,5.5L17.3,11.97C16.96,12.58 16.3,13 15.55,13H8.1L7.2,14.63L7.17,14.75A0.25,0.25 0 0,0 7.42,15H19V17H7C5.89,17 5,16.1 5,15C5,14.65 5.09,14.32 5.24,14.04L6.6,11.59L3,4H1V2M7,18A2,2 0 0,1 9,20A2,2 0 0,1 7,22C5.89,22 5,21.1 5,20C5,18.89 5.89,18 7,18M16,11L18.78,6H6.14L8.5,11H16Z";var L2="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z";var M2="M12.5,1.5C10.73,1.5 9.17,2.67 8.67,4.37C8.14,4.13 7.58,4 7,4A4,4 0 0,0 3,8C3,9.82 4.24,11.41 6,11.87V19H19V11.87C20.76,11.41 22,9.82 22,8A4,4 0 0,0 18,4C17.42,4 16.86,4.13 16.33,4.37C15.83,2.67 14.27,1.5 12.5,1.5M12,10.5H13V17.5H12V10.5M9,12.5H10V17.5H9V12.5M15,12.5H16V17.5H15V12.5M6,20V21A1,1 0 0,0 7,22H18A1,1 0 0,0 19,21V20H6Z";var r2="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z";var e2="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z";var t2="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";var i2="M15 18.5C12.5 18.5 10.32 17.08 9.24 15H15L16 13H8.58C8.53 12.67 8.5 12.34 8.5 12S8.53 11.33 8.58 11H15L16 9H9.24C10.32 6.92 12.5 5.5 15 5.5C16.61 5.5 18.09 6.09 19.23 7.07L21 5.3C19.41 3.87 17.3 3 15 3C11.08 3 7.76 5.5 6.5 9H3L2 11H6.06C6 11.33 6 11.66 6 12S6 12.67 6.06 13H3L2 15H6.5C7.76 18.5 11.08 21 15 21C17.31 21 19.41 20.13 21 18.7L19.22 16.93C18.09 17.91 16.62 18.5 15 18.5Z";var a2="M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19M8,9H16V19H8V9M15.5,4L14.5,3H9.5L8.5,4H5V6H19V4H15.5Z";var o2="M3,3A1,1 0 0,0 2,4V8L2,9.5C2,11.19 3.03,12.63 4.5,13.22V19.5A1.5,1.5 0 0,0 6,21A1.5,1.5 0 0,0 7.5,19.5V13.22C8.97,12.63 10,11.19 10,9.5V8L10,4A1,1 0 0,0 9,3A1,1 0 0,0 8,4V8A0.5,0.5 0 0,1 7.5,8.5A0.5,0.5 0 0,1 7,8V4A1,1 0 0,0 6,3A1,1 0 0,0 5,4V8A0.5,0.5 0 0,1 4.5,8.5A0.5,0.5 0 0,1 4,8V4A1,1 0 0,0 3,3M19.88,3C19.75,3 19.62,3.09 19.5,3.16L16,5.25V9H12V11H13L14,21H20L21,11H22V9H18V6.34L20.5,4.84C21,4.56 21.13,4 20.84,3.5C20.63,3.14 20.26,2.95 19.88,3Z";var A2="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z";var d2="M12,2A7,7 0 0,1 19,9C19,11.38 17.81,13.47 16,14.74V17A1,1 0 0,1 15,18H9A1,1 0 0,1 8,17V14.74C6.19,13.47 5,11.38 5,9A7,7 0 0,1 12,2M9,21V20H15V21A1,1 0 0,1 14,22H10A1,1 0 0,1 9,21M12,4A5,5 0 0,0 7,9C7,11.05 8.23,12.81 10,13.58V16H14V13.58C15.77,12.81 17,11.05 17,9A5,5 0 0,0 12,4Z";var p2="M10.59,13.41C11,13.8 11,14.44 10.59,14.83C10.2,15.22 9.56,15.22 9.17,14.83C7.22,12.88 7.22,9.71 9.17,7.76V7.76L12.71,4.22C14.66,2.27 17.83,2.27 19.78,4.22C21.73,6.17 21.73,9.34 19.78,11.29L18.29,12.78C18.3,11.96 18.17,11.14 17.89,10.36L18.36,9.88C19.54,8.71 19.54,6.81 18.36,5.64C17.19,4.46 15.29,4.46 14.12,5.64L10.59,9.17C9.41,10.34 9.41,12.24 10.59,13.41M13.41,9.17C13.8,8.78 14.44,8.78 14.83,9.17C16.78,11.12 16.78,14.29 14.83,16.24V16.24L11.29,19.78C9.34,21.73 6.17,21.73 4.22,19.78C2.27,17.83 2.27,14.66 4.22,12.71L5.71,11.22C5.7,12.04 5.83,12.86 6.11,13.65L5.64,14.12C4.46,15.29 4.46,17.19 5.64,18.36C6.81,19.54 8.71,19.54 9.88,18.36L13.41,14.83C14.59,13.66 14.59,11.76 13.41,10.59C13,10.2 13,9.56 13.41,9.17Z";var m2="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z";var n2="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z";var v2="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z";var l2="M19,13H5V11H19V13Z";var x2="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z";var Z2="M8 1.5C6.15 1.5 4.65 3 4.65 4.85C4.65 6.7 6.15 8.2 8 8.2H9.53C9.92 8.2 10.29 8.3 10.61 8.5H12.63C12.05 7.45 10.86 6.75 9.53 6.75H8C7 6.75 6.15 5.77 6.15 4.75C6.15 3.73 7 3 8 3V1.5M12.85 2C12.85 3 12 3.85 11 3.85V5.35C12.92 5.35 14.5 6.7 14.89 8.5H16.42C16.12 6.67 14.96 5.15 13.35 4.38C13.97 3.77 14.35 2.93 14.35 2H12.85M3 10V12H5V19C5 20.11 5.9 21 7 21H17C18.11 21 19 20.11 19 19V12H21V10H3M7 12H17V19H7V12Z";var s2="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z";var u2="M11,9H9V2H7V9H5V2H3V9C3,11.12 4.66,12.84 6.75,12.97V22H9.25V12.97C11.34,12.84 13,11.12 13,9V2H11V9M16,6V14H18.5V22H21V2C18.24,2 16,4.24 16,6Z";var S2="M19,15V3H23V15H19M15,3A2,2 0 0,1 17,5V15C17,15.55 16.78,16.05 16.41,16.41L9.83,23L8.77,21.94C8.5,21.67 8.33,21.3 8.33,20.88L8.36,20.57L9.31,16H3C1.89,16 1,15.1 1,14V12C1,11.74 1.05,11.5 1.14,11.27L4.16,4.22C4.46,3.5 5.17,3 6,3H15M15,5H5.97L3,12V14H11.78L10.65,19.32L15,14.97V5Z";var c2="M5,9V21H1V9H5M9,21A2,2 0 0,1 7,19V9C7,8.45 7.22,7.95 7.59,7.59L14.17,1L15.23,2.06C15.5,2.33 15.67,2.7 15.67,3.11L15.64,3.43L14.69,8H21C22.11,8 23,8.9 23,10V12C23,12.26 22.95,12.5 22.86,12.73L19.84,19.78C19.54,20.5 18.83,21 18,21H9M9,19H18.03L21,12V10H12.21L13.34,4.68L9,9.03V19Z";var h2="M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39M11,14H13V8H11M15,1H9V3H15V1Z";var O2="M18 18.5C18.83 18.5 19.5 17.83 19.5 17C19.5 16.17 18.83 15.5 18 15.5C17.17 15.5 16.5 16.17 16.5 17C16.5 17.83 17.17 18.5 18 18.5M19.5 9.5H17V12H21.46L19.5 9.5M6 18.5C6.83 18.5 7.5 17.83 7.5 17C7.5 16.17 6.83 15.5 6 15.5C5.17 15.5 4.5 16.17 4.5 17C4.5 17.83 5.17 18.5 6 18.5M20 8L23 12V17H21C21 18.66 19.66 20 18 20C16.34 20 15 18.66 15 17H9C9 18.66 7.66 20 6 20C4.34 20 3 18.66 3 17H1V6C1 4.89 1.89 4 3 4H17V8H20M3 6V15H3.76C4.31 14.39 5.11 14 6 14C6.89 14 7.69 14.39 8.24 15H15V6H3M10 7L13.5 10.5L10 14V11.5H5V9.5H10V7Z";var g2="M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22 10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81 20.1,16L22.47,15.22C21.08,11.03 17.15,8 12.5,8Z";var o={alert:K1,back:q1,next:X1,basket:Y1,week:J1,toCart:H2,cart:V2,check:L2,cook:M2,chevron:r2,close:t2,euro:i2,trash:a2,dish:o2,tip:d2,link:p2,loading:m2,search:n2,menu:v2,minus:l2,plus:x2,pot:Z2,refresh:s2,cutlery:u2,down:S2,up:c2,timer:h2,truck:O2,undo:g2,info:A2,none:C2,clock:e2},d=(V,C="",H="")=>_1`<svg class="i ${C}" viewBox="0 0 24 24" role=${H?"img":"presentation"} aria-hidden=${H?"false":"true"} aria-label=${H||""}><path d=${V}></path></svg>`;var a5={ma:"maandag",di:"dinsdag",wo:"woensdag",do:"donderdag",vr:"vrijdag",za:"zaterdag",zo:"zondag"},o5=["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"],A5=new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR"}),Z=V=>V==null||isNaN(V)?"":A5.format(Number(V)),L1=V=>V?V[0].toUpperCase()+V.slice(1):"",s=(V,C,H)=>`${V} ${V===1?C:H}`,u=V=>a5[V]||V,$=(V=new Date)=>`${V.getFullYear()}-${String(V.getMonth()+1).padStart(2,"0")}-${String(V.getDate()).padStart(2,"0")}`,f2=(V,C)=>{let[H,L,M]=V.split("-").map(Number);return $(new Date(H,L-1,M+C))},w2=V=>Number(/^\d{4}-\d{2}-(\d{2})/.exec(V||"")?.[1])||"";function u1(V,C){let H=V?new Date(V):null;return!H||isNaN(H)?C||"":`${["zo","ma","di","wo","do","vr","za"][H.getDay()]} ${H.getDate()} ${o5[H.getMonth()]} ${String(H.getHours()).padStart(2,"0")}:${String(H.getMinutes()).padStart(2,"0")}`}var S1=V=>`${Math.floor(V/60)}:${String(Math.max(0,V)%60).padStart(2,"0")}`,k2=V=>`https://storefront-prod.nl.picnicinternational.com/static/images/${encodeURIComponent(V)}/small.png`,c=V=>V?.image_url&&/^https:\/\//.test(V.image_url)?V.image_url.replace(/(\/static\/images\/recipes\/[^/]+\/)(?:small|medium|large|extra-large)\.png$/,"$1600x600.png"):V?.image_id?`https://storefront-prod.nl.picnicinternational.com/static/images/${encodeURIComponent(V.image_id)}/large.png`:null,b2=V=>{if(V?.timer_sec)return Number(V.timer_sec);let C=String(V?.text||"").match(/(\d+)\s*(?:-|–|tot)?\s*(\d+)?\s*(min|minuten|minuut)\b/i);return C?Number(C[2]||C[1])*60:null};var y2={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},B2=V=>(...C)=>({_$litDirective$:V,values:C}),M1=class{constructor(C){}get _$AU(){return this._$AM._$AU}_$AT(C,H,L){this._$Ct=C,this._$AM=H,this._$Ci=L}_$AS(C,H){return this.update(C,H)}update(C,H){return this.render(...H)}};var{I:d5}=U1,P2=V=>V;var T2=()=>document.createComment(""),D=(V,C,H)=>{let L=V._$AA.parentNode,M=C===void 0?V._$AB:C._$AA;if(H===void 0){let e=L.insertBefore(T2(),M),t=L.insertBefore(T2(),M);H=new d5(e,t,V,V.options)}else{let e=H._$AB.nextSibling,t=H._$AM,A=t!==V;if(A){let i;H._$AQ?.(V),H._$AM=V,H._$AP!==void 0&&(i=V._$AU)!==t._$AU&&H._$AP(i)}if(e!==M||A){let i=H._$AA;for(;i!==e;){let v=P2(i).nextSibling;P2(L).insertBefore(i,M),i=v}}}return H},k=(V,C,H=V)=>(V._$AI(C,H),V),p5={},F2=(V,C=p5)=>V._$AH=C,R2=V=>V._$AH,r1=V=>{V._$AR(),V._$AA.remove()};var $2=(V,C,H)=>{let L=new Map;for(let M=C;M<=H;M++)L.set(V[M],M);return L},E=B2(class extends M1{constructor(V){if(super(V),V.type!==y2.CHILD)throw Error("repeat() can only be used in text expressions")}dt(V,C,H){let L;H===void 0?H=C:C!==void 0&&(L=C);let M=[],e=[],t=0;for(let A of V)M[t]=L?L(A,t):t,e[t]=H(A,t),t++;return{values:e,keys:M}}render(V,C,H){return this.dt(V,C,H).values}update(V,[C,H,L]){let M=R2(V),{values:e,keys:t}=this.dt(C,H,L);if(!Array.isArray(M))return this.ut=t,e;let A=this.ut??=[],i=[],v,l,m=0,p=M.length-1,n=0,x=e.length-1;for(;m<=p&&n<=x;)if(M[m]===null)m++;else if(M[p]===null)p--;else if(A[m]===t[n])i[n]=k(M[m],e[n]),m++,n++;else if(A[p]===t[x])i[x]=k(M[p],e[x]),p--,x--;else if(A[m]===t[x])i[x]=k(M[m],e[x]),D(V,i[x+1],M[m]),m++,x--;else if(A[p]===t[n])i[n]=k(M[p],e[n]),D(V,M[m],M[p]),p--,n++;else if(v===void 0&&(v=$2(t,n,x),l=$2(A,m,p)),v.has(A[m]))if(v.has(A[p])){let S=l.get(t[n]),N=S!==void 0?M[S]:null;if(N===null){let g1=D(V,M[m]);k(g1,e[n]),i[n]=g1}else i[n]=k(N,e[n]),D(V,M[m],N),M[S]=null;n++}else r1(M[p]),p--;else r1(M[m]),m++;for(;n<=x;){let S=D(V,i[x+1]);k(S,e[n]),i[n++]=S}for(;m<=p;){let S=M[m++];S!==null&&r1(S)}return this.ut=t,F2(V,i),g}});function e1(V){return r`<div class="thumb">${V.image_id?r`<img loading="lazy" src=${k2(V.image_id)} alt="" @error=${C=>C.target.remove()}>`:d(o.basket)}</div>`}function F(V,C,H){let L=V.sugg[C];return r`<div class="field" role="search">
    ${d(o.search)}
    <input class="input" id=${C} placeholder=${H} enterkeyhint="search" autocomplete="off" aria-label=${H}
      aria-controls="${C}-sugg" aria-expanded=${!!L}
      @input=${M=>V.onSearch(C,M.target.value)}
      @keydown=${M=>{M.key==="Enter"&&V.searchEnter(C),M.key==="Escape"&&V.clearSearch(C)}}>
  </div>
  ${L?r`<div class="sugg" id="${C}-sugg" role="listbox">
    ${L.loading&&!L.items.length?r`<div class="hint">Zoeken…</div>`:a}
    ${!L.loading&&!L.items.length?r`<div class="hint">${C==="link"?"Niets gevonden. Probeer een ander woord.":r`Niets gevonden bij Picnic. Druk op Enter om “${L.q}” als losse tekst toe te voegen.`}</div>`:a}
    ${L.items.map(M=>r`<button role="option" @click=${()=>V.pick(C,M)}>
      ${e1(M)}<span class="grow"><span style="display:block;font-weight:500">${M.name}</span>
      <span class="muted xs">${[M.unit,M.unit_price!=null?Z(M.unit_price):"",M.bron==="bekend"?"eerder gekocht":""].filter(Boolean).join(" \xB7 ")}</span></span>
      <span class="plus">${d(C==="link"?o.link:o.plus)}</span></button>`)}
  </div>`:a}`}function c1(V){let C=null,H=null,L=0,M=null;return{start:e=>{C=e.touches[0].clientX,H=e.touches[0].clientY,L=0,M=null},move:e=>{if(C==null)return;let t=e.touches[0].clientX-C,A=e.touches[0].clientY-H;if(M==null&&(Math.abs(t)>8||Math.abs(A)>8)&&(M=Math.abs(t)>Math.abs(A)?"x":"y"),M!=="x")return;L=Math.min(0,t);let i=e.currentTarget;i.classList.add("dragging"),i.parentElement.classList.add("drag"),i.style.transform=`translateX(${L}px)`},end:e=>{let t=e.currentTarget;t.classList.remove("dragging"),M==="x"&&L<-90?(t.style.transform="translateX(-110%)",setTimeout(()=>{V(),t.style.transform="",t.parentElement?.classList.remove("drag")},180)):(t.style.transform="",setTimeout(()=>t.parentElement?.classList.remove("drag"),200)),C=null}}}var m5={kai:"K",michelle:"M",ruben:"R"};function D2(V){if(!V.plan)return r`<div class="empty">${d(o.week)}<p>Nog geen weekvoorstel. Vrijdagochtend staat het klaar.</p></div>`;let H=V.userName.includes("michelle"),L=[O5(V),g5(V,H)],M=r`
    ${n5(V)}
    ${v5(V)}
    ${H?L:a}
    ${V.days?x5(V):h5(V)}`,e=r`${l5(V)}${H?a:L}`;return r`<div class="weekgrid"><div>${M}</div><div>${e}</div></div>`}function E2(V,C=0){let H=f2($(),C);return(V.days||[]).find(L=>L.date===H)||null}function N2(V,C=""){let H=c(V);return H?r`<img class=${C} loading="lazy" referrerpolicy="no-referrer" src=${H} alt="" @error=${L=>L.target.remove()}>`:r`<span aria-hidden="true">${V.emoji||"\u{1F37D}\uFE0F"}</span>`}function n5(V){let C=E2(V),H=C?.choice&&C.choice!=="none"?V.recipe(C.choice):null;if(!H)return a;let L=c(H);return r`<section class="card tonight section" aria-label="Vanavond">
    ${L?r`<div class="photo">${N2(H)}</div>`:a}
    <div class="body">
      <div class="row" style="align-items:flex-start">${L?a:r`<div class="oemoji" style="background:var(--wm-surface2)" aria-hidden="true">${H.emoji||"\u{1F37D}\uFE0F"}</div>`}
        <div class="grow"><div class="eyebrow">Vanavond</div><h3>${H.title}</h3>
        <div class="ometa">${H.minutes?r`<span>${H.minutes} min</span>`:a}${(H.steps||[]).length?r`<span>${s(H.steps.length,"stap","stappen")}</span>`:a}</div></div></div>
      <button class="btn" @click=${()=>V.openCook(H.id)}>${d(o.cook)}Start koken</button>
    </div></section>`}function v5(V){let C=E2(V,-1),H=C?.choice&&C.choice!=="none"?V.recipe(C.choice):null;return!H||H.rating||!V.canEdit?a:r`<section class="card section stack" aria-label="Beoordeel gisteren">
    <div><div class="eyebrow">Gisteren</div><div style="font-weight:500">Hoe was ${H.title.toLowerCase()}?</div></div>
    <div class="rate">
      <button aria-pressed="false" @click=${()=>V.rate(H.id,1)}>${d(o.up)}Lekker</button>
      <button aria-pressed="false" @click=${()=>V.rate(H.id,-1)}>${d(o.down)}Niet weer</button>
    </div></section>`}function l5(V){let C=V.plan,H=V.summary,L=V.status(),M=(C.results||[]).filter(i=>!i.ok),e=C.status==="approved"?C.to_remove||[]:[],t=H.days_open||[],A=[s(H.items_count||0,"product","producten")];return H.savings>0&&A.push(r`<span class="save">${Z(H.savings)} voordeel</span>`),H.unknown_prices&&A.push(`${H.unknown_prices} zonder prijs`),r`<section class="card status stack" aria-label="Status">
    <div class="row"><span class="tag ${L.tag}">${C.status==="approved"?d(o.check,"sm"):a}${L.label}</span>
      <span class="muted xs grow">${V.deliveryLine()}</span></div>
    <div><div class="total">${Z(H.items_total)}${H.unknown_prices?r`<span class="muted" style="font-size:var(--wm-fs-md);font-weight:400"> + ?</span>`:a}</div>
      <div class="facts">${A.map(i=>r`<span>${i}</span>`)}</div></div>
    ${C.advice?r`<div class="note">${d(o.tip,"sm")}<span>${C.advice}</span></div>`:a}
    ${C.status==="proposed"&&t.length&&V.canEdit?r`<div class="note attention">${d(o.alert,"sm")}<span>${s(t.length,"dag","dagen")} nog niet gekozen (${t.map(u).join(", ")}). Zonder keuze kook je die dag niet.</span></div>`:a}
    ${M.length?r`<div class="note danger">${d(o.alert,"sm")}<div>${s(M.length,"product","producten")} niet in je mandje gezet:
        <ul>${M.map(i=>r`<li>${i.name}</li>`)}</ul></div></div>`:a}
    ${e.length?r`<div class="note attention">${d(o.info,"sm")}<div>Haal zelf weg in de Picnic-app:
        <ul>${e.map(i=>r`<li>${i.qty}× ${i.name}</li>`)}</ul></div></div>`:a}
    ${C.status==="approved"&&V.canEdit?r`<div class="actions">
          ${M.length?r`<button class="btn" @click=${()=>V.approve()}>${d(o.refresh)}Opnieuw proberen</button>`:a}
          <button class="btn plain" @click=${()=>V.reopen()}>Aanpassen</button></div>`:C.status==="proposed"?r`<div class="actions"><button class="btn plain" @click=${()=>V.setUi({tab:"list"})}>${d(o.cart)}Bekijk lijst</button></div>`:a}
  </section>`}function x5(V){let C=V.days,H=C.filter(M=>M.choice).length,L=C.reduce((M,e)=>M+(e.choice&&e.choice!=="none"?Number(V.recipe(e.choice)?.price||0):0),0);return r`<section class="section" aria-label="Deze week">
    <div class="sh"><h2>Deze week</h2><span class="meta">${H}/${C.length} gekozen${L?` \xB7 ca. ${Z(L)}`:""}</span></div>
    <div class="prog" aria-hidden="true">${C.map(M=>r`<i class=${M.choice==="none"?"none":M.choice?"on":""}></i>`)}</div>
    <div class="days">${E(C,M=>M.day,M=>Z5(V,M))}</div>
  </section>`}function Z5(V,C){let H=$(),L=V.ui.openDay===C.day,M=C.choice&&C.choice!=="none"?V.recipe(C.choice):null,e=["day",L?"open":"",C.date===H?"today":"",C.date&&C.date<H?"past":""].join(" "),t=M?r`<div class="dmain">${c(M)?r`<img class="dthumb" loading="lazy" referrerpolicy="no-referrer" src=${c(M)} alt="" @error=${i=>i.target.remove()}>`:a}<span class="tt">${M.title}</span></div>`:C.choice==="none"?r`<div class="dmain none"><span class="tt">Niets koken</span></div>`:r`<div class="dmain open"><span class="tt">Nog kiezen</span></div>`;return r`<div class=${e}>
    <button class="dhead" aria-expanded=${L} @click=${()=>{V.setUi({openDay:L?null:C.day,jump:!L})}}>
      <div class="dtile" aria-hidden="true"><small>${C.day}</small><b>${w2(C.date)}</b></div>
      <div class="dmid"><span class="vh">${L1(u(C.day))}</span>${C.slot?r`<div class="dslot">${C.slot}</div>`:a}${t}${C.note?r`<div class="dnote">${C.note}</div>`:a}</div>
      <div class="dright">${M?.price!=null?Z(M.price):a}<span class="chev">${d(o.chevron)}</span></div>
    </button>
    ${L?s5(V,C):a}
  </div>`}function s5(V,C){let H=[...(C.options||[]).map(e=>V.recipe(e)).filter(Boolean).map(e=>({key:e.id,t:u5(V,C,e)})),...V.locked?[]:[{key:"_more",t:S5(V,C)}],{key:"_none",t:c5(V,C)}],L=C.choice==="none"?H.length-1:Math.max(0,H.findIndex(e=>e.key===C.choice)),M=e=>h1(e.target);return r`<div class="dbody">
    <div class="strip" data-day=${C.day} data-jump=${V.ui.jump?L:""} @scroll=${M}>${E(H,e=>e.key,e=>e.t)}</div>
    <div class="sdots" aria-hidden="true">${H.map((e,t)=>r`<i class=${t===L?"on":""}></i>`)}</div>
  </div>`}function h1(V){let C=V.querySelectorAll(".ocard");if(!C.length)return;let H=C.length>1?C[1].offsetLeft-C[0].offsetLeft:V.clientWidth,L=Math.max(0,Math.min(C.length-1,Math.round(V.scrollLeft/Math.max(1,H))));V.nextElementSibling?.querySelectorAll("i").forEach((M,e)=>{M.classList.toggle("on",e===L),M.classList.toggle("ch",e!==L&&C[e].classList.contains("on"))})}function O1(V,C,H=4){let L=(V.plan?.items||[]).filter(t=>t.recipe_id===C.id&&t.source==="recipe"),M=L.length?L.map(t=>r`<li>${t.qty>1?r`<span class="q">${t.qty}×</span>`:a}<span class="n">${t.name}</span>${t.promo?.label?r`<span class="tag deal">${t.promo.label}</span>`:a}</li>`):(C.ingredients||[]).map(t=>r`<li><span class="n">${typeof t=="string"?t:t.text||t.name}</span></li>`),e=M.length-H;return e>1?[...M.slice(0,H),r`<li class="more">+ ${e} meer</li>`]:M}function u5(V,C,H){let L=C.choice===H.id,M=!L&&(V.days||[]).find(i=>i.choice===H.id),e=[H.minutes?`${H.minutes} min`:"",H.price!=null?Z(H.price):"",M?`nu op ${u(M.day)}`:""].filter(Boolean),t=c(H),A=(H.steps||[]).length||H.tips?.michelle||H.tips?.kai;return r`<article class="ocard ${L?"on":""}" aria-label=${H.title}>
    ${t?r`<div class="photo"><img loading="lazy" referrerpolicy="no-referrer" src=${t} alt="" @error=${i=>i.target.parentElement.remove()}></div>`:a}
    ${L?r`<span class="chosen">${d(o.check,"sm")}Gekozen</span>`:a}
    <div class="in">
      <div class="ohead">${t?a:r`<div class="oemoji" aria-hidden="true">${H.emoji||"\u{1F37D}\uFE0F"}</div>`}
        <div><div class="otitle">${H.title}</div><div class="ometa">${e.map(i=>r`<span>${i}</span>`)}</div></div></div>
      ${H.why?r`<div><span class="tag deal">${H.why}</span></div>`:a}
      <ul class="ings">${O1(V,H,4)}</ul>
      <div class="ofoot">
        ${A?r`<button class="link" @click=${()=>V.setUi({sheet:{type:"prep",day:C.day,rid:H.id}})}>Bereiding bekijken${d(o.chevron,"sm")}</button>`:a}
        ${V.locked?a:r`<button class="btn sm" @click=${()=>V.choose(C.day,H.id)}>${L?r`${d(o.check,"sm")}Gekozen voor ${u(C.day)}`:"Kies dit"}</button>`}
      </div>
    </div></article>`}function S5(V,C){let H=V.pending(C);if(H==="busy")return r`<article class="ocard more"><div class="in">
      <div class="ohead"><div class="oemoji">${d(o.loading,"lg spin")}</div>
        <div><div class="otitle">Claude zoekt nieuwe gerechten…</div>
        <div class="ometa"><span>Over 5–10 minuten staan ze hier${C.pending?.wish?` \xB7 \u201C${C.pending.wish}\u201D`:""}</span></div></div></div>
      <div class="muted sm">Je kunt de app gewoon sluiten.</div></div></article>`;let L=V.data?.claude_ready;return r`<article class="ocard more"><div class="in">
    <div class="ohead"><div class="oemoji">${d(o.refresh,"lg")}</div>
      <div><div class="otitle">Andere gerechten</div><div class="ometa"><span>Claude bedenkt 2–3 nieuwe opties voor ${u(C.day)}</span></div></div></div>
    ${H==="expired"?r`<div class="note attention">${d(o.alert,"sm")}<span>Er kwamen geen nieuwe gerechten terug. Probeer het opnieuw.</span></div>`:a}
    <input class="input plain" id="wish-${C.day}" placeholder="Wens? Bijv. iets met vis" enterkeyhint="send" autocomplete="off" maxlength="200"
      @keydown=${M=>M.key==="Enter"&&V.requestRecipes(C.day)}>
    ${L?a:r`<div class="muted xs">Eerst eenmalig instellen: Instellingen → Apparaten &amp; diensten → Weekmenu → Configureren.</div>`}
    <div class="ofoot"><button class="btn sm tonal" ?disabled=${!L} @click=${()=>V.requestRecipes(C.day)}>Vraag Claude</button></div>
  </div></article>`}function c5(V,C){let H=C.choice==="none";return r`<article class="ocard ${H?"on":""}" aria-label="Niets koken"><div class="in">
    <div class="ohead"><div class="oemoji">${d(o.none,"lg")}</div>
      <div><div class="otitle">Niets koken</div><div class="ometa"><span>Uit eten, restjes of bij opa en oma</span></div></div></div>
    <div class="ofoot">${V.locked?a:r`<button class="btn sm" @click=${()=>V.choose(C.day,"none")}>${H?r`${d(o.check,"sm")}Gekozen voor ${u(C.day)}`:"Kies dit"}</button>`}</div>
  </div></article>`}function h5(V){let C=V.plan.recipes||[];return r`<section class="section"><div class="sh"><h2>Recepten deze week</h2></div>
    ${C.length?r`<div class="pick">${C.map(H=>r`<button @click=${()=>V.openCook(H.id)}>
        <span class="pthumb">${N2(H)}</span><span class="grow"><b style="font-weight:500">${H.title}</b><br><span class="muted sm">${H.minutes?`${H.minutes} min`:""}</span></span>${d(o.chevron)}</button>`)}</div>`:r`<div class="card muted">Geen recepten deze week.</div>`}</section>`}function O5(V){let C=V.plan?.michelle;return!C||!(C.options||[]).length?a:r`<section class="section"><div class="sh"><h2>Michelle ${C.day_label||""}</h2></div>
    <div class="card"><div>${C.question||"Late dienst \u2014 wat neem je mee?"}</div>
      <div class="opts">${C.options.map(H=>r`
        <button class="opt" aria-pressed=${C.choice===H.id} ?disabled=${V.locked}
          @click=${()=>V.ws({type:"weekmenu/michelle_choose",option_id:C.choice===H.id?null:H.id})}>
          <span class="e" aria-hidden="true">${H.emoji||"\u{1F957}"}</span><span class="n">${H.title}</span>
          <span class="muted sm num">${H.price?Z(H.price):""}</span>${C.choice===H.id?d(o.check):a}</button>`)}
      </div>
      ${C.choice?a:r`<div class="muted sm" style="margin-top:8px">Michelle kiest zelf</div>`}
    </div></section>`}function g5(V,C){let H=V.plan?.questions||[];return H.length?(C&&(H=[...H].sort((L,M)=>(M.who==="michelle")-(L.who==="michelle"))),r`<section class="section"><div class="sh"><h2>Snacks deze week</h2></div><div class="card">${H.map(L=>r`
    <div class="q">
      <div class="qt"><span class="who" aria-hidden="true">${m5[L.who]||"?"}</span><span class="grow">${L.title}${L.question?r` <span class="sub">${L.question}</span>`:a}</span></div>
      <div class="chips">${(L.options||[]).map(M=>r`
        <button class="chip" aria-pressed=${L.choice===M.id} ?disabled=${V.locked}
          @click=${()=>V.ws({type:"weekmenu/answer",question_id:L.id,option_id:L.choice===M.id?null:M.id})}>
          ${M.emoji?r`<span aria-hidden="true">${M.emoji}</span>`:a}${M.title}${M.new&&!M.learned?r`<span class="new">nieuw</span>`:a}</button>`)}
        ${L.choice==="custom"?r`<button class="chip" aria-pressed="true" ?disabled=${V.locked}
          @click=${()=>V.ws({type:"weekmenu/answer",question_id:L.id,option_id:null})}>${L.custom}</button>`:a}
      </div>
      ${V.locked?a:r`<div style="margin-top:12px">${F(V,`own-${L.id}`,"Iets anders zoeken")}</div>`}
    </div>`)}</div></section>`):a}var _2=[["recipe","Voor je recepten"],["michelle","Voor Michelle"],["snack","Snacks"],["standard","Vaste boodschappen"],["promo","Aanbiedingen"],["advice","Misschien bijna op"],["extra","Zelf toegevoegd"]];function W2(V){let C=r`<div class="seg" role="tablist">
    <button role="tab" aria-selected=${V.ui.seg==="week"} @click=${()=>V.setUi({seg:"week"})}>Deze week</button>
    <button role="tab" aria-selected=${V.ui.seg==="std"} @click=${()=>V.setUi({seg:"std"})}>Elke week</button></div>`;if(V.ui.seg==="std")return r`${C}${w5(V)}`;if(!V.plan)return r`${C}<div class="empty">${d(o.cart)}<p>Nog geen lijst deze week.</p></div>`;let L=V.locked,M=V.active(),e=new Set(_2.map(([i])=>i)),t=[..._2,["_other","Overig"]].map(([i,v])=>{let l=M.filter(p=>i==="_other"?!e.has(p.source||"extra"):(p.source||"extra")===i);if(!l.length)return a;let m=l.reduce((p,n)=>p+(n.unit_price||0)*n.qty,0);return r`<div class="gh"><span>${v}</span><span>${Z(m)}</span></div>
      <div class="group">${E(l,p=>p.key,p=>f5(V,p,L))}</div>`}),A=V.items().filter(i=>i.removed||i.qty===0);return r`${C}
    ${L?r`<div class="note" style="margin-bottom:8px">${d(o.info,"sm")}<span class="grow">${V.canEdit?"Deze lijst staat in je Picnic-mandje.":"Je kunt deze lijst alleen bekijken."}</span>
          ${V.canEdit&&V.plan.status==="approved"?r`<button class="link" @click=${()=>V.reopen()}>Aanpassen</button>`:a}</div>`:r`<div class="tools">${F(V,"addweek","Product toevoegen")}
          <button class="btn plain sm" ?disabled=${V.ui.priceLoading} @click=${()=>V.priceCheck()}>
            ${V.ui.priceLoading?r`${d(o.loading,"spin")}Picnic doorzoeken…`:r`${d(o.euro)}Goedkoper alternatief zoeken`}</button></div>`}
    ${V.summary.unlinked&&!L?r`<div class="note attention" style="margin-top:8px">${d(o.link,"sm")}<span>${s(V.summary.unlinked,"product is","producten zijn")} niet gekoppeld aan Picnic. Tik op <b>Koppel</b>, anders kiest Picnic zelf een product op naam.</span></div>`:a}
    ${t}
    ${A.length&&!L?r`<details class="removed"><summary>${d(o.trash,"sm")}Weggehaald (${A.length})</summary>
      <div class="group">${A.map(i=>r`<div class="r"><span>${i.name}</span><button class="link" @click=${()=>V.restore(i)}>Terugzetten</button></div>`)}</div></details>`:a}`}function f5(V,C,H){let L=[];C.picnic_id||L.push(H?r`<span class="tag attention">Niet gekoppeld</span>`:r`<button class="tag attention" @click=${()=>V.setUi({sheet:{type:"link",key:C.key,name:C.name}})}>${d(o.link,"sm")}Koppel</button>`),C.promo?.label&&L.push(r`<span class="tag deal">${C.promo.label}</span>`),C.recipe&&L.push(r`<span>${C.recipe}</span>`),C.note&&L.push(r`<span>${C.note}</span>`),C.unit&&L.push(r`<span>${C.unit}</span>`);let M=H?null:c1(()=>V.remove(C));return r`<div class="rowwrap"><div class="behind" aria-hidden="true">${d(o.trash)}Weg</div>
    <div class="item" @touchstart=${M?.start} @touchmove=${M?.move} @touchend=${M?.end}>
      ${e1(C)}
      <div class="info"><div class="n">${C.name}</div>${L.length?r`<div class="s">${L}</div>`:a}</div>
      ${H?r`<span class="muted num">${C.qty}×</span>`:r`<div class="stepper">
        <button aria-label="Minder ${C.name}" @click=${()=>V.setQty(C,C.qty-1)}>${d(C.qty===1?o.trash:o.minus)}</button>
        <span aria-live="polite">${C.qty}</span>
        <button aria-label="Meer ${C.name}" @click=${()=>V.setQty(C,C.qty+1)}>${d(o.plus)}</button></div>`}
      <div class="price ${C.unit_price==null?"unknown":""}">${C.unit_price!=null?Z(C.unit_price*C.qty):"?"}</div>
    </div></div>`}function w5(V){let C=V.data.standard_items||[];return r`<div class="muted sm" style="margin:0 4px 12px">Dit komt elke week standaard op je lijst.</div>
    ${V.canEdit?r`<div class="tools">${F(V,"addstd","Vast product toevoegen")}</div>`:a}
    ${C.length?r`<div class="group" style="margin-top:12px">${E(C,H=>H.key,H=>{let L=V.canEdit?c1(()=>V.stdQty(H,0)):null;return r`<div class="rowwrap"><div class="behind" aria-hidden="true">${d(o.trash)}Weg</div>
        <div class="item" @touchstart=${L?.start} @touchmove=${L?.move} @touchend=${L?.end}>
          ${e1(H)}<div class="info"><div class="n">${H.name}</div>${H.unit?r`<div class="s"><span>${H.unit}</span></div>`:a}</div>
          ${V.canEdit?r`<div class="stepper">
            <button aria-label="Minder ${H.name}" @click=${()=>V.stdQty(H,H.qty-1)}>${d(H.qty===1?o.trash:o.minus)}</button>
            <span>${H.qty}</span>
            <button aria-label="Meer ${H.name}" @click=${()=>V.stdQty(H,H.qty+1)}>${d(o.plus)}</button></div>`:r`<span class="muted num">${H.qty}×</span>`}
        </div></div>`})}</div>`:r`<div class="empty">${d(o.cart)}<p>Nog geen vaste producten.</p></div>`}`}function k5(V){return V.days?V.days.filter(C=>C.choice&&C.choice!=="none").map(C=>({r:V.recipe(C.choice),day:C.day,date:C.date})).filter(C=>C.r):(V.plan?.recipes||[]).map(C=>({r:C,day:null,date:null}))}function I2(V){let C=k5(V);if(!C.length)return r`<div class="empty">${d(o.cook)}<p>${V.days?"Nog geen gerechten gekozen. Kies per dag in het tabblad Week.":"Nog geen recepten deze week."}</p>
      ${V.days?r`<button class="btn tonal" @click=${()=>V.setUi({tab:"week"})}>Naar Week</button>`:a}</div>`;let H=$();return r`${b5(V)}<div class="sh" style="margin-top:4px"><h2>Wat gaan we koken?</h2></div>
    <div class="pick">${C.map(({r:L,day:M,date:e})=>{let t=c(L),A=e===H;return r`<button class=${A?"now":""} @click=${()=>V.openCook(L.id)}>
        <span class="pthumb">${t?r`<img loading="lazy" referrerpolicy="no-referrer" src=${t} alt="" @error=${i=>i.target.remove()}>`:r`<span aria-hidden="true">${L.emoji||"\u{1F37D}\uFE0F"}</span>`}</span>
        <span class="grow">${M?r`<span class="muted xs">${A?"Vanavond":L1(u(M))}</span><br>`:a}<span style="font-weight:500">${L.title}</span><br>
          <span class="muted sm">${[L.minutes?`${L.minutes} min`:"",s((L.steps||[]).length,"stap","stappen")].filter(Boolean).join(" \xB7 ")}</span></span>
        ${L.rating?d(L.rating>0?o.up:o.down,"",L.rating>0?"Lekker gevonden":"Niet weer"):a}${d(o.chevron)}</button>`})}</div>`}function b5(V){let C=V.data?.timers||[];return C.length?r`<div class="timers" style="margin-bottom:16px" role="status">${C.map(H=>U2(V,H))}</div>`:a}function U2(V,C){let H=Math.max(0,Math.round((Date.parse(C.end)-V.now)/1e3)),L=C.done||H===0;return r`<button class="tchip ${L?"done":""}" aria-label="${C.label}: ${L?"klaar":S1(H)}. Tik om te stoppen" @click=${()=>V.stopTimer(C.id)}>
    ${d(o.timer,"sm")}${C.label} ${L?"klaar!":S1(H)}${d(o.close,"sm")}</button>`}function z2(V){let C=V.ui.cook,H=V.recipe(C.rid);if(!H)return a;let L=H.steps||[],M=L.length,e=C.step,t=H.ingredients||[],A=p=>V.setUi({cook:{...C,checked:{...C.checked,[p]:!C.checked[p]}}}),i=r`<ul class="ing">${t.map((p,n)=>r`<li><button role="checkbox" aria-checked=${!!C.checked[n]} @click=${()=>A(n)}>
      <span class="box">${C.checked[n]?d(o.check,"sm"):a}</span>${typeof p=="string"?p:p.text||p.name}</button></li>`)}</ul>`,v,l=null;if(e<0)v=r`<div class="stepno">Klaarzetten</div>
      <div style="font-size:var(--wm-fs-lg);font-weight:500">${H.servings||"2 volw. + Kai"}${H.minutes?` \xB7 ${H.minutes} min`:""}</div>
      ${i}
      ${(H.pantry||[]).length?r`<div class="muted">Uit de kast: ${H.pantry.join(", ")}</div>`:a}`;else if(e>=M)v=r`<div class="stepno">Klaar</div><div class="txt">Eet smakelijk!</div>
      <div class="muted">Hoe was het?</div>
      <div class="rate">
        <button aria-pressed=${H.rating>0} @click=${()=>V.rate(H.id,1)}>${d(o.up)}Lekker</button>
        <button aria-pressed=${H.rating<0} @click=${()=>V.rate(H.id,-1)}>${d(o.down)}Niet weer</button></div>`;else{let p=L[e],n=b2(p),x=[];e===0&&H.tips?.kai&&x.push(r`<b>Kai</b> · ${H.tips.kai}`),e===M-1&&H.tips?.michelle&&x.push(r`<b>Michelle</b> · ${H.tips.michelle}`),p.tip&&x.push(p.tip);let S=`${H.title.split(" ").slice(0,2).join(" ")} \xB7 stap ${e+1}`;v=r`<div class="stepno">Stap ${e+1} van ${M}</div>
      <div class="txt">${p.text}</div>
      ${x.map(N=>r`<div class="note">${d(o.tip,"sm")}<span>${N}</span></div>`)}
      ${n?r`<div><button class="btn tonal" @click=${()=>V.startTimer(n,S)}>${d(o.timer)}Timer ${Math.round(n/60)} min</button></div>`:a}`,l=r`<div class="stepno" style="margin-bottom:8px">Ingrediënten</div>${i}`}let m=V.data?.timers||[];return r`<div class="cook" role="dialog" aria-modal="true" aria-label="Koken: ${H.title}">
    <div class="top"><span class="t">${H.title}</span><button class="iconbtn" aria-label="Sluiten" @click=${()=>V.closeCook()}>${d(o.close)}</button></div>
    <div class="stage ${l?"split":""}"
      @touchstart=${p=>{V._cx=p.touches[0].clientX,V._cy=p.touches[0].clientY}}
      @touchend=${p=>{if(V._cx==null)return;let n=p.changedTouches[0].clientX-V._cx,x=p.changedTouches[0].clientY-V._cy;V._cx=null,Math.abs(n)>50&&Math.abs(n)>Math.abs(x)*1.3&&V.cookStep(n<0?1:-1)}}>
      ${l?r`<div class="side">${l}</div>`:a}
      <div class="main">${v}${m.length?r`<div class="timers" role="status">${m.map(p=>U2(V,p))}</div>`:a}</div>
      ${e>=0&&e<M?r`<button class="tap l" aria-label="Vorige stap" @click=${()=>V.cookStep(-1)}></button><button class="tap r" aria-label="Volgende stap" @click=${()=>V.cookStep(1)}></button>`:a}
    </div>
    <div class="bottom">
      <button class="nav" aria-label="Vorige" ?disabled=${e<0} @click=${()=>V.cookStep(-1)}>${d(o.back)}</button>
      <div class="dots" aria-hidden="true">${[-1,...L.map((p,n)=>n)].map(p=>r`<i class=${p===e?"on":""}></i>`)}</div>
      ${e>=M?r`<button class="nav p" aria-label="Klaar" @click=${()=>V.closeCook()}>${d(o.check)}</button>`:r`<button class="nav p" aria-label="Volgende" @click=${()=>V.cookStep(1)}>${d(o.next)}</button>`}
    </div></div>`}function G2(V){let C=V.ui.sheet;if(!C)return a;let H=()=>V.setUi({sheet:null}),L=C.type==="prep"?y5(V,C):C.type==="price"?B5(V,C):C.type==="approve"?P5(V):C.type==="link"?T5(V,C):a;return L===a?a:r`<div class="scrim" @click=${H}></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1"><div class="grab"></div>${L}</div>`}function y5(V,C){let H=(V.days||[]).find(A=>A.day===C.day),L=V.recipe(C.rid);if(!H||!L)return a;let M=H.choice===L.id,e=[L.tips?.michelle?r`<b>Michelle</b> · ${L.tips.michelle}`:null,L.tips?.kai?r`<b>Kai</b> · ${L.tips.kai}`:null].filter(Boolean),t=[L.minutes?`${L.minutes} min`:"",L.servings||"",L.price!=null?Z(L.price):""].filter(Boolean);return r`
    ${c(L)?r`<div class="photo"><img referrerpolicy="no-referrer" src=${c(L)} alt="" @error=${A=>A.target.parentElement.remove()}></div>`:a}
    <h3 id="sheet-title">${L.title}</h3>
    <div class="ometa">${t.map(A=>r`<span>${A}</span>`)}</div>
    ${L.why?r`<div style="margin-top:12px"><span class="tag deal">${L.why}</span></div>`:a}
    <div class="sec">Ingrediënten</div><ul class="ings">${O1(V,L,99)}</ul>
    ${(L.pantry||[]).length?r`<div class="muted sm" style="margin-top:8px">Uit de kast: ${L.pantry.join(", ")}</div>`:a}
    ${(L.steps||[]).length?r`<div class="sec">Bereiding</div><ol>${L.steps.map(A=>r`<li>${A.text}</li>`)}</ol>`:a}
    ${e.length?r`<div class="stack" style="margin-top:16px">${e.map(A=>r`<div class="note">${d(o.tip,"sm")}<span>${A}</span></div>`)}</div>`:a}
    <div class="acts"><button class="btn plain" @click=${()=>V.setUi({sheet:null})}>Sluiten</button>
      ${V.locked?a:r`<button class="btn main" @click=${()=>V.choose(H.day,L.id)}>${M?r`${d(o.check)}Gekozen voor ${u(H.day)}`:`Kies voor ${u(H.day)}`}</button>`}</div>`}function B5(V,C){let{result:H,sel:L}=C,M=H.suggestions||[],e=M.filter(i=>L.has(i.key)),t=e.reduce((i,v)=>i+v.alt.saving,0),A=i=>{let v=new Set(L);v.has(i)?v.delete(i):v.add(i),V.setUi({sheet:{...C,sel:v}})};return r`<h3 id="sheet-title">Goedkoper alternatief</h3>
    ${M.length?r`<p class="muted sm">${s(H.checked,"product","producten")} vergeleken. Vink aan wat je wilt vervangen; controleer of het echt hetzelfde product is.</p>
        <div>${M.map(i=>r`<button class="prow" role="checkbox" aria-checked=${L.has(i.key)} @click=${()=>A(i.key)}>
          <span class="box">${L.has(i.key)?d(o.check,"sm"):a}</span>
          <span class="pt"><span class="was" style="display:block">${i.current.qty}× ${i.current.name}${i.current.unit&&!/\d/.test(i.current.name)?` (${i.current.unit})`:""} · ${Z(i.current.total)}</span>
            <span class="nu" style="display:block">${i.alt.qty}× ${i.alt.name}${i.alt.unit&&!/\d/.test(i.alt.name)?` (${i.alt.unit})`:""} · ${Z(i.alt.total)}</span>
            <span class="muted xs">${i.alt.reason}${i.current.recipe?` \xB7 ${i.current.recipe}`:""}</span></span>
          <span class="ps">−${Z(i.alt.saving)}</span></button>`)}</div>`:r`<div class="empty" style="padding:24px 0">${d(o.check)}<p>${s(H.checked,"product","producten")} vergeleken. Je hebt al de goedkoopste keuze.</p></div>`}
    <div class="acts"><button class="btn plain" @click=${()=>V.setUi({sheet:null})}>${M.length?"Annuleren":"Sluiten"}</button>
      ${M.length?r`<button class="btn main" ?disabled=${!e.length} @click=${()=>V.applyPrices()}>${e.length?`Vervang ${e.length} \xB7 \u2212${Z(t)}`:"Kies wat je vervangt"}</button>`:a}</div>`}function P5(V){let C=V.summary,H=V.plan,L=Object.keys(H.sent||{}).length>0,M=C.days_open||[],e=(V.days||[]).filter(i=>i.choice==="none").map(i=>u(i.day)),t=(V.days||[]).filter(i=>i.choice&&i.choice!=="none").length,A=C.to_remove||[];return r`<h3 id="sheet-title">${L?"Wijzigingen naar Picnic":"Naar je Picnic-mandje"}</h3>
    <ul class="lines" style="margin-top:12px">
      <li><span>${L?"Nog toe te voegen":"Producten"}</span><b>${L?C.to_send:C.items_count}</b></li>
      ${V.days?r`<li><span>Gerechten</span><b>${t} van ${V.days.length} dagen</b></li>`:a}
      <li><span>Totaal (schatting)</span><b>${Z(C.items_total)}${C.unknown_prices?" + ?":""}</b></li>
      ${C.savings>0?r`<li><span>Voordeel</span><b class="save">${Z(C.savings)}</b></li>`:a}
    </ul>
    <div class="stack" style="margin-top:16px">
      ${M.length?r`<div class="note attention">${d(o.alert,"sm")}<span><b>${M.map(u).join(", ")}</b>: nog niet gekozen. Daarvoor gaat er niets mee.</span></div>`:a}
      ${e.length?r`<div class="note">${d(o.none,"sm")}<span>Niets koken op ${e.join(", ")}.</span></div>`:a}
      ${C.unlinked?r`<div class="note attention">${d(o.link,"sm")}<span>${s(C.unlinked,"product","producten")} niet gekoppeld: Picnic kiest zelf op naam.</span></div>`:a}
      ${C.unknown_prices?r`<div class="note">${d(o.info,"sm")}<span>${s(C.unknown_prices,"product heeft","producten hebben")} nog geen prijs; het totaal is daardoor hoger.</span></div>`:a}
      ${A.length?r`<div class="note attention">${d(o.info,"sm")}<div>Al in je mandje maar niet meer nodig. Haal zelf weg in de Picnic-app:<ul>${A.map(i=>r`<li>${i.qty}× ${i.name}</li>`)}</ul></div></div>`:a}
      <div class="muted xs">Bezorgmoment kiezen en afrekenen doe je daarna in de Picnic-app.</div>
    </div>
    <div class="acts"><button class="btn plain" @click=${()=>V.setUi({sheet:null})}>Nog niet</button>
      <button class="btn main" @click=${()=>V.approve()}>${d(o.toCart)}${L&&!C.to_send?"Klaar, niets nieuws":"Zet in mandje"}</button></div>`}function T5(V,C){return r`<h3 id="sheet-title">Koppel aan Picnic</h3>
    <p class="muted sm">Kies het product voor “${C.name}”. Dan weet je zeker wat er in je mandje komt.</p>
    ${F(V,"link",C.name)}
    <div class="acts"><button class="btn plain" @click=${()=>V.setUi({sheet:null})}>Annuleren</button></div>`}var F5=20*60*1e3,Q2={none:{label:"Nog geen voorstel",tag:"neutral"},proposed:{label:"Voorstel klaar",tag:"neutral"},approving:{label:"Mandje vullen\u2026",tag:"neutral"},approved:{label:"In je Picnic-mandje",tag:"ok"}},Q=class extends w{constructor(){super(),this.data=null,this.error=null,this.ui={tab:"week",seg:"week",openDay:null,sheet:null,cook:null,busy:!1,priceLoading:!1},this.ov={items:{},days:{}},this.sugg={},this.now=Date.now(),this._seq=0,this._rang=new Set,this._onVisible=()=>this._visibility(),this._onKey=C=>C.key==="Escape"&&this._escape()}connectedCallback(){super.connectedCallback(),document.addEventListener("visibilitychange",this._onVisible),window.addEventListener("keydown",this._onKey),this.hass&&this._subscribe()}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("visibilitychange",this._onVisible),window.removeEventListener("keydown",this._onKey),this._unsubscribe(),clearInterval(this._tick),this._tick=null,this._releaseWake()}willUpdate(C){if(C.has("hass")&&this.hass){this._unsub||this._subscribe();let H=!!this.hass.themes?.darkMode;H!==this.hasAttribute("dark")&&this.toggleAttribute("dark",H)}}updated(C){if(!C.has("ui"))return;let H=C.get("ui")||{};if(this.ui.jump){let L=this.renderRoot.querySelector(".strip[data-jump]"),M=Number(L?.dataset.jump);if(L&&!isNaN(M)){let e=L.querySelectorAll(".ocard")[M];L.scrollLeft=e?e.offsetLeft-16:0,h1(L)}this.ui.jump=!1}if(this.ui.sheet?.type==="link"&&H.sheet?.type!=="link"){let L=this.renderRoot.getElementById("link");L&&(L.value=this.ui.sheet.name||"",L.focus(),this.onSearch("link",L.value))}this.ui.sheet&&!H.sheet&&this.renderRoot.querySelector(".sheet")?.focus?.()}_subscribe(){this._unsub||!this.hass||(this._unsub=this.hass.connection.subscribeMessage(C=>this._receive(C),{type:"weekmenu/subscribe"}),this._unsub.then(()=>this.error=null).catch(C=>{this._unsub=null,this.error=C?.message||String(C)}))}_unsubscribe(){this._unsub&&this._unsub.then(C=>C()).catch(()=>{}),this._unsub=null}_receive(C){this.data=C,this.error=null;let H=C.timers||[];for(let L of H)L.done&&!this._rang.has(L.id)&&(this._rang.add(L.id),document.visibilityState==="visible"&&this._beep());H.length&&!this._tick&&(this._tick=setInterval(()=>this.now=Date.now(),1e3)),!H.length&&this._tick&&(clearInterval(this._tick),this._tick=null)}_visibility(){document.visibilityState==="visible"&&(this._unsubscribe(),this._subscribe(),this.ui.cook&&this._wakeLock())}_escape(){this.ui.sheet?this.setUi({sheet:null}):this.ui.cook&&this.closeCook()}get plan(){return this.data?.plan||null}get days(){return this.plan?.days?.length?this.plan.days.map(C=>C.day in this.ov.days?{...C,choice:this.ov.days[C.day]}:C):null}get summary(){return this.data?.view?.summary||{}}get canEdit(){return this.data?.can_edit!==!1}get locked(){return["approved","approving"].includes(this.plan?.status)||!this.canEdit}get userName(){return(this.hass?.user?.name||"").toLowerCase()}items(){return(this.data?.view?.items||this.plan?.items||[]).map(H=>this.ov.items[H.key]?{...H,...this.ov.items[H.key]}:H)}active(){return this.items().filter(C=>!C.removed&&C.qty>0)}recipe(C){return(this.plan?.recipes||[]).find(H=>H.id===C)}status(){return Q2[this.plan?.status||"none"]||Q2.proposed}pending(C){let H=C.pending?.at?Date.parse(C.pending.at):0;return H?Date.now()-H<F5?"busy":"expired":null}setUi(C){this.ui={...this.ui,...C}}async ws(C,{quiet:H=!1}={}){try{return await this.hass.connection.sendMessagePromise(C)}catch(L){throw H||this.showToast(L?.message||"Dat lukte niet"),L}}async optimistic(C,H,L,M){let e=++this._seq;this.ov={...this.ov,[C]:{...this.ov[C],[H]:C==="days"?L:{...this.ov[C][H],...L,_seq:e}}};try{await this.ws(M)}catch{}let t=this.ov[C][H];if(C==="days"||t?._seq===e){let A={...this.ov[C]};delete A[H],this.ov={...this.ov,[C]:A}}}showToast(C,H=null){clearTimeout(this._toastT),this.toast={text:C,undo:H},this._toastT=setTimeout(()=>this.toast=null,H?6e3:3500)}onSearch(C,H){clearTimeout(this._sugT);let L=(H||"").trim();if(L.length<2){this.sugg[C]&&(this.sugg={...this.sugg,[C]:null});return}this._sugT=setTimeout(async()=>{this.sugg={...this.sugg,[C]:{q:L,items:this.sugg[C]?.items||[],loading:!0}};try{let M=await this.ws({type:"weekmenu/search",query:L},{quiet:!0});if(this.renderRoot.getElementById(C)?.value.trim()!==L)return;this.sugg={...this.sugg,[C]:{q:L,items:M.results||[],loading:!1}}}catch{this.sugg={...this.sugg,[C]:null}}},250)}clearSearch(C){let H=this.renderRoot.getElementById(C);H&&(H.value=""),this.sugg={...this.sugg,[C]:null}}async pick(C,H){let L={name:H.name,picnic_id:H.picnic_id||null,image_id:H.image_id||null,unit:H.unit||null,unit_price:H.unit_price??null};if(this.clearSearch(C),C.startsWith("own-"))await this.ws({type:"weekmenu/answer_item",question_id:C.slice(4),item:L}),this.showToast(`${H.name} gekozen`);else if(C==="link"){let M=this.ui.sheet?.key;this.setUi({sheet:null}),await this.ws({type:"weekmenu/link_item",key:M,item:L}),this.showToast(`Gekoppeld aan ${H.name}`)}else await this.ws({type:"weekmenu/add_item",item:L,qty:1,target:C==="addstd"?"standard":"week"}),this.showToast(`${H.name} toegevoegd`)}async searchEnter(C){let L=this.renderRoot.getElementById(C)?.value.trim();if(!L)return;let M=this.sugg[C]?.items?.[0];if(M?.picnic_id)return this.pick(C,M);C!=="link"&&(this.clearSearch(C),C.startsWith("own-")?(await this.ws({type:"weekmenu/answer_text",question_id:C.slice(4),text:L}),this.showToast("Genoteerd. Die bied ik volgende keer ook aan.")):(await this.ws({type:C==="addweek"?"weekmenu/add_text":"weekmenu/standard_add",text:L}),this.showToast(C==="addweek"?"Toegevoegd. Nog niet gekoppeld aan Picnic.":"Toegevoegd")))}setQty(C,H){if(H<=0)return this.remove(C);this.optimistic("items",C.key,{qty:H},{type:"weekmenu/item_qty",key:C.key,qty:H})}remove(C){this.optimistic("items",C.key,{removed:!0},{type:"weekmenu/item_removed",key:C.key,removed:!0});let H=C.source==="advice"?`Ok\xE9, nog genoeg ${C.name.toLowerCase()}. Ik vraag het later weer.`:`${C.name} weggehaald`;this.showToast(H,()=>this.ws({type:"weekmenu/item_removed",key:C.key,removed:!1}))}restore(C){this.ws({type:"weekmenu/item_removed",key:C.key,removed:!1})}stdQty(C,H){if(H>0)return this.ws({type:"weekmenu/standard_qty",key:C.key,qty:H});this.ws({type:"weekmenu/standard_qty",key:C.key,qty:0});let L={name:C.name,picnic_id:C.picnic_id||null,image_id:C.image_id||null,unit:C.unit||null,unit_price:C.unit_price??null};this.showToast(`${C.name} van je vaste lijst gehaald`,()=>this.ws({type:"weekmenu/add_item",item:L,qty:C.qty,target:"standard"}))}async choose(C,H){let L=this.days||[],M=L.find(A=>A.day===C);if(!M)return;let e=M.choice===H?null:H,t=e&&e!=="none"?L.find(A=>A.day!==C&&A.choice===e):null;if(this.ui.sheet?.type==="prep"&&this.setUi({sheet:null}),t&&(this.ov={...this.ov,days:{...this.ov.days,[t.day]:null}}),await this.optimistic("days",C,e,{type:"weekmenu/choose_day",day:C,choice:e}),t){let{[t.day]:A,...i}=this.ov.days;this.ov={...this.ov,days:i},this.showToast(`Verplaatst van ${u(t.day)} naar ${u(C)}`)}}async requestRecipes(C){if(!this.data?.claude_ready)return this.showToast("Stel eerst de Claude-koppeling in bij Weekmenu \u2192 Configureren");let H=this.renderRoot.getElementById(`wish-${C}`)?.value.trim()||null;try{await this.ws({type:"weekmenu/request_recipes",day:C,wish:H}),this.showToast("Claude is bezig. De nieuwe gerechten verschijnen vanzelf.")}catch{}}async priceCheck(){if(!this.ui.priceLoading){this.setUi({priceLoading:!0});try{let C=await this.ws({type:"weekmenu/price_check"});this.setUi({sheet:{type:"price",result:C,sel:new Set}})}catch{}finally{this.setUi({priceLoading:!1})}}}async applyPrices(){let{result:C,sel:H}=this.ui.sheet,L=C.suggestions.filter(e=>H.has(e.key)).map(e=>({key:e.key,alt:e.alt}));this.setUi({sheet:null});let M=await this.ws({type:"weekmenu/apply_prices",changes:L}).catch(()=>null);M&&this.showToast(`${s(M.applied,"product","producten")} vervangen \xB7 ${Z(M.saving)} goedkoper`)}async approve(){this.setUi({sheet:null,busy:!0});try{let C=await this.ws({type:"weekmenu/approve",allow_open_days:!0}),H=[C.failed?`${C.added} in je mandje, ${C.failed} niet gelukt`:C.added?`${s(C.added,"product","producten")} in je Picnic-mandje`:"Je mandje was al compleet"];C.to_remove?.length&&H.push(`haal ${s(C.to_remove.length,"product","producten")} zelf weg in Picnic`),this.showToast(H.join(" \xB7 ")),this.setUi({tab:"week"})}catch{}finally{this.setUi({busy:!1})}}reopen(){this.ws({type:"weekmenu/reopen"})}rate(C,H){this.ws({type:"weekmenu/feedback",recipe_id:C,rating:H}).then(()=>this.showToast("Dank je. Daar houd ik rekening mee."))}openCook(C){this.setUi({cook:{rid:C,step:-1,checked:{}},sheet:null}),this._wakeLock()}closeCook(){this.setUi({cook:null}),this._releaseWake()}cookStep(C){let H=this.ui.cook,L=(this.recipe(H.rid)?.steps||[]).length;this.setUi({cook:{...H,step:Math.max(-1,Math.min(L,H.step+C))}})}startTimer(C,H){this._unlockAudio(),this.ws({type:"weekmenu/timer_start",seconds:C,label:H,recipe_id:this.ui.cook?.rid||null})}stopTimer(C){this.ws({type:"weekmenu/timer_stop",id:C})}async _wakeLock(){try{"wakeLock"in navigator&&!this._wake&&(this._wake=await navigator.wakeLock.request("screen"),this._wake.addEventListener("release",()=>this._wake=null))}catch{}}_releaseWake(){try{this._wake?.release()}catch{}this._wake=null}_unlockAudio(){try{this._audio=this._audio||new(window.AudioContext||window.webkitAudioContext),this._audio.state==="suspended"&&this._audio.resume()}catch{}}_beep(){try{let C=this._audio||(this._audio=new(window.AudioContext||window.webkitAudioContext));[0,.35,.7].forEach(H=>{let L=C.createOscillator(),M=C.createGain();L.frequency.value=880,L.connect(M),M.connect(C.destination),M.gain.setValueAtTime(.25,C.currentTime+H),M.gain.exponentialRampToValueAtTime(.001,C.currentTime+H+.3),L.start(C.currentTime+H),L.stop(C.currentTime+H+.3)}),navigator.vibrate?.([200,100,200])}catch{}}render(){let C=[["week","Week",o.week],["list","Lijst",o.cart],["cook","Koken",o.cook]],H=this._actionBar(),L=(this.summary.days_open||[]).length;return r`<div class="app" style=${H?"--bar-h: 72px":""}>
      <header>
        ${this.narrow?r`<ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>`:a}
        <h1>Weekmenu${this.plan?r`<span class="sub">${this._subtitle()}</span>`:a}</h1>
        ${this.narrow?a:r`<nav class="htabs" role="tablist">${C.map(([M,e,t])=>r`
          <button role="tab" aria-selected=${this.ui.tab===M} @click=${()=>this.setUi({tab:M})}>${d(t)}${e}</button>`)}</nav>`}
      </header>
      <main><div class="wrap">${this._body()}</div></main>
      ${H}
      ${this.narrow?r`<nav class="tabbar" role="tablist">${C.map(([M,e,t])=>r`
        <button role="tab" aria-selected=${this.ui.tab===M} @click=${()=>this.setUi({tab:M})}>
          <span class="pill">${d(t)}</span>${e}${M==="week"&&L&&!this.locked?r`<span class="badge" aria-label="${L} open">${L}</span>`:a}
        </button>`)}</nav>`:a}
      ${G2(this)}
      ${this.ui.cook?z2(this):a}
      ${this.toast?r`<div class="toast" role="status" aria-live="polite"><span class="grow">${this.toast.text}</span>
        ${this.toast.undo?r`<button @click=${()=>{let M=this.toast.undo;this.toast=null,M()}}>${d(o.undo,"sm")} Ongedaan</button>`:a}</div>`:a}
    </div>`}_subtitle(){let C=this.plan,H=/W(\d+)/.exec(C.week||"")?.[1];return[H?`Week ${Number(H)}`:"",this.status().label].filter(Boolean).join(" \xB7 ")}_body(){return this.error?r`<div class="empty">${d(o.alert)}<p>${this.error}</p>
        <button class="btn tonal" @click=${()=>{this._unsubscribe(),this._subscribe()}}>${d(o.refresh)} Opnieuw</button></div>`:this.data?this.ui.tab==="list"?W2(this):this.ui.tab==="cook"?I2(this):D2(this):r`<div class="stack" aria-busy="true"><div class="skel" style="height:120px"></div><div class="skel" style="height:320px"></div></div>`}_actionBar(){let C=this.plan;if(!C||this.ui.tab==="cook"||!this.canEdit||this.ui.cook)return a;let H=this.summary;if(C.status==="approving"||this.ui.busy){let e=C.progress||{done:0,total:1};return r`<div class="actionbar" role="status"><div class="sum"><b>Mandje vullen…</b>
        <span>${e.done} van ${e.total} producten</span>
        <div class="progress"><i style="width:${Math.round(100*e.done/Math.max(1,e.total))}%"></i></div></div></div>`}if(C.status!=="proposed")return a;let L=Object.keys(C.sent||{}).length>0,M=[s(H.items_count||0,"product","producten")];return H.unknown_prices&&M.push(`${H.unknown_prices} zonder prijs`),H.savings>0&&M.push(`${Z(H.savings)} voordeel`),r`<div class="actionbar">
      <div class="sum"><b>${Z(H.items_total)}${H.unknown_prices?"+":""}</b><span>${M.join(" \xB7 ")}</span></div>
      <button class="btn" @click=${()=>this.setUi({sheet:{type:"approve"}})}>${d(o.toCart)}${L?"Wijzigingen naar Picnic":"Naar Picnic"}</button>
    </div>`}deliveryLine(){let C=this.plan,H=[];return(C.delivery_at||C.delivery)&&H.push(`Bezorging ${u1(C.delivery_at,C.delivery)}`),C.status!=="approved"&&(C.order_deadline_at||C.order_deadline)&&H.push(`bestellen tot ${u1(C.order_deadline_at,C.order_deadline)}`),H.join(" \xB7 ")}};t1(Q,"styles",j1),t1(Q,"properties",{hass:{attribute:!1},narrow:{type:Boolean},panel:{attribute:!1},data:{state:!0},error:{state:!0},ui:{state:!0},ov:{state:!0},toast:{state:!0},sugg:{state:!0},now:{state:!0}});customElements.get("weekmenu-panel")||customElements.define("weekmenu-panel",Q);
