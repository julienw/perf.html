/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow

import * as React from 'react';
import classNames from 'classnames';

require('./ButtonWithPanel.css');

interface Panel {
  props: {
    onOpen?: () => mixed,
    onClose?: () => mixed,
  },
  open(): mixed,
}

type Props<P> = {
  className: string,
  label: string,
  panel: P,
  open?: boolean,
};

type State = {|
  open: boolean,
|};

class ButtonWithPanel<
  P: React.Element<any> & Panel
> extends React.PureComponent<Props<P>, State> {
  _panel: P | null;

  _onPanelOpen: () => void;
  _onPanelClose: () => void;
  _panelCreated: (P | null) => void;

  constructor(props: Props<P>) {
    super(props);
    this.state = { open: !!props.open };
    this._onPanelOpen = () => {
      this.setState({ open: true });
      if (this.props.panel.props.onOpen) {
        this.props.panel.props.onOpen();
      }
    };
    this._onPanelClose = () => {
      this.setState({ open: false });
      if (this.props.panel.props.onClose) {
        this.props.panel.props.onClose();
      }
    };
    (this: any)._onButtonClick = this._onButtonClick.bind(this);
    this._panelCreated = (panel: P | null) => {
      this._panel = panel;
    };
  }

  componentWillReceiveProps(props: Props<P>) {
    if (props.open !== this.props.open) {
      this.setState({ open: !!props.open });
    }
  }

  openPanel() {
    if (this._panel) {
      this._panel.open();
    }
  }

  _onButtonClick() {
    this.openPanel();
  }

  render() {
    const { className, label, panel } = this.props;
    const { open } = this.state;
    return (
      <div className={classNames('buttonWithPanel', className, { open })}>
        <div className="buttonWithPanelButtonWrapper">
          <input
            type="button"
            className={classNames(
              'buttonWithPanelButton',
              `${className}Button`
            )}
            value={label}
            onClick={this._onButtonClick}
          />
        </div>
        {React.cloneElement(panel, {
          ref: this._panelCreated,
          onOpen: this._onPanelOpen,
          onClose: this._onPanelClose,
        })}
      </div>
    );
  }
}

export default ButtonWithPanel;
