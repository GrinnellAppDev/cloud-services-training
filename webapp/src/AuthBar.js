import React from "react"
import { connect } from "react-redux"
import Dialog from "./Dialog"
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
import LoadingSpinner from "./LoadingSpinner"

export const withEnhancers = connect(
  state => {
    const { isOpen, isSubmitting, email, password } = getAuthDialog(state)
    return {
      isSignedIn: !!getAuthToken(state),
      dialogIsOpen: isOpen,
      isSubmitting,
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
  isSignedIn,
  dialogIsOpen,
  isSubmitting,
  email,
  authorizedName,
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
      {isSignedIn ? authorizedName : "Sign Up or Log In"}
    </TextButton>

    <Dialog
      className={classnames(
        "AuthBar-dialog fixed",
        isSubmitting && "AuthBar-isSubmitting"
      )}
      open={dialogIsOpen}
      onCancel={onCancel}
    >
      <input
        type="email"
        className="AuthBar-emailInput"
        value={email}
        placeholder="Email"
        onChange={ev => onEmailChange(ev.currentTarget.value)}
        disabled={isSubmitting}
      />
      <input
        type="password"
        className="AuthBar-passwordInput"
        value={password}
        placeholder="Password"
        onChange={ev => onPasswordChange(ev.currentTarget.value)}
        disabled={isSubmitting}
      />

      <div className="AuthBar-controls">
        <TextButton className="AuthBar-cancel" type="reset" onClick={onCancel}>
          Cancel
        </TextButton>
        <span />
        {isSubmitting && <LoadingSpinner className="AuthBar-loading" />}
        <TextButton
          className="AuthBar-submit"
          type="submit"
          disabled={isSubmitting}
          onClick={onSubmit}
        >
          Sign In
        </TextButton>
      </div>
    </Dialog>
  </div>
)

export default withEnhancers(AuthBar)
