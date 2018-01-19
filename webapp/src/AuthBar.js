import React from "react"
import { connect } from "react-redux"
import DialogComponent from "./Dialog"
import TextButton from "./TextButton"
import {
  getAuthToken,
  getAuthDialog,
  openAuthDialog,
  changeAuthDialog,
  submitAuthDialog,
  closeAuthDialog
} from "./store/auth"
import "./AuthBar.css"
import classnames from "classnames"

export const withEnhancers = connect(
  state => {
    const { isOpen, email, password } = getAuthDialog(state)
    return {
      isSignedIn: !!getAuthToken(state),
      dialogIsOpen: isOpen,
      email,
      password
    }
  },
  {
    onOpenClick: openAuthDialog,
    onEmailChange: email => changeAuthDialog({ email }),
    onPasswordChange: password => changeAuthDialog({ password }),
    onSubmit: submitAuthDialog,
    onCancel: closeAuthDialog
  }
)

export const AuthBar = ({
  Dialog = DialogComponent,
  isSignedIn,
  dialogIsOpen,
  email,
  password,
  onOpenClick,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  className,
  onCancel
}) => (
  <div
    className={classnames(
      className,
      "AuthBar",
      isSignedIn && "AuthBar-signedIn"
    )}
  >
    <TextButton className="AuthBar-openButton" onClick={onOpenClick}>
      <div className="AuthBar-openButtonIcon" />
      {isSignedIn ? email : "Sign Up or Log In"}
    </TextButton>

    <Dialog className="AuthBar-dialog" open={dialogIsOpen} onCancel={onCancel}>
      <input
        type="email"
        className="AuthBar-emailInput"
        value={email}
        placeholder="Email"
        onChange={ev => onEmailChange(ev.currentTarget.value)}
      />
      <input
        type="password"
        className="AuthBar-passwordInput"
        value={password}
        placeholder="Password"
        onChange={ev => onPasswordChange(ev.currentTarget.value)}
      />

      <div className="AuthBar-controls">
        <TextButton className="AuthBar-cancel" type="reset" onClick={onCancel}>
          Cancel
        </TextButton>
        <span />
        <TextButton className="AuthBar-submit" type="submit" onClick={onSubmit}>
          Sign In
        </TextButton>
      </div>
    </Dialog>
  </div>
)

export default withEnhancers(AuthBar)
