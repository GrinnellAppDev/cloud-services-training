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
  closeAuthDialog,
  clearAuthToken
} from "./store/auth"
import "./AuthBar.css"
import classnames from "classnames"
import LoadingSpinner from "./LoadingSpinner"

export const withEnhancers = connect(
  state => {
    const {
      isOpen,
      isSubmitting,
      email,
      password,
      errorMessage
    } = getAuthDialog(state)

    return {
      isSignedIn: !!getAuthToken(state),
      dialogIsOpen: isOpen,
      isSubmitting,
      email,
      password,
      errorMessage
    }
  },
  {
    onOpenClick: openAuthDialog,
    onEmailChange: email => changeAuthDialog({ email }),
    onPasswordChange: password => changeAuthDialog({ password }),
    onSubmit: submitAuthDialog,
    onCancel: closeAuthDialog,
    onSignOut: clearAuthToken
  }
)

export const AuthBar = ({
  isSignedIn,
  dialogIsOpen,
  isSubmitting,
  email,
  displayName,
  password,
  errorMessage,
  onOpenClick,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onSignOut,
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
    {isSignedIn &&
      displayName && <span className="AuthBar-displayName">{displayName}</span>}
    <TextButton
      className="AuthBar-mainButton"
      onClick={isSignedIn ? onSignOut : onOpenClick}
    >
      {isSignedIn ? "Sign Out" : "Sign Up or Log In"}
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

      {errorMessage && (
        <div className="AuthBar-errorMessage">{errorMessage}</div>
      )}

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
