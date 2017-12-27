import React from "react"
import { storiesOf } from "@storybook/react"
import { action as storybookAction } from "@storybook/addon-actions"
import App from "../src/App"
import { Provider } from "react-redux"
import configureMockStore from "redux-mock-store"

const createStore = configureMockStore([
  store => next => action => {
    storybookAction(action.type)(action)
    next(action)
  }
])

storiesOf("App", module)
  .add("a few tasks", () => (
    <Provider
      store={createStore({
        newTask: {
          text: ""
        },
        tasks: {
          items: {
            s38rOsF: { _id: "s38rOsF", isComplete: false, text: "Get coffee" },
            Fs3393a: { _id: "Fs3393a", isComplete: true, text: "Do laundry" },
            a23D1di: { _id: "a23D1di", isComplete: false, text: "Finish novel" }
          }
        }
      })}
    >
      <App />
    </Provider>
  ))
  .add("typing a new task", () => (
    <Provider
      store={createStore({
        newTask: {
          text: "Get coff"
        },
        tasks: {
          items: {}
        }
      })}
    >
      <App />
    </Provider>
  ))
  .add("loading", () => (
    <Provider
      store={createStore({
        newTask: {
          text: ""
        },
        tasks: {
          status: "LOADING",
          items: {}
        }
      })}
    >
      <App />
    </Provider>
  ))
  .add("loading with some tasks", () => (
    <Provider
      store={createStore({
        newTask: {
          text: ""
        },
        tasks: {
          status: "LOADING",
          items: {
            s38rOsF: { _id: "s38rOsF", isComplete: false, text: "Get coffee" },
            a23D1di: { _id: "a23D1di", isComplete: false, text: "Finish novel" }
          }
        }
      })}
    >
      <App />
    </Provider>
  ))
