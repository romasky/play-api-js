/** /files/* contracts (download returns raw bytes — no JSON contract). */
const { str, int, bool, arr, obj, entry } = require('./schema');

const FILE_ITEM = {
  file_id: str, filename: str, size: int, content_type: str, declared_type: str,
  description: str, download_url: str, created_at: str, expires_at: str,
};

const FileUploadResponse   = obj({ ...FILE_ITEM, success: bool, owner: str }); // owner: "user" | "anonymous"
const FileMetadataResponse = obj({ ...FILE_ITEM, success: bool });
const FilesListResponse    = obj({ success: bool, total: int, returned: int, files: arr(obj(FILE_ITEM)) });

const CONTRACTS_2XX = [
  entry('POST', '/files/upload', 'FileUploadResponse',   FileUploadResponse),
  entry('GET',  '/files',        'FilesListResponse',    FilesListResponse),
  entry('GET',  '/files/[^/]+',  'FileMetadataResponse', FileMetadataResponse),
];

module.exports = { CONTRACTS_2XX };
