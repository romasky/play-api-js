/** /files/* — multipart upload (auth optional), my-files list, public metadata + download, delete. */
const { request } = require('../http/client');
const paths = require('../http/paths');

/**
 * `file` = sample() result { filename, content, type }; `field` other than "file", or no file → NO_FILE.
 * The description goes in as a multipart FIELD, so the body stays multipart/form-data even without a file
 * part (a form-urlencoded body yields INVALID_MULTIPART, not NO_FILE).
 */
function upload(headers, file, { field = 'file', description } = {}) {
  const form = new FormData();
  if (file) form.append(field, new Blob([file.content], { type: file.type }), file.filename);
  if (description !== undefined || !file) form.append('description', description ?? '');
  return request('POST', paths.FILES_UPLOAD, { form, headers });
}

module.exports = {
  upload,
  // not multipart at all → INVALID_MULTIPART
  uploadJson: (body, headers)          => request('POST',   paths.FILES_UPLOAD, { json: body, headers }),
  listMine:   (headers, params)        => request('GET',    paths.FILES, { params, headers }),
  metadata:   (id, headers = {})       => request('GET',    paths.file(id), { headers }),
  download:   (id, params)             => request('GET',    paths.fileDownload(id), { params }),
  delete:     (id, headers)            => request('DELETE', paths.file(id), { headers }),
};
