// Spec: AR-004, AR-008
export interface IdGenerator {
  /** Returns a new UUID v4 string. */
  next(): string;
}
