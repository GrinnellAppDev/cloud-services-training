import {
  authReducer,
  openAuthPopup,
  closeAuthPopup,
  receiveAuthToken,
  changeAuthPopup,
  submitAuthPopup,
  authSubmitFailed,
  signInEpic,
  encodeBasicAuth
} from "./auth"
import { testEpic, createDelayedObservable } from "./testUtils"
import { _throw as observableThrow } from "rxjs/observable/throw"
import { of as observableOf } from "rxjs/observable/of"

describe("authReducer", () => {
  const initialState = {
    popup: {
      isOpen: false,
      isSubmitting: false,
      email: "",
      password: "",
      errorMessage: ""
    },
    token: { status: "UNLOADED" }
  }

  it("has a complete default state", () => {
    expect(authReducer(undefined, { type: "UNKNOWN" })).toEqual(initialState)
  })

  it("ignores unknown actions", () => {
    expect(authReducer(initialState, { type: "UNKNOWN" })).toBe(initialState)
  })

  it("opens the popup", () => {
    expect(authReducer(initialState, openAuthPopup())).toEqual({
      ...initialState,
      popup: { ...initialState.popup, isOpen: true }
    })
  })

  it("closes the popup and clears it", () => {
    expect(
      authReducer(
        {
          ...initialState,
          popup: {
            ...initialState.popup,
            isOpen: true,
            isSubmitting: true,
            email: "foo",
            password: "bar",
            errorMessage: "baz"
          }
        },
        closeAuthPopup()
      )
    ).toEqual({
      ...initialState,
      popup: {
        ...initialState.popup,
        isOpen: false,
        isSubmitting: false,
        email: "",
        password: "",
        errorMessage: ""
      }
    })
  })

  it("changes the popup email", () => {
    expect(
      authReducer(initialState, changeAuthPopup({ email: "foo" }))
    ).toEqual({
      ...initialState,
      popup: { ...initialState.popup, email: "foo" }
    })
  })

  it("changes multiple popup options", () => {
    expect(
      authReducer(
        initialState,
        changeAuthPopup({ email: "bar", password: "foo" })
      )
    ).toEqual({
      ...initialState,
      popup: { ...initialState.popup, email: "bar", password: "foo" }
    })
  })

  it("submits the auth popup", () => {
    expect(authReducer(initialState, submitAuthPopup())).toEqual({
      ...initialState,
      popup: { ...initialState.popup, isSubmitting: true }
    })
  })

  it("handles auth errors", () => {
    expect(authReducer(initialState, authSubmitFailed("foo"))).toEqual({
      ...initialState,
      popup: { ...initialState.popup, isSubmitting: false, errorMessage: "foo" }
    })
  })

  it("when a token comes back, closes the popup and saves the token", () => {
    const date = new Date().toISOString()
    expect(
      authReducer(
        {
          ...initialState,
          popup: {
            ...initialState.popup,
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
      popup: {
        ...initialState.popup,
        isOpen: false,
        isSubmitting: false,
        email: "",
        password: ""
      },
      token: { status: "LOADED", value: "abc.def.ghi", expiration: date }
    })
  })
})

describe("signInEpic", () => {
  const date = new Date().toISOString()
  const valueMap = {
    s: submitAuthPopup(),
    f: authSubmitFailed("Failed to fetch"),
    h: authSubmitFailed("HTTP Error: Server error (500)"),
    r: receiveAuthToken("abc", date)
  }

  it("calls fetch when the popup is submitted", () => {
    const fetch = jest.fn()

    testEpic({
      epic: signInEpic,
      inputted: "-s-------",
      valueMap,
      getState: () => ({
        auth: { popup: { email: "foo", password: "bar" } }
      }),
      getDependencies: () => ({ fetch })
    })

    expect(fetch).toBeCalledWith("/api/auth/token", {
      headers: {
        Authorization: `Basic ${encodeBasicAuth("foo", "bar")}`
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
        auth: { popup: {} }
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
        auth: { popup: {} }
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
        auth: { popup: {} }
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
