import React from "react"
import ReactDOM from "react-dom"
import "./index.css"
import App from "./App"
import registerServiceWorker from "./registerServiceWorker"
import { configureStore } from "./store"
import { makeGetAnyToastIsSpinning } from "./store/toasts"
import { Provider } from "react-redux"
import { delay } from "rxjs/operators/delay"
import { dialogRoot } from "./Dialog"
import { from as observableFrom } from "rxjs/observable/from"

const store = configureStore({
  fetch,
  localStorage,
  delay,
  startHotTimer: duration =>
    observableFrom(
      new Promise(resolve => setTimeout(() => resolve(null), duration))
    )
})

const anyToastIsSpinning = makeGetAnyToastIsSpinning()
window.addEventListener("beforeunload", ev => {
  // TODO: add a way to check if any fetch requests are still rolling
  if (anyToastIsSpinning(store.getState())) {
    // TODO: close all toasts
    ev.returnValue = "You have unsaved changes!"
    return ev.returnValue
  }
})

document.body.appendChild(dialogRoot)
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
)
registerServiceWorker()
