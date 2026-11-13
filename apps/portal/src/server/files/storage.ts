export interface PresignedPut {
  url: string;
  /** Headers the browser must send with the PUT, exactly. */
  headers: Record<string, string>;
  expiresAt: Date;
}

export interface FileStorage {
  /** A URL the browser PUTs the file to. Content type and length are signed, so a different file is rejected by R2. */
  presignPut(input: {
    key: string;
    contentType: string;
    contentLength: number;
    expiresInSeconds?: number;
  }): Promise<PresignedPut>;
  /** A GET URL that forces download with `filename`. 60 seconds unless told otherwise. */
  presignGet(input: { key: string; filename: string; expiresInSeconds?: number }): Promise<{ url: string; expiresAt: Date }>;
  /** Size and content type of the stored object, or null when it does not exist. */
  head(key: string): Promise<{ size: number; contentType: string } | null>;
  delete(key: string): Promise<void>;
}
