import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/theme.css'
import './styles/components.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// iOS a volte scrolla la finestra (es. all'apertura della tastiera) e la
// lascia spostata: qui non c'è nulla da scrollare fuori dall'app, quindi
// qualsiasi scroll della finestra va annullato subito.
window.addEventListener('scroll', () => {
  if (window.scrollX || window.scrollY) window.scrollTo(0, 0)
})

// DEBUG temporaneo: mostra le misure reali del viewport per capire da dove
// arriva il vuoto sotto la tabbar su iPhone. Da rimuovere una volta risolto.
function debugOverlay() {
  let el = document.getElementById('dbg')
  if (!el) {
    el = document.createElement('div')
    el.id = 'dbg'
    el.style.cssText =
      'position:fixed;top:80px;left:8px;right:8px;z-index:9999;background:rgba(0,0,0,0.85);color:#0f0;font:11px monospace;padding:6px;border:1px solid #0f0;pointer-events:none;white-space:pre-wrap'
    document.body.appendChild(el)
  }
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;bottom:0;height:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);visibility:hidden'
  document.body.appendChild(probe)
  const cs = getComputedStyle(probe)
  const root = document.getElementById('root')
  const tb = document.querySelector('.tabbar')
  el.textContent =
    `standalone:${window.navigator.standalone} ` +
    `inner:${window.innerWidth}x${window.innerHeight} ` +
    `screen:${window.screen.width}x${window.screen.height}\n` +
    `vv:${window.visualViewport ? Math.round(window.visualViewport.width) + 'x' + Math.round(window.visualViewport.height) + ' ot:' + Math.round(window.visualViewport.offsetTop) : 'n/a'} ` +
    `scrollY:${window.scrollY}\n` +
    `env top:${cs.paddingTop} bottom:${cs.paddingBottom}\n` +
    `html:${document.documentElement.getBoundingClientRect().height.toFixed(0)} ` +
    `body:${document.body.getBoundingClientRect().height.toFixed(0)} ` +
    `root:${root ? root.getBoundingClientRect().height.toFixed(0) : '-'}\n` +
    (tb
      ? `tabbar top:${tb.getBoundingClientRect().top.toFixed(0)} bottom:${tb.getBoundingClientRect().bottom.toFixed(0)} h:${tb.getBoundingClientRect().height.toFixed(0)}`
      : 'tabbar: -')
  probe.remove()
}
setInterval(debugOverlay, 1000)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}
