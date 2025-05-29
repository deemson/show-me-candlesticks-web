export interface Fetcher {
  fetch(): Promise<string[]>;
}
