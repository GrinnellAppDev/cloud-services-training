import React from "react"
import ReactDOM from "react-dom"
import "./index.css"
import App from "./App"
import registerServiceWorker from "./registerServiceWorker"
import { configureStore } from "./store"
import { Provider } from "react-redux"

const store = configureStore({
  fetchFromAPI: (uri, init) => fetch(process.env.REACT_APP_API_ROOT + uri, init)
})

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
)
registerServiceWorker()
