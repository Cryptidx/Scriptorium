export function isAllowedFileType(file, allowedMimeTypes) {
    return allowedMimeTypes.includes(file.mimetype);
  }
  