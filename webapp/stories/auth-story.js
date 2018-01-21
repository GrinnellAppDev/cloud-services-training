import React from "react"
import { storiesOf } from "@storybook/react"
import { action } from "@storybook/addon-actions"
import { AuthBar } from "../src/AuthBar"

storiesOf("AuthBar", module)
  .add("signed out", () => (
    <AuthBar isSignedIn={false} onOpenClick={action("open")} />
  ))
  .add("signed in no name", () => (
    <AuthBar isSignedIn={true} onSignOut={action("sign out")} />
  ))
  .add("signed in", () => (
    <AuthBar
      isSignedIn={true}
      displayName="Johanna Smith"
      onSignOut={action("sign out")}
    />
  ))
  .add("dialog new user", () => (
    <AuthBar
      isSignedIn={false}
      dialogIsOpen={true}
      hasAccount={false}
      onEmailChange={action("email change")}
      onPasswordChange={action("password change")}
      onSubmit={action("submit")}
      onCancel={action("cancel")}
    />
  ))
  .add("dialog sign in", () => (
    <AuthBar
      isSignedIn={false}
      dialogIsOpen={true}
      hasAccount={true}
      onEmailChange={action("email change")}
      onPasswordChange={action("password change")}
      onSubmit={action("submit")}
      onCancel={action("cancel")}
    />
  ))
  .add("dialog new user submitting", () => (
    <AuthBar
      isSignedIn={false}
      dialogIsOpen={true}
      hasAccount={false}
      isSubmitting={true}
      email="user@example.com"
      password="string password"
      onEmailChange={action("email change")}
      onPasswordChange={action("password change")}
      onSubmit={action("submit")}
      onCancel={action("cancel")}
    />
  ))
  .add("dialog signing in", () => (
    <AuthBar
      isSignedIn={false}
      dialogIsOpen={true}
      hasAccount={true}
      isSubmitting={true}
      email="user@example.com"
      password="string password"
      onEmailChange={action("email change")}
      onPasswordChange={action("password change")}
      onSubmit={action("submit")}
      onCancel={action("cancel")}
    />
  ))
  .add("dialog with error", () => (
    <AuthBar
      isSignedIn={false}
      dialogIsOpen={true}
      hasAccount={true}
      errorMessage="Couldn't sign in. Server error."
      onEmailChange={action("email change")}
      onPasswordChange={action("password change")}
      onSubmit={action("submit")}
      onCancel={action("cancel")}
    />
  ))
