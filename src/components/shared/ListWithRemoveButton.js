/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow
import React, { PureComponent } from 'react';
import classNames from 'classnames';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import './ListWithRemoveButton.css';

// This function expects an input string where one visible character == one
// character in the string.
function shortenText(text: string, charCount: number): string {
  if (text.length <= charCount) {
    return text;
  }

  return text.slice(0, charCount - 1) + '…';
}

type Props = {|
  +className?: string,
  +items: string[],
  +buttonTitle: string,
  +onItemRemove: number => mixed,
|};

export default class ListWithRemoveButton extends PureComponent {
  props: Props;

  constructor(props: Props) {
    super(props);

    (this: any)._onRemoveButtonMouseDown = this._onRemoveButtonMouseDown.bind(
      this
    );
  }

  // We use the mousedown event so that we can avoid that the input loses the focus.
  _onRemoveButtonMouseDown(
    e: SyntheticMouseEvent & { currentTarget: HTMLButtonElement }
  ) {
    e.preventDefault(); // prevents losing the focus
    this.props.onItemRemove(+e.currentTarget.dataset.index);
  }

  render() {
    const { className, items, buttonTitle } = this.props;

    const classes = classNames('listWithRemoveButton', className);

    // We always render the 2 states to the DOM but only display one of them
    // using CSS.
    // Note: the tabIndex attribute makes the div focusable, and therefore the
    // FocusEvent's relatedTarget is properly set
    return (
      <div className={classes} tabIndex="-1">
        <TransitionGroup className="listWithRemoveButton_full">
          {items.map((item, i) =>
            <CSSTransition
              key={i}
              classNames="listWithRemoveButton_full_transition"
              timeout={300}
            >
              <div className="listWithRemoveButton_full-itemBox">
                <div className="listWithRemoveButton_full-item">
                  {shortenText(item, 50)}
                </div>
                <button
                  className="listWithRemoveButton_full-button"
                  title={buttonTitle}
                  aria-label={buttonTitle}
                  data-index={i}
                  type="button"
                  onMouseDown={this._onRemoveButtonMouseDown}
                >
                  ✕
                </button>
              </div>
            </CSSTransition>
          )}
        </TransitionGroup>
      </div>
    );
  }
}
