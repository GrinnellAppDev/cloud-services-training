import React from "react"
import { AuthBar, withEnhancers } from "./AuthBar"
import { shallow } from "enzyme"
import configureMockStore from "redux-mock-store"
import { Provider } from "react-redux"
import { render } from "react-dom"
import {
  openAuthDialog,
  changeAuthDialog,
  submitAuthDialog,
  closeAuthDialog
} from "./store/auth"

describe("withEnhancers", () => {
  const createMockStore = configureMockStore()

  it("sets isSignedIn true when there is a token", () => {
    const store = createMockStore({
      auth: { dialog: {}, token: "foo" }
    })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls[0][0].isSignedIn).toBe(true)
  })

  it("sets isSignedIn false when there is no token", () => {
    const store = createMockStore({
      auth: { dialog: {}, token: null }
    })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls[0][0].isSignedIn).toBe(false)
  })

  it("loads dialog state", () => {
    const store = createMockStore({
      auth: { dialog: { isOpen: true, email: "foo", password: "bar" } }
    })

    const Component = jest.fn().mockReturnValue(<div />)
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component.mock.calls[0][0].dialogIsOpen).toBe(true)
    expect(Component.mock.calls[0][0].email).toBe("foo")
    expect(Component.mock.calls[0][0].password).toBe("bar")
  })

  it("handles open click", () => {
    const store = createMockStore({
      auth: { dialog: {} }
    })

    const Component = jest.fn().mockImplementation(props => {
      props.onOpenClick({})
      return <div />
    })
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component).toBeCalled()
    expect(store.getActions()).toEqual([openAuthDialog()])
  })

  it("handles email change", () => {
    const store = createMockStore({
      auth: { dialog: {} }
    })

    const Component = jest.fn().mockImplementation(props => {
      props.onEmailChange("foo")
      return <div />
    })
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component).toBeCalled()
    expect(store.getActions()).toEqual([changeAuthDialog({ email: "foo" })])
  })

  it("handles password change", () => {
    const store = createMockStore({
      auth: { dialog: {} }
    })

    const Component = jest.fn().mockImplementation(props => {
      props.onPasswordChange("foo")
      return <div />
    })
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component).toBeCalled()
    expect(store.getActions()).toEqual([changeAuthDialog({ password: "foo" })])
  })

  it("handles submit", () => {
    const store = createMockStore({
      auth: { dialog: {} }
    })

    const Component = jest.fn().mockImplementation(props => {
      props.onSubmit("foo")
      return <div />
    })
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component).toBeCalled()
    expect(store.getActions()).toEqual([submitAuthDialog()])
  })

  it("handles cancel", () => {
    const store = createMockStore({
      auth: { dialog: {} }
    })

    const Component = jest.fn().mockImplementation(props => {
      props.onCancel()
      return <div />
    })
    const Wrapped = withEnhancers(Component)

    render(
      <Provider store={store}>
        <Wrapped />
      </Provider>,
      document.createElement("div")
    )

    expect(Component).toBeCalled()
    expect(store.getActions()).toEqual([closeAuthDialog()])
  })
})

describe("AuthBar", () => {
  const Dialog = props => <dialog {...props} />

  it("prompts to login or sign up when not signed in", () => {
    expect(
      shallow(<AuthBar Dialog={Dialog} isSignedIn={false} />)
        .find(".AuthBar-openButton")
        .contains("Sign Up or Log In")
    ).toBe(true)
  })

  it("displays their email when signed in", () => {
    expect(
      shallow(
        <AuthBar Dialog={Dialog} isSignedIn={true} email="foo@bar.com" />
      ).contains("foo@bar.com")
    ).toBe(true)
  })

  it("opens the dialog", () => {
    expect(
      shallow(<AuthBar Dialog={Dialog} dialogIsOpen={true} />)
        .find(Dialog)
        .prop("open")
    ).toBe(true)
  })

  it("shows their email in the email input", () => {
    expect(
      shallow(<AuthBar Dialog={Dialog} dialogIsOpen={true} email="foo" />)
        .find("input[type='email']")
        .prop("value")
    ).toBe("foo")
  })

  it("has their password in the password input", () => {
    expect(
      shallow(<AuthBar Dialog={Dialog} dialogIsOpen={true} password="foo" />)
        .find("input[type='password']")
        .prop("value")
    ).toBe("foo")
  })

  it("handles clicks on the open button", () => {
    const handler = jest.fn()

    shallow(<AuthBar Dialog={Dialog} onOpenClick={handler} />)
      .find(".AuthBar-openButton")
      .simulate("click")

    expect(handler).toBeCalled()
  })

  it("handles email change", () => {
    const handler = jest.fn()

    shallow(
      <AuthBar Dialog={Dialog} dialogIsOpen={true} onEmailChange={handler} />
    )
      .find("input[type='email']")
      .simulate("change", { currentTarget: { value: "foo" } })

    expect(handler).toBeCalledWith("foo")
  })

  it("handles password change", () => {
    const handler = jest.fn()

    shallow(
      <AuthBar Dialog={Dialog} dialogIsOpen={true} onPasswordChange={handler} />
    )
      .find("input[type='password']")
      .simulate("change", { currentTarget: { value: "foo" } })

    expect(handler).toBeCalledWith("foo")
  })

  it("handles submit", () => {
    const handler = jest.fn()

    shallow(<AuthBar Dialog={Dialog} dialogIsOpen={true} onSubmit={handler} />)
      .find("[type='submit']")
      .simulate("click")

    expect(handler).toBeCalled()
  })

  it("handles cancel from dialog", () => {
    const handler = jest.fn()

    shallow(<AuthBar Dialog={Dialog} dialogIsOpen={true} onCancel={handler} />)
      .find(Dialog)
      .simulate("cancel")

    expect(handler).toBeCalled()
  })

  it("handles cancel from button", () => {
    const handler = jest.fn()

    shallow(<AuthBar Dialog={Dialog} dialogIsOpen={true} onCancel={handler} />)
      .find("[type='reset']")
      .simulate("click")

    expect(handler).toBeCalled()
  })
})
