// Comes from https://github.com/facebook/flow/commit/ec232b16b0958b5c89c74c45d7235e3dd9e433a5
// To be removed once we upgrade flow to a version that contains this commit.

declare type IntersectionObserverEntry = {
  boundingClientRect: DOMRectReadOnly,
  intersectionRatio: number,
  intersectionRect: DOMRectReadOnly,
  isIntersecting: boolean,
  rootBounds: DOMRectReadOnly,
  target: HTMLElement,
  time: DOMHighResTimeStamp,
};

declare type IntersectionObserverCallback = (
  entries: Array<IntersectionObserverEntry>,
  observer: IntersectionObserver
) => any;

declare type IntersectionObserverOptions = {
  root?: Node | null,
  rootMargin?: string,
  threshold?: number | Array<number>,
};

declare class IntersectionObserver {
  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverOptions
  ): void,
  observe(target: HTMLElement): void,
  unobserve(): void,
  takeRecords(): Array<IntersectionObserverEntry>,
  disconnect(): void,
}
