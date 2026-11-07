// Spec: AR-004, AR-006a, AR-008
import type { IdGenerator } from "../../core/ports/IdGenerator";

export class UuidIdGenerator implements IdGenerator {
  next(): string {
    return crypto.randomUUID();
  }
}
