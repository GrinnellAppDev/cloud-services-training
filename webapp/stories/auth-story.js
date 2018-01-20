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
  .add("dialog open", () => (
    <AuthBar
      isSignedIn={false}
      dialogIsOpen={true}
      email=""
      password=""
      onEmailChange={action("email change")}
      onPasswordChange={action("password change")}
      onSubmit={action("submit")}
      onCancel={action("cancel")}
    />
  ))
  .add("dialog with partial text", () => (
    <AuthBar
      isSignedIn={false}
      dialogIsOpen={true}
      email="user@"
      password="string pa"
      onEmailChange={action("email change")}
      onPasswordChange={action("password change")}
      onSubmit={action("submit")}
      onCancel={action("cancel")}
    />
  ))
  .add("dialog with text", () => (
    <AuthBar
      isSignedIn={false}
      dialogIsOpen={true}
      email="user@example.com"
      password="string password"
      onEmailChange={action("email change")}
      onPasswordChange={action("password change")}
      onSubmit={action("submit")}
      onCancel={action("cancel")}
    />
  ))
  .add("dialog submitting", () => (
    <AuthBar
      isSignedIn={false}
      dialogIsOpen={true}
      isSubmitting={true}
      email="user@example.com"
      password="string password"
      onEmailChange={action("email change")}
      onPasswordChange={action("password change")}
      onSubmit={action("submit")}
      onCancel={action("cancel")}
    />
  ))
