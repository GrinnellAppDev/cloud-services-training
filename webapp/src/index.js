import React from "react"
import ReactDOM from "react-dom"
import "./index.css"
import App from "./App"
import registerServiceWorker from "./registerServiceWorker"
import { configureStore } from "./store"
import { Provider } from "react-redux"
import { delay } from "rxjs/operators/delay"

const store = configureStore({
  fetchFromAPI: (uri, init) =>
    fetch(process.env.REACT_APP_API_ROOT + uri, init),
  delayPromise: (duration, value = null) =>
    new Promise(resolve => setTimeout(() => resolve(value), duration)),
  delay
})

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
)
registerServiceWorker()
