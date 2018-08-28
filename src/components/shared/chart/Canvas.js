/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow
import * as React from 'react';
import { timeCode } from '../../../utils/time-code';
import classNames from 'classnames';
import Tooltip from '../Tooltip';

import type { CssPixels, DevicePixels } from '../../../types/units';

type Props<HoveredItem> = {
  containerWidth: CssPixels,
  containerHeight: CssPixels,
  className: string,
  onMouseDown?: (HoveredItem | null) => void,
  onDoubleClickItem: (HoveredItem | null) => void,
  getHoveredItemInfo: HoveredItem => React.Node,
  drawCanvas: (CanvasRenderingContext2D, HoveredItem | null) => void,
  isDragging: boolean,
  hitTest: (x: CssPixels, y: CssPixels) => HoveredItem | null,
};

// The naming of the X and Y coordinates here correspond to the ones
// found on the MouseEvent interface.
type State<HoveredItem> = {
  hoveredItem: HoveredItem | null,
  pageX: CssPixels,
  pageY: CssPixels,
};

require('./Canvas.css');

// This isn't a PureComponent on purpose: we always want to update if the parent updates
// But we still conditionally update the canvas itself, see componentDidUpdate.
export default class ChartCanvas<HoveredItem> extends React.Component<
  Props<HoveredItem>,
  State<HoveredItem>
> {
  _devicePixelRatio: number = 1;
  _offsetX: CssPixels = 0;
  _offsetY: CssPixels = 0;
  _ctx: CanvasRenderingContext2D;
  _canvas: HTMLCanvasElement | null = null;
  _isDrawScheduled: boolean = false;

  state: State<HoveredItem> = {
    hoveredItem: null,
    pageX: 0,
    pageY: 0,
  };

  _scheduleDraw() {
    const { className, drawCanvas } = this.props;
    if (this._isDrawScheduled) {
      return;
    }
    this._isDrawScheduled = true;
    window.requestAnimationFrame(() => {
      this._isDrawScheduled = false;
      if (this._canvas) {
        timeCode(`${className} render`, () => {
          this._prepCanvas();
          drawCanvas(this._ctx, this.state.hoveredItem);
        });
      }
    });
  }

  _prepCanvas() {
    const canvas = this._canvas;
    const { containerWidth, containerHeight } = this.props;
    const { devicePixelRatio } = window;
    const pixelWidth: DevicePixels = containerWidth * devicePixelRatio;
    const pixelHeight: DevicePixels = containerHeight * devicePixelRatio;
    if (!canvas) {
      return;
    }
    // Satisfy the null check for Flow.
    const ctx = this._ctx || canvas.getContext('2d', { alpha: false });
    if (!this._ctx) {
      this._ctx = ctx;
    }
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      canvas.style.width = containerWidth + 'px';
      canvas.style.height = containerHeight + 'px';
      ctx.scale(this._devicePixelRatio, this._devicePixelRatio);
    }
    if (this._devicePixelRatio !== devicePixelRatio) {
      // Make sure and multiply by the inverse of the previous ratio, as the scaling
      // operates off of the previous set scale.
      const scale = (1 / this._devicePixelRatio) * devicePixelRatio;
      ctx.scale(scale, scale);
      this._devicePixelRatio = devicePixelRatio;
    }
  }

  _onMouseDown = () => {
    if (this.props.onMouseDown) {
      this.props.onMouseDown(this.state.hoveredItem);
    }
  };

  _onMouseMove = (
    event: { nativeEvent: MouseEvent } & SyntheticMouseEvent<>
  ) => {
    if (!this._canvas) {
      return;
    }

    this._offsetX = event.nativeEvent.offsetX;
    this._offsetY = event.nativeEvent.offsetY;
    const maybeHoveredItem = this.props.hitTest(this._offsetX, this._offsetY);

    if (maybeHoveredItem !== null) {
      this.setState({
        hoveredItem: maybeHoveredItem,
        pageX: event.pageX,
        pageY: event.pageY,
      });
    } else if (this.state.hoveredItem !== null) {
      this.setState({
        hoveredItem: null,
      });
    }
  };

  _onMouseOut = () => {
    if (this.state.hoveredItem !== null) {
      this.setState({ hoveredItem: null });
    }
  };

  _onDoubleClick = () => {
    this.props.onDoubleClickItem(this.state.hoveredItem);
  };

  _getHoveredItemInfo = (): React.Node => {
    const { hoveredItem } = this.state;
    if (hoveredItem === null) {
      return null;
    }
    return this.props.getHoveredItemInfo(hoveredItem);
  };

  _takeCanvasRef = (canvas: HTMLCanvasElement | null) => {
    this._canvas = canvas;
  };

  componentWillReceiveProps() {
    // It is possible that the data backing the chart has been
    // changed, for instance after symbolication. Clear the
    // hoveredItem if the mouse no longer hovers over it.
    const { hoveredItem } = this.state;
    if (
      hoveredItem !== null &&
      !hoveredItemsAreEqual(
        this.props.hitTest(this._offsetX, this._offsetY),
        hoveredItem
      )
    ) {
      this.setState({ hoveredItem: null });
    }
  }

  componentDidUpdate(
    prevProps: Props<HoveredItem>,
    prevState: State<HoveredItem>
  ) {
    if (
      prevProps !== this.props ||
      !hoveredItemsAreEqual(prevState.hoveredItem, this.state.hoveredItem)
    ) {
      this._scheduleDraw();
    }
  }

  render() {
    const { isDragging } = this.props;
    const { hoveredItem, pageX, pageY } = this.state;

    const className = classNames({
      chartCanvas: true,
      [this.props.className]: true,
      hover: hoveredItem !== null,
    });

    const tooltipContents = this._getHoveredItemInfo();

    return (
      <div>
        <canvas
          className={className}
          ref={this._takeCanvasRef}
          onMouseDown={this._onMouseDown}
          onMouseMove={this._onMouseMove}
          onMouseOut={this._onMouseOut}
          onDoubleClick={this._onDoubleClick}
        />
        {!isDragging && tooltipContents ? (
          <Tooltip mouseX={pageX} mouseY={pageY}>
            {tooltipContents}
          </Tooltip>
        ) : null}
      </div>
    );
  }
}

/**
 * Check for shallow equality for objects, and strict equality for everything else.
 */
function hoveredItemsAreEqual(a: any, b: any) {
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.length !== b.length) {
      return false;
    }
    let hasAllKeys = true;
    for (const aKey in a) {
      let hasKey = false;
      for (const bKey in b) {
        if (aKey === bKey) {
          if (a[aKey] !== b[bKey]) {
            return false;
          }
          hasKey = true;
          break;
        }
      }
      hasAllKeys = hasAllKeys && hasKey;
      if (!hasAllKeys) {
        return false;
      }
    }
    return true;
  }
  return a === b;
}
