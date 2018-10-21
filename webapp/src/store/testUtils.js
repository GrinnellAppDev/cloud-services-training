import { TestScheduler } from "rxjs"
import { ActionsObservable } from "redux-observable"
import { delay as delayOperator } from "rxjs/operators/delay"
import { of as observableOf } from "rxjs/observable/of"
import { mergeMap } from "rxjs/operators/mergeMap"
import { empty as emptyObservable } from "rxjs/observable/empty"

export const testEpic = ({
  epic,
  inputted,
  expected = null,
  valueMap,
  getState,
  getDependencies = scheduler => ({})
}) => {
  const scheduler = new TestScheduler((actualVal, expectedVal) => {
    if (expected !== null)
      expect(actualVal.filter(x => x.notification.kind !== "C")).toEqual(
        expectedVal
      )
  })

  const outputObservable = epic(
    ActionsObservable.from(scheduler.createHotObservable(inputted, valueMap)),
    { getState },
    {
      delay: () => delayOperator(50, scheduler),
      startHotTimer: () => observableOf(null),
      ...getDependencies(scheduler)
    }
  )

  scheduler
    .expectObservable(outputObservable)
    .toBe(expected !== null ? expected : "", valueMap)
  scheduler.flush()
}

export const createDelayedObservable = (
  observable,
  scheduler,
  delayTime = 50
) =>
  observableOf(null).pipe(
    delayOperator(50, scheduler),
    mergeMap(() => observable)
  )
