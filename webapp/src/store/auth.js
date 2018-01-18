import { mergeMap } from "rxjs/operators/mergeMap"
import { from as observableFrom } from "rxjs/observable/from"
import base64 from "base-64"
import { catchError } from "rxjs/operators/catchError"
import { of as observableOf } from "rxjs/observable/of"
import { map } from "rxjs/operators/map"
import { combineEpics } from "redux-observable"

// Selectors

export const getAuthPopup = state => state.auth.popup

// Action Creators

export const openAuthPopup = () => ({ type: "OPEN_AUTH_POPUP" })
export const closeAuthPopup = () => ({ type: "CLOSE_AUTH_POPUP" })
export const changeAuthPopup = changes => ({
  type: "CHANGE_AUTH_POPUP",
  ...changes
})
export const submitAuthPopup = () => ({ type: "SUBMIT_AUTH_POPUP" })
export const authSubmitFailed = errorMessage => ({
  type: "AUTH_SUBMIT_FAILED",
  errorMessage
})
export const receiveAuthToken = (token, expiration) => ({
  type: "RECEIVE_AUTH_TOKEN",
  token,
  expiration
})

// Reducers

export const authReducer = (
  state = {
    popup: {
      isOpen: false,
      isSubmitting: false,
      email: "",
      password: "",
      errorMessage: ""
    },
    token: { status: "UNLOADED" }
  },
  { type, ...payload }
) => {
  switch (type) {
    case "OPEN_AUTH_POPUP":
      return {
        ...state,
        popup: { ...state.popup, isOpen: true }
      }
    case "CLOSE_AUTH_POPUP":
      return {
        ...state,
        popup: {
          ...state.popup,
          isOpen: false,
          isSubmitting: false,
          email: "",
          password: "",
          errorMessage: ""
        }
      }
    case "CHANGE_AUTH_POPUP":
      return {
        ...state,
        popup: { ...state.popup, ...payload }
      }
    case "SUBMIT_AUTH_POPUP":
      return {
        ...state,
        popup: { ...state.popup, isSubmitting: true }
      }
    case "AUTH_SUBMIT_FAILED":
      return {
        ...state,
        popup: {
          ...state.popup,
          isSubmitting: false,
          errorMessage: payload.errorMessage
        }
      }
    case "RECEIVE_AUTH_TOKEN":
      return {
        ...state,
        popup: {
          ...state.popup,
          isOpen: false,
          isSubmitting: false,
          email: "",
          password: ""
        },
        token: {
          status: "LOADED",
          value: payload.token,
          expiration: payload.expiration
        }
      }
    default:
      return state
  }
}

// Epics

export const encodeBasicAuth = (email, password) =>
  base64.encode(`${email}:${password}`)

export const signInEpic = (actionsObservable, { getState }, { fetch }) =>
  actionsObservable.ofType("SUBMIT_AUTH_POPUP").pipe(
    mergeMap(() =>
      observableFrom(
        fetch("/api/auth/token", {
          headers: {
            Authorization: `Basic ${encodeBasicAuth(
              getAuthPopup(getState()).email,
              getAuthPopup(getState()).password
            )}`
          }
        })
      ).pipe(
        mergeMap(response => {
          if (response.ok) return observableFrom(response.json())
          else
            throw new Error(
              `HTTP Error: ${response.statusText} (${response.status})`
            )
        }),
        map(body => receiveAuthToken(body.token, body.tokenExpiration)),
        catchError(error => observableOf(authSubmitFailed(error.message)))
      )
    )
  )

export const authEpic = combineEpics(signInEpic)
