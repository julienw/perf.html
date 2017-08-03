// Comes from https://github.com/facebook/flow/commit/ec232b16b0958b5c89c74c45d7235e3dd9e433a5
// To be removed once we upgrade flow to a version that contains this commit.

declare class DOMRectReadOnly {
  x: number,
  y: number,
  width: number,
  height: number,
  top: number,
  right: number,
  bottom: number,
  left: number,
  constructor(x: number, y: number, width: number, height: number): void,
  static fromRect(rectangle?: {
    x?: number,
    y?: number,
    width?: number,
    height?: number,
  }): DOMRect,
}

declare class DOMRect extends DOMRectReadOnly {
  constructor(x?: number, y?: number, width?: number, height?: number): void,
}
