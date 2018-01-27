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
      hasAccount,
      email,
      password,
      errorMessage
    } = getAuthDialog(state)

    return {
      isSignedIn: !!getAuthToken(state),
      dialogIsOpen: isOpen,
      isSubmitting,
      hasAccount,
      email,
      password,
      errorMessage
    }
  },
  {
    onOpenClick: openAuthDialog,
    onNameChange: name => changeAuthDialog({ name }),
    onEmailChange: email => changeAuthDialog({ email }),
    onPasswordChange: password => changeAuthDialog({ password }),
    onHasAccountChange: hasAccount => changeAuthDialog({ hasAccount }),
    onSubmit: submitAuthDialog,
    onCancel: closeAuthDialog,
    onSignOut: clearAuthToken
  }
)

export const AuthBar = ({
  isSignedIn,
  dialogIsOpen,
  isSubmitting,
  hasAccount,
  displayName,
  name,
  email,
  password,
  errorMessage,
  onOpenClick,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onHasAccountChange,
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
      displayName && (
        <span className="AuthBar-displayName">
          <svg className="AuthBar-displayNameIcon" viewBox="0 0 24 24">
            <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
          </svg>
          {displayName}
        </span>
      )}
    <TextButton
      className="AuthBar-mainButton"
      onClick={isSignedIn ? onSignOut : onOpenClick}
    >
      {isSignedIn ? "Sign Out" : "Sign Up or Log In"}
    </TextButton>

    <Dialog
      className={classnames(
        "AuthBar-dialog",
        isSubmitting && "AuthBar-isSubmitting"
      )}
      open={dialogIsOpen}
      onCancel={onCancel}
    >
      {errorMessage && (
        <div className="AuthBar-errorMessage">{errorMessage}</div>
      )}

      {!hasAccount && (
        <input
          type="text"
          className="AuthBar-nameInput AuthBar-input"
          value={name}
          placeholder="Name (Optional)"
          onChange={ev => onNameChange(ev.currentTarget.value)}
          disabled={isSubmitting}
        />
      )}
      <input
        type="email"
        className="AuthBar-emailInput AuthBar-input"
        value={email}
        placeholder="Email"
        onChange={ev => onEmailChange(ev.currentTarget.value)}
        disabled={isSubmitting}
      />
      <input
        type="password"
        className="AuthBar-passwordInput AuthBar-input"
        value={password}
        placeholder="Password"
        onChange={ev => onPasswordChange(ev.currentTarget.value)}
        disabled={isSubmitting}
      />

      <label className="AuthBar-hasAccount">
        <input
          type="checkbox"
          className="AuthBar-hasAccountCheckbox"
          checked={hasAccount}
          onChange={ev => onHasAccountChange(ev.currentTarget.checked)}
          disabled={isSubmitting}
        />
        <span>I already have an account</span>
      </label>

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
          {hasAccount ? "Sign In" : "Sign Up"}
        </TextButton>
      </div>
    </Dialog>
  </div>
)

export default withEnhancers(AuthBar)
