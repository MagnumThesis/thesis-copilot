// D1 Database Types
export type D1Database = {
  prepare(query: string): D1PreparedStatement;
};

export type D1PreparedStatement = {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  raw<T = unknown[]>(): Promise<T[]>;
};

export type D1Result<T = unknown> = {
  results?: T[];
  success: boolean;
  meta: any;
};