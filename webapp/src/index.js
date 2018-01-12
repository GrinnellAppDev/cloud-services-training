import React from "react"
import ReactDOM from "react-dom"
import "./index.css"
import App from "./App"
import registerServiceWorker from "./registerServiceWorker"
import { configureStore } from "./store"
import { Provider } from "react-redux"
import { delay } from "rxjs/operators/delay"
import { from as observableFrom } from "rxjs/observable/from"

const store = configureStore({
  fetchFromAPI: (uri, init) =>
    observableFrom(fetch(process.env.REACT_APP_API_ROOT + uri, init)),
  delay
})

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
)
registerServiceWorker()
