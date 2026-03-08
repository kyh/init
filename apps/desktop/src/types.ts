export interface UpdateState {
  status:
    | "idle"
    | "checking"
    | "available"
    | "not-available"
    | "downloading"
    | "downloaded"
    | "error";
  version: string | null;
  downloadPercent: number | null;
  message: string | null;
}
