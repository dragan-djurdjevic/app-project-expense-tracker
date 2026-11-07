// Spec: DM-050, AR-004, DS-004
export interface StoredDocumentRef {
  /** Path relative to the storage root, e.g. `<invoiceId>/<uuid>.pdf`. */
  path: string;
  originalName: string;
}
