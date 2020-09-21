/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow

import * as React from 'react';
import classNames from 'classnames';

import { ClosePanelContext } from './ClosePanelContext';

import './ConfirmDialog.css';

type Props = {|
  +onCancelButtonClick?: () => mixed,
  +onConfirmButtonClick?: () => mixed,
  +className?: string,
  +title: string,
  +cancelButtonText?: string,
  +confirmButtonText?: string,
  +confirmButtonType?: 'default' | 'primary' | 'destructive',
  +children: React.Node,
|};

type PropsWithClose = {|
  ...Props,
  closePanel: void => mixed,
|};

export class ConfirmDialogImpl extends React.PureComponent<PropsWithClose> {
  _onConfirmButtonClick = () => {
    this.props.closePanel();
    if (this.props.onConfirmButtonClick) {
      this.props.onConfirmButtonClick();
    }
  };

  _onCancelButtonClick = () => {
    this.props.closePanel();
    if (this.props.onCancelButtonClick) {
      this.props.onCancelButtonClick();
    }
  };

  render() {
    const {
      className,
      children,
      title,
      cancelButtonText,
      confirmButtonText,
      confirmButtonType,
    } = this.props;
    return (
      <div className={classNames('confirmDialog', className)}>
        <h2 className="confirmDialogTitle">{title}</h2>
        <div className="confirmDialogContent">{children}</div>
        <div className="confirmDialogButtons">
          <input
            type="button"
            className="photon-button photon-button-default"
            value={cancelButtonText || 'Cancel'}
            onClick={this._onCancelButtonClick}
          />
          <input
            type="button"
            className={`photon-button photon-button-${confirmButtonType ||
              'primary'}`}
            value={confirmButtonText || 'Confirm'}
            onClick={this._onConfirmButtonClick}
          />
        </div>
      </div>
    );
  }
}

export function ConfirmDialog(props: Props) {
  return (
    <ClosePanelContext.Consumer>
      {panelCloseFunction => (
        <ConfirmDialogImpl {...props} closePanel={panelCloseFunction} />
      )}
    </ClosePanelContext.Consumer>
  );
}
