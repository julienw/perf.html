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

type State<HoveredItem> = {
  hoveredItem: HoveredItem | null,
  mouseX: CssPixels,
  mouseY: CssPixels,
};

require('./Canvas.css');

// This isn't a PureComponent on purpose: we always want to update if the parent updates
// But we still conditionally update the canvas itself, see componentDidUpdate.
export default class ChartCanvas<HoveredItem> extends React.Component<
  Props<HoveredItem>,
  State<HoveredItem>
> {
  _devicePixelRatio: number;
  _ctx: CanvasRenderingContext2D;
  _canvas: HTMLCanvasElement | null;

  constructor(props: Props<HoveredItem>) {
    super(props);
    this._devicePixelRatio = 1;
    this.state = {
      hoveredItem: null,
      mouseX: 0,
      mouseY: 0,
    };

    (this: any)._setCanvasRef = this._setCanvasRef.bind(this);
    (this: any)._onMouseDown = this._onMouseDown.bind(this);
    (this: any)._onMouseMove = this._onMouseMove.bind(this);
    (this: any)._onMouseOut = this._onMouseOut.bind(this);
    (this: any)._onDoubleClick = this._onDoubleClick.bind(this);
    (this: any)._getHoveredItemInfo = this._getHoveredItemInfo.bind(this);
  }

  _scheduleDraw() {
    const { className, drawCanvas } = this.props;
    window.requestAnimationFrame(() => {
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
      const scale = 1 / this._devicePixelRatio * devicePixelRatio;
      ctx.scale(scale, scale);
      this._devicePixelRatio = devicePixelRatio;
    }
  }

  _hoveredItemFromMouseEvent(event: SyntheticMouseEvent<>): HoveredItem | null {
    if (!this._canvas) {
      throw new Error('Canvas ref not set');
    }

    const rect = this._canvas.getBoundingClientRect();
    const x: CssPixels = event.pageX - rect.left;
    const y: CssPixels = event.pageY - rect.top;

    return this.props.hitTest(x, y);
  }

  _onMouseDown(event: SyntheticMouseEvent<>) {
    if (!this._canvas || !this.props.onMouseDown) {
      return;
    }

    const maybeHoveredItem =
      this.state.hoveredItem === null
        ? this._hoveredItemFromMouseEvent(event)
        : this.state.hoveredItem;
    this.props.onMouseDown(maybeHoveredItem);
  }

  _onMouseMove(event: SyntheticMouseEvent<>) {
    if (!this._canvas) {
      return;
    }

    const maybeHoveredItem = this._hoveredItemFromMouseEvent(event);

    if (maybeHoveredItem !== null) {
      this.setState({
        hoveredItem: maybeHoveredItem,
        mouseX: event.pageX,
        mouseY: event.pageY,
      });
    } else if (this.state.hoveredItem !== null) {
      this.setState({
        hoveredItem: null,
      });
    }
  }

  _onMouseOut() {
    if (this.state.hoveredItem !== null) {
      this.setState({ hoveredItem: null });
    }
  }

  _onDoubleClick(event: SyntheticMouseEvent<>) {
    if (!this._canvas) {
      return;
    }

    const maybeHoveredItem =
      this.state.hoveredItem === null
        ? this._hoveredItemFromMouseEvent(event)
        : this.state.hoveredItem;
    this.props.onDoubleClickItem(maybeHoveredItem);
  }

  _getHoveredItemInfo(): React.Node {
    const { hoveredItem } = this.state;
    if (hoveredItem === null) {
      return null;
    }
    return this.props.getHoveredItemInfo(hoveredItem);
  }

  _setCanvasRef(canvas: HTMLCanvasElement | null) {
    this._canvas = canvas;
  }

  componentWillReceiveProps() {
    // It is possible that the data backing the chart has been
    // changed, for instance after symbolication. Clear hoveredItem so
    // that it doesn't point to possibly invalid data.
    if (this.state.hoveredItem !== null) {
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
    const { hoveredItem, mouseX, mouseY } = this.state;

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
          ref={this._setCanvasRef}
          onMouseDown={this._onMouseDown}
          onMouseMove={this._onMouseMove}
          onMouseOut={this._onMouseOut}
          onDoubleClick={this._onDoubleClick}
        />
        {!isDragging && tooltipContents ? (
          <Tooltip mouseX={mouseX} mouseY={mouseY}>
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
