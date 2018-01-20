import { createSelector } from "reselect"
import { merge as mergeObservables } from "rxjs/observable/merge"
import { empty as emptyObservable } from "rxjs/observable/empty"
import { of as observableOf } from "rxjs/observable/of"
import { mergeMap } from "rxjs/operators/mergeMap"
import { filter } from "rxjs/operators/filter"
import { race } from "rxjs/operators/race"
import { take } from "rxjs/operators/take"
import { mapTo } from "rxjs/operators/mapTo"
import { map } from "rxjs/operators/map"

// Selectors

export const getToastsQueueLength = state => state.toasts.queue.length
export const getTopToast = state => state.toasts.queue[0]

export const makeGetAnyToastIsSpinning = () =>
  createSelector(
    state => state.toasts.queue,
    queue => queue.some(toast => toast.useSpinner)
  )

// Action Creators

export const sendToast = (
  id,
  message,
  buttonText = "",
  { useSpinner = false } = {}
) => ({
  type: "SEND_TOAST",
  id,
  message,
  buttonText,
  useSpinner
})
export const closeTopToast = ({ withAction = false } = {}) => ({
  type: "CLOSE_TOP_TOAST",
  withAction
})
export const toastClosed = (id, { withAction }) => ({
  type: "TOAST_CLOSED",
  id,
  withAction
})
export const shiftToasts = () => ({ type: "SHIFT_TOASTS" })

// Reducer

export const toastsReducer = (state = { queue: [] }, { type, ...payload }) => {
  switch (type) {
    case "SEND_TOAST": {
      const currentToastIndex = state.queue.findIndex(
        ({ id }) => id === payload.id
      )

      return {
        ...state,
        queue:
          currentToastIndex >= 0
            ? [
                ...state.queue.slice(0, currentToastIndex),
                payload,
                ...state.queue.slice(currentToastIndex + 1)
              ]
            : [...state.queue, payload]
      }
    }
    case "CLOSE_TOP_TOAST":
      return {
        ...state,
        queue:
          state.queue.length > 0
            ? [
                {
                  ...state.queue[0],
                  message: "",
                  buttonText: "",
                  useSpinner: false
                },
                ...state.queue.slice(1)
              ]
            : []
      }
    case "SHIFT_TOASTS":
      return {
        ...state,
        queue: state.queue.slice(1)
      }
    default:
      return state
  }
}

// Epic

export const toastEpic = (actionsObservable, { getState }, { delay }) =>
  actionsObservable.pipe(
    filter(({ type }) => {
      const queueLength = getToastsQueueLength(getState())
      return (
        (type === "SEND_TOAST" && queueLength <= 1) ||
        (type === "SHIFT_TOASTS" && queueLength > 0)
      )
    }),
    map(() => getTopToast(getState())),
    mergeMap(({ id, useSpinner }) =>
      observableOf(null).pipe(
        delay(3000),
        mergeMap(
          () =>
            getToastsQueueLength(getState()) > 1 || useSpinner
              ? observableOf(null)
              : observableOf(null).pipe(delay(3000))
        ),
        mapTo({ signal: "TIMEOUT" }),
        race(
          actionsObservable
            .ofType("CLOSE_TOP_TOAST")
            .pipe(
              take(1),
              map(({ withAction }) => ({ signal: "EARLY_CLOSE", withAction }))
            ),
          actionsObservable
            .ofType("SEND_TOAST")
            .pipe(
              filter(action => action.id === id),
              take(1),
              mapTo({ signal: "RESEND" })
            )
        ),
        mergeMap(
          ({ signal, withAction = false }) =>
            signal === "RESEND"
              ? emptyObservable()
              : mergeObservables(
                  signal === "TIMEOUT"
                    ? observableOf(closeTopToast({ withAction }))
                    : emptyObservable(),
                  observableOf(toastClosed(id, { withAction })),
                  observableOf(null).pipe(delay(200), mapTo(shiftToasts()))
                )
        )
      )
    )
  )
