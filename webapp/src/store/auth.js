import base64 from "base-64"
import { combineEpics } from "redux-observable"
import { from as observableFrom } from "rxjs/observable/from"
import { of as observableOf } from "rxjs/observable/of"
import { race as raceObservables } from "rxjs/observable/race"
import { mergeMap } from "rxjs/operators/mergeMap"
import { map } from "rxjs/operators/map"
import { catchError } from "rxjs/operators/catchError"
import { filter } from "rxjs/operators/filter"
import { merge as mergeObservables } from "rxjs/observable/merge"
import { empty as emptyObservable } from "rxjs/observable/empty"

// Selectors

export const getAuthDialog = state => state.auth.dialog
export const getAuthToken = state => state.auth.token
export const getAuthTokenExpiration = state => state.auth.tokenExpiration

// Action Creators

export const openAuthDialog = () => ({ type: "OPEN_AUTH_DIALOG" })
export const closeAuthDialog = () => ({ type: "CLOSE_AUTH_DIALOG" })
export const changeAuthDialog = changes => ({
  type: "CHANGE_AUTH_DIALOG",
  ...changes
})
export const submitAuthDialog = () => ({ type: "SUBMIT_AUTH_DIALOG" })
export const authSubmitFailed = errorMessage => ({
  type: "AUTH_SUBMIT_FAILED",
  errorMessage
})
export const authSubmitSuccess = () => ({ type: "AUTH_SUBMIT_SUCCESS" })
export const receiveAuthToken = (token, expiration) => ({
  type: "RECEIVE_AUTH_TOKEN",
  token,
  expiration
})
export const loadAuthToken = (token, expiration) => ({
  type: "LOAD_AUTH_TOKEN",
  token,
  expiration
})
export const clearAuthToken = () => ({ type: "CLEAR_AUTH_TOKEN" })

// Reducers

export const authReducer = (
  state = {
    dialog: {
      isOpen: false,
      isSubmitting: false,
      hasAccount: false,
      name: "",
      email: "",
      password: "",
      errorMessage: ""
    },
    token: null,
    tokenExpiration: null
  },
  { type, ...payload }
) => {
  switch (type) {
    case "OPEN_AUTH_DIALOG":
      return {
        ...state,
        dialog: { ...state.dialog, isOpen: true }
      }
    case "CLOSE_AUTH_DIALOG":
    case "AUTH_SUBMIT_SUCCESS":
      return {
        ...state,
        dialog: {
          ...state.dialog,
          isOpen: false,
          isSubmitting: false,
          email: "",
          password: "",
          errorMessage: ""
        }
      }
    case "CHANGE_AUTH_DIALOG":
      return {
        ...state,
        dialog: { ...state.dialog, ...payload }
      }
    case "SUBMIT_AUTH_DIALOG":
      return {
        ...state,
        dialog: { ...state.dialog, isSubmitting: true }
      }
    case "AUTH_SUBMIT_FAILED":
      return {
        ...state,
        dialog: {
          ...state.dialog,
          isSubmitting: false,
          errorMessage: payload.errorMessage
        }
      }
    case "RECEIVE_AUTH_TOKEN":
    case "LOAD_AUTH_TOKEN":
      return {
        ...state,
        token: payload.token,
        tokenExpiration: payload.expiration
      }
    case "CLEAR_AUTH_TOKEN":
      return {
        ...state,
        token: null,
        tokenExpiration: null
      }
    default:
      return state
  }
}

// Epics

export const encodeBasicAuth = (email, password) =>
  `Basic ${base64.encode(`${email}:${password}`)}`

export const signInEpic = (actionsObservable, { getState }, { fetch }) =>
  actionsObservable.ofType("SUBMIT_AUTH_DIALOG").pipe(
    mergeMap(() =>
      raceObservables(
        actionsObservable.ofType("CLOSE_AUTH_DIALOG"),
        observableFrom(
          fetch("/api/auth/token", {
            headers: {
              Authorization: encodeBasicAuth(
                getAuthDialog(getState()).email,
                getAuthDialog(getState()).password
              )
            }
          })
        )
      ).pipe(
        filter(value => value.type !== "CLOSE_AUTH_DIALOG"),
        mergeMap(
          response =>
            response.ok
              ? observableFrom(response.json())
              : observableFrom(response.json()).pipe(
                  map(({ message }) => {
                    throw new Error(`Error (${response.status}): ${message}`)
                  })
                )
        ),
        mergeMap(body =>
          observableOf(
            receiveAuthToken(body.token, body.tokenExpiration),
            authSubmitSuccess()
          )
        ),
        catchError(error => observableOf(authSubmitFailed(error.message)))
      )
    )
  )

export const localStorageEpic = (
  actionsObservable,
  { getState },
  { localStorage }
) => {
  const savedToken = localStorage.getItem("cst:authToken")
  const savedExpiration = localStorage.getItem("cst:authTokenExpiration")

  return mergeObservables(
    savedToken
      ? observableOf(loadAuthToken(savedToken, savedExpiration))
      : emptyObservable(),
    actionsObservable.ofType("RECEIVE_AUTH_TOKEN").pipe(
      mergeMap(({ token, expiration }) => {
        localStorage.setItem("cst:authToken", token)
        localStorage.setItem("cst:authTokenExpiration", expiration)

        return emptyObservable()
      })
    ),
    actionsObservable.ofType("CLEAR_AUTH_TOKEN").pipe(
      mergeMap(() => {
        localStorage.clear()

        return emptyObservable()
      })
    )
  )
}

export const authEpic = combineEpics(signInEpic, localStorageEpic)
