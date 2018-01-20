import {
  closeTopToast,
  toastEpic,
  sendToast,
  shiftToasts,
  toastClosed,
  toastsReducer
} from "./toasts"
import { testEpic, createDelayedObservable } from "./testUtils"

describe("toastsReducer", () => {
  const initialState = { queue: [] }

  it("has a complete default initial state", () => {
    expect(toastsReducer(undefined, { type: "UNKNOWN" })).toEqual(initialState)
  })

  it("can add a toast", () => {
    expect(
      toastsReducer(
        initialState,
        sendToast("a", "foo", "bar", { useSpinner: true })
      )
    ).toEqual({
      ...initialState,
      queue: [{ id: "a", message: "foo", buttonText: "bar", useSpinner: true }]
    })
  })

  it("can modify a toast", () => {
    expect(
      toastsReducer(
        {
          ...initialState,
          queue: [
            {
              id: "b",
              message: "message b",
              buttonText: "",
              useSpinner: false
            },
            {
              id: "a",
              message: "foo",
              buttonText: "bar",
              useSpinner: false
            },
            {
              id: "c",
              message: "message c",
              buttonText: "",
              useSpinner: false
            }
          ]
        },
        sendToast("a", "foo2", "bar2", { useSpinner: true })
      )
    ).toEqual({
      ...initialState,
      queue: [
        {
          id: "b",
          message: "message b",
          buttonText: "",
          useSpinner: false
        },
        { id: "a", message: "foo2", buttonText: "bar2", useSpinner: true },
        { id: "c", message: "message c", buttonText: "", useSpinner: false }
      ]
    })
  })

  it("can add a toast with defaults", () => {
    expect(toastsReducer(initialState, sendToast("a", "foo"))).toEqual({
      ...initialState,
      queue: [{ id: "a", message: "foo", buttonText: "", useSpinner: false }]
    })
  })

  it("can close the top toast", () => {
    expect(
      toastsReducer(
        {
          ...initialState,
          queue: [
            {
              id: "a",
              message: "foo",
              buttonText: "bar",
              useSpinner: true
            },
            {
              id: "c",
              message: "message c",
              buttonText: "",
              useSpinner: false
            }
          ]
        },
        closeTopToast()
      )
    ).toEqual({
      ...initialState,
      queue: [
        { id: "a", message: "", buttonText: "", useSpinner: false },
        { id: "c", message: "message c", buttonText: "", useSpinner: false }
      ]
    })
  })

  it("closing top toast does nothing when the queue is empty", () => {
    expect(
      toastsReducer(
        {
          ...initialState,
          queue: []
        },
        closeTopToast()
      )
    ).toEqual({
      ...initialState,
      queue: []
    })
  })

  it("can shift out the top toast", () => {
    expect(
      toastsReducer(
        {
          ...initialState,
          queue: [
            { id: "a", message: "foo", buttonText: "bar" },
            { id: "c", message: "message c", buttonText: "" }
          ]
        },
        shiftToasts()
      )
    ).toEqual({
      ...initialState,
      queue: [{ id: "c", message: "message c", buttonText: "" }]
    })
  })
})

