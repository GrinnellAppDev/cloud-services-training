import {
  authReducer,
  openAuthDialog,
  closeAuthDialog,
  receiveAuthToken,
  changeAuthDialog,
  submitAuthDialog,
  authSubmitFailed,
  signInEpic,
  encodeBasicAuth
} from "./auth"
import { testEpic, createDelayedObservable } from "./testUtils"
import { _throw as observableThrow } from "rxjs/observable/throw"
import { of as observableOf } from "rxjs/observable/of"

describe("authReducer", () => {
  const initialState = {
    dialog: {
      isOpen: false,
      isSubmitting: false,
      email: "",
      password: "",
      errorMessage: ""
    },
    token: null,
    tokenExpiration: null
  }

  it("has a complete default state", () => {
    expect(authReducer(undefined, { type: "UNKNOWN" })).toEqual(initialState)
  })

  it("ignores unknown actions", () => {
    expect(authReducer(initialState, { type: "UNKNOWN" })).toBe(initialState)
  })

  it("opens the dialog", () => {
    expect(authReducer(initialState, openAuthDialog())).toEqual({
      ...initialState,
      dialog: { ...initialState.dialog, isOpen: true }
    })
  })

  it("closes the dialog and clears it", () => {
    expect(
      authReducer(
        {
          ...initialState,
          dialog: {
            ...initialState.dialog,
            isOpen: true,
            isSubmitting: true,
            email: "foo",
            password: "bar",
            errorMessage: "baz"
          }
        },
        closeAuthDialog()
      )
    ).toEqual({
      ...initialState,
      dialog: {
        ...initialState.dialog,
        isOpen: false,
        isSubmitting: false,
        email: "",
        password: "",
        errorMessage: ""
      }
    })
  })

  it("changes the dialog email", () => {
    expect(
      authReducer(initialState, changeAuthDialog({ email: "foo" }))
    ).toEqual({
      ...initialState,
      dialog: { ...initialState.dialog, email: "foo" }
    })
  })

  it("changes multiple dialog options", () => {
    expect(
      authReducer(
        initialState,
        changeAuthDialog({ email: "bar", password: "foo" })
      )
    ).toEqual({
      ...initialState,
      dialog: { ...initialState.dialog, email: "bar", password: "foo" }
    })
  })

  it("submits the auth dialog", () => {
    expect(authReducer(initialState, submitAuthDialog())).toEqual({
      ...initialState,
      dialog: { ...initialState.dialog, isSubmitting: true }
    })
  })

  it("handles auth errors", () => {
    expect(
      authReducer(
        {
          ...initialState,
          dialog: { ...initialState.dialog, isSubmitting: true }
        },
        authSubmitFailed("foo")
      )
    ).toEqual({
      ...initialState,
      dialog: {
        ...initialState.dialog,
        isSubmitting: false,
        errorMessage: "foo"
      }
    })
  })

  it("when a token comes back, closes the dialog and saves the token", () => {
    const date = new Date().toISOString()
    expect(
      authReducer(
        {
          ...initialState,
          dialog: {
            ...initialState.dialog,
            isOpen: true,
            isSubmitting: true,
            email: "foo",
            password: "bar"
          }
        },
        receiveAuthToken("abc.def.ghi", date)
      )
    ).toEqual({
      ...initialState,
      dialog: {
        ...initialState.dialog,
        isOpen: false,
        isSubmitting: false,
        email: "",
        password: ""
      },
      token: "abc.def.ghi",
      tokenExpiration: date
    })
  })
})

describe("signInEpic", () => {
  const date = new Date().toISOString()
  const valueMap = {
    s: submitAuthDialog(),
    f: authSubmitFailed("Failed to fetch"),
    h: authSubmitFailed("HTTP Error: Server error (500)"),
    r: receiveAuthToken("abc", date),
    x: closeAuthDialog()
  }

  it("calls fetch when the dialog is submitted", () => {
    const fetch = jest.fn()

    testEpic({
      epic: signInEpic,
      inputted: "-s-------",
      valueMap,
      getState: () => ({
        auth: { dialog: { email: "foo", password: "bar" } }
      }),
      getDependencies: () => ({ fetch })
    })

    expect(fetch).toBeCalledWith("/api/auth/token", {
      headers: {
        Authorization: encodeBasicAuth("foo", "bar")
      }
    })
  })

  it("handles fetch errors", () => {
    testEpic({
      epic: signInEpic,
      inputted: "-s-------",
      expected: "------f--",
      valueMap,
      getState: () => ({
        auth: { dialog: {} }
      }),
      getDependencies: scheduler => ({
        fetch: () =>
          createDelayedObservable(
            observableThrow(TypeError("Failed to fetch")),
            scheduler
          )
      })
    })
  })

  it("handles HTTP errors", () => {
    testEpic({
      epic: signInEpic,
      inputted: "-s-------",
      expected: "------h--",
      valueMap,
      getState: () => ({
        auth: { dialog: {} }
      }),
      getDependencies: scheduler => ({
        fetch: () =>
          createDelayedObservable(
            observableOf({
              ok: false,
              status: 500,
              statusText: "Server error"
            }),
            scheduler
          )
      })
    })
  })

  it("receives the new auth token", () => {
    testEpic({
      epic: signInEpic,
      inputted: "-s-------",
      expected: "------r--",
      valueMap,
      getState: () => ({
        auth: { dialog: {} }
      }),
      getDependencies: scheduler => ({
        fetch: () =>
          createDelayedObservable(
            observableOf({
              ok: true,
              json: () =>
                observableOf({
                  token: "abc",
                  tokenExpiration: date
                })
            }),
            scheduler
          )
      })
    })
  })

  it("can be canceled", () => {
    testEpic({
      epic: signInEpic,
      inputted: "-s--x----",
      expected: "---------",
      valueMap,
      getState: () => ({
        auth: { dialog: {} }
      }),
      getDependencies: scheduler => ({
        fetch: () =>
          createDelayedObservable(
            observableOf({
              ok: true,
              json: () =>
                observableOf({
                  token: "abc",
                  tokenExpiration: date
                })
            }),
            scheduler
          )
      })
    })
  })
})
