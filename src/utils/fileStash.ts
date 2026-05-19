/**
 * Temporary file store — holds File objects between route navigations.
 * react-router state can't serialize File objects, so we stash them here.
 */
let _pendingFiles: File[] = [];

export function stashFiles(files: File[]): void {
  _pendingFiles = [...files];
}

export function popFiles(): File[] {
  const files = _pendingFiles;
  _pendingFiles = [];
  return files;
}