describe("toastEpic", () => {
  const valueMap = {
    a: sendToast("a", "toast a", "bar"),
    b: sendToast("b", "toast b"),
    c: closeTopToast({ withAction: false }),
    d: closeTopToast({ withAction: true }),
    x: toastClosed("a", { withAction: false }),
    y: toastClosed("a", { withAction: true }),
    s: shiftToasts()
  }

  it("does nothing when given a non-empty queue from a send action", () => {
    testEpic({
      epic: toastEpic,
      inputted: "-a--",
      expected: "----",
      valueMap,
      getState: () => ({ toasts: { queue: [{}, {}] } })
    })
  })

  it("does nothing when given an empty queue from a shift action", () => {
    testEpic({
      epic: toastEpic,
      inputted: "-s--",
      expected: "----",
      valueMap,
      getState: () => ({ toasts: { queue: [] } })
    })
  })

  it("sends a clear toast and then a shift toasts action when sent a toast", () => {
    testEpic({
      epic: toastEpic,
      inputted: "-a---------------",
      expected: "-----------(cx)-s",
      valueMap,
      getState: () => ({ toasts: { queue: [{ id: "a" }] } })
    })
  })

  it("sends a clear toast and then a shift toasts action when sent a shift", () => {
    testEpic({
      epic: toastEpic,
      inputted: "-s---------------",
      expected: "-----------(cx)-s",
      valueMap,
      getState: () => ({ toasts: { queue: [{ id: "a" }] } })
    })
  })

  it("doesn't send another close action when closed early", () => {
    testEpic({
      epic: toastEpic,
      inputted: "-a--c-----",
      expected: "----x----s",
      valueMap,
      getState: () => ({ toasts: { queue: [{ id: "a" }] } })
    })
  })

  it("acknowledges closure with action", () => {
    testEpic({
      epic: toastEpic,
      inputted: "-a--d-----",
      expected: "----y----s",
      valueMap,
      getState: () => ({ toasts: { queue: [{ id: "a" }] } })
    })
  })

  it("acknowledges closure with action in the second half of its life", () => {
    testEpic({
      epic: toastEpic,
      inputted: "-a-------d-----",
      expected: "---------y----s",
      valueMap,
      getState: () => ({ toasts: { queue: [{ id: "a" }] } })
    })
  })

  it("ignores more than one clear toast action", () => {
    testEpic({
      epic: toastEpic,
      inputted: "-a--c--c--",
      expected: "----x----s",
      valueMap,
      getState: () => ({ toasts: { queue: [{ id: "a" }] } })
    })
  })

  it("can clear in the second half of the toast's life", () => {
    testEpic({
      epic: toastEpic,
      inputted: "-a------c-----",
      expected: "--------x----s",
      valueMap,
      getState: () => ({ toasts: { queue: [{ id: "a" }] } })
    })
  })

  it("clears toast early when sent another toast", () => {
    testEpic({
      epic: toastEpic,
      inputted: "-a-b--------",
      expected: "------(cx)-s",
      valueMap,
      getState: jest
        .fn()
        .mockReturnValueOnce({ toasts: { queue: [{ id: "a" }] } })
        .mockReturnValue({ toasts: { queue: [{ id: "a" }, { id: "b" }] } })
    })
  })

  it("clears toast early when toast has a spinner", () => {
    testEpic({
      epic: toastEpic,
      inputted: "-a----------",
      expected: "------(cx)-s",
      valueMap: {
        ...valueMap,
        a: sendToast("a", "foo", "", { useSpinner: true })
      },
      getState: jest
        .fn()
        .mockReturnValueOnce({ toasts: { queue: [{ id: "a" }] } })
        .mockReturnValue({ toasts: { queue: [{ id: "a" }, { id: "b" }] } })
    })
  })

  it("extends a toast's lifetime when updated", () => {
    testEpic({
      epic: toastEpic,
      inputted: "-a---a----------",
      expected: "---------------(cx)-s",
      valueMap,
      getState: () => ({ toasts: { queue: [{ id: "a" }] } })
    })
  })

  it("extends a toast's lifetime when updated multiple times", () => {
    testEpic({
      epic: toastEpic,
      inputted: "-a---a---a---------------",
      expected: "-------------------(cx)-s",
      valueMap,
      getState: () => ({ toasts: { queue: [{ id: "a" }] } })
    })
  })

  it("extends a toast's lifetime when updated in the second half of its life", () => {
    testEpic({
      epic: toastEpic,
      inputted: "-a-------a---------------",
      expected: "-------------------(cx)-s",
      valueMap,
      getState: () => ({ toasts: { queue: [{ id: "a" }] } })
    })
  })
})
