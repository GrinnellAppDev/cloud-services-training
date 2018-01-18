import { configureStore, reducer, rootEpic } from "./index"
import { testEpic } from "./testUtils"

describe("reducer", () => {
  it("ignores unknown actions and sends back a === state", () => {
    const state = {
      newTask: {},
      tasks: {},
      toasts: {},
      auth: {}
    }
    expect(reducer(state, { type: "UNKNOWN" })).toBe(state)
  })
})

describe("rootEpic", () => {
  it("ignores unknown actions", () => {
    testEpic({
      epic: rootEpic,
      inputted: "-u-----",
      expected: "-------",
      valueMap: {
        u: { type: "UNKNOWN" }
      }
    })
  })
})

describe("configureStore", () => {
  it("makes a store without a default state", () => {
    expect(configureStore({}).getState()).toBeTruthy()
  })
})
