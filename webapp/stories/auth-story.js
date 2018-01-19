import React from "react"
import { storiesOf } from "@storybook/react"
import { action } from "@storybook/addon-actions"
import { AuthBar } from "../src/AuthBar"

storiesOf("AuthBar", module)
  .add("signed out", () => <AuthBar isSignedIn={false} />)
  .add("signed in", () => (
    <AuthBar isSignedIn={true} email="user@example.com" />
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
