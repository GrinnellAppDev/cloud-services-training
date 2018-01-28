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
  closeAuthDialog,
  clearAuthToken
} from "./store/auth"
import LoadingSpinner from "./LoadingSpinner"

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
      auth: {
        dialog: {
          isOpen: true,
          isSubmitting: false,
          hasAccount: false,
          email: "foo",
          password: "bar",
          errorMessage: "baz"
        }
      }
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
    expect(Component.mock.calls[0][0].isSubmitting).toBe(false)
    expect(Component.mock.calls[0][0].hasAccount).toBe(false)
    expect(Component.mock.calls[0][0].errorMessage).toBe("baz")
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

  it("handles name change", () => {
    const store = createMockStore({
      auth: { dialog: {} }
    })

    const Component = jest.fn().mockImplementation(props => {
      props.onNameChange("foo")
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
    expect(store.getActions()).toEqual([changeAuthDialog({ name: "foo" })])
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

  it("handles hasAccount change", () => {
    const store = createMockStore({
      auth: { dialog: {} }
    })

    const Component = jest.fn().mockImplementation(props => {
      props.onHasAccountChange(true)
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
    expect(store.getActions()).toEqual([changeAuthDialog({ hasAccount: true })])
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

  it("handles sign out", () => {
    const store = createMockStore({
      auth: { dialog: {} }
    })

    const Component = jest.fn().mockImplementation(props => {
      props.onSignOut({})
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
    expect(store.getActions()).toEqual([clearAuthToken()])
  })
})

describe("AuthBar", () => {
  it("prompts to login or sign up when not signed in", () => {
    expect(
      shallow(<AuthBar isSignedIn={false} />)
        .find(".AuthBar-mainButton")
        .contains("Sign Up or Log In")
    ).toBe(true)
  })

  it("prompts to sign out when signed in", () => {
    expect(
      shallow(<AuthBar isSignedIn={true} />)
        .find(".AuthBar-mainButton")
        .contains("Sign Out")
    ).toBe(true)
  })

  it("displays their name when signed in", () => {
    expect(
      shallow(<AuthBar isSignedIn={true} displayName="foo" />).contains("foo")
    ).toBe(true)
  })

  it("opens the dialog", () => {
    expect(
      shallow(<AuthBar dialogIsOpen={true} />)
        .find("Dialog")
        .prop("open")
    ).toBe(true)
  })

  it("shows their name in the name input when not hasAccount", () => {
    expect(
      shallow(<AuthBar dialogIsOpen={true} name="foo" hasAccount={false} />)
        .find("input[type='text']")
        .prop("value")
    ).toBe("foo")
  })

  it("doesn't show name input when hasAccount", () => {
    expect(
      shallow(<AuthBar dialogIsOpen={true} name="foo" hasAccount={true} />)
        .find("input[type='text']")
        .exists()
    ).toBe(false)
  })

  it("shows their email in the email input", () => {
    expect(
      shallow(<AuthBar dialogIsOpen={true} email="foo" />)
        .find("input[type='email']")
        .prop("value")
    ).toBe("foo")
  })

  it("has their password in the password input", () => {
    expect(
      shallow(<AuthBar dialogIsOpen={true} password="foo" />)
        .find("input[type='password']")
        .prop("value")
    ).toBe("foo")
  })

  it("has a checkbox for has account", () => {
    expect(
      shallow(<AuthBar dialogIsOpen={true} hasAccount={true} />)
        .find("Checkbox")
        .prop("checked")
    ).toBe(true)
  })

  it("prompts to sign up when not hasAccount", () => {
    expect(
      shallow(<AuthBar dialogIsOpen={true} hasAccount={false} />).contains(
        "Sign Up"
      )
    ).toBe(true)
  })

  it("prompts to sign in when hasAccount", () => {
    expect(
      shallow(<AuthBar dialogIsOpen={true} hasAccount={true} />).contains(
        "Sign In"
      )
    ).toBe(true)
  })

  it("shows errors", () => {
    expect(
      shallow(<AuthBar dialogIsOpen={true} errorMessage="foo" />).contains(
        "foo"
      )
    ).toBe(true)
  })

  it("doesn't show loading spinner when not submitting", () => {
    expect(
      shallow(
        <AuthBar
          dialogIsOpen={true}
          email="foo"
          password="bar"
          isSubmitting={false}
          isSignedIn={false}
        />
      )
        .find("Dialog")
        .find(LoadingSpinner)
        .exists()
    ).toBe(false)
  })

  describe("while submitting", () => {
    const handler = jest.fn()

    const wrapper = shallow(
      <AuthBar
        dialogIsOpen={true}
        email="foo"
        password="bar"
        isSubmitting={true}
        isSignedIn={false}
      />
    )

    it("locks all inputs", () => {
      expect(wrapper.find("Dialog input").every("[disabled]")).toBe(true)
      expect(wrapper.find("Dialog Checkbox").every("[disabled]")).toBe(true)
    })

    it("locks submit button", () => {
      expect(wrapper.find("Dialog [type='submit']").prop("disabled")).toBe(true)
    })

    it("shows loading spinner", () => {
      expect(
        wrapper
          .find("Dialog")
          .find(LoadingSpinner)
          .exists()
      ).toBe(true)
    })

    it("doesn't lock close button", () => {
      expect(wrapper.find("Dialog [type='reset']").prop("disabled")).toBeFalsy()
    })
  })

  it("handles clicks on the open button", () => {
    const handler = jest.fn()

    shallow(<AuthBar isSignedIn={false} onOpenClick={handler} />)
      .find(".AuthBar-mainButton")
      .simulate("click")

    expect(handler).toBeCalled()
  })

  it("handles clicks on the sign out button", () => {
    const handler = jest.fn()

    shallow(<AuthBar isSignedIn={true} onSignOut={handler} />)
      .find(".AuthBar-mainButton")
      .simulate("click")

    expect(handler).toBeCalled()
  })

  it("handles name change", () => {
    const handler = jest.fn()

    shallow(
      <AuthBar dialogIsOpen={true} hasAccount={false} onNameChange={handler} />
    )
      .find("input[type='text']")
      .simulate("change", { currentTarget: { value: "foo" } })

    expect(handler).toBeCalledWith("foo")
  })

  it("handles email change", () => {
    const handler = jest.fn()

    shallow(<AuthBar dialogIsOpen={true} onEmailChange={handler} />)
      .find("input[type='email']")
      .simulate("change", { currentTarget: { value: "foo" } })

    expect(handler).toBeCalledWith("foo")
  })

  it("handles password change", () => {
    const handler = jest.fn()

    shallow(<AuthBar dialogIsOpen={true} onPasswordChange={handler} />)
      .find("input[type='password']")
      .simulate("change", { currentTarget: { value: "foo" } })

    expect(handler).toBeCalledWith("foo")
  })

  it("handles account checkbox change", () => {
    const handler = jest.fn()

    shallow(<AuthBar dialogIsOpen={true} onHasAccountChange={handler} />)
      .find("Checkbox")
      .simulate("change", { currentTarget: { checked: true } })

    expect(handler).toBeCalledWith(true)
  })

  it("handles submit", () => {
    const handler = jest.fn()

    shallow(<AuthBar dialogIsOpen={true} onSubmit={handler} />)
      .find("[type='submit']")
      .simulate("click")

    expect(handler).toBeCalled()
  })

  it("handles cancel from dialog", () => {
    const handler = jest.fn()

    shallow(<AuthBar dialogIsOpen={true} onCancel={handler} />)
      .find("Dialog")
      .simulate("cancel")

    expect(handler).toBeCalled()
  })

  it("handles cancel from button", () => {
    const handler = jest.fn()

    shallow(<AuthBar dialogIsOpen={true} onCancel={handler} />)
      .find("[type='reset']")
      .simulate("click")

    expect(handler).toBeCalled()
  })
})
