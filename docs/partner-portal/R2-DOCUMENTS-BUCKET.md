# Private documents bucket (R2)

The partner portal stores private partner documents in one R2 bucket that is never public. Files reach the browser only through the portal: uploads use a presigned PUT, downloads use a 60 second presigned GET issued after the portal checks the partner's audience.

## One time setup (operator, not run from the repo)

1. Create the bucket `cleanstart-partner-docs` (production) and `cleanstart-partner-docs-dev` (development and test). No public access, no custom domain, no public development URL.
2. Create an API token with object read and write on those buckets only. Put `R2_ENDPOINT` (`https://<account id>.r2.cloudflarestorage.com`), `R2_BUCKET`, `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` in `/opt/cleanstart/portal.env` (production) or `apps/portal/.env` (development). Never commit them.
3. Set the CORS rules below on each bucket. The browser uploads with `PUT` straight to R2, so without this rule every upload fails in the browser with a CORS error.

Production bucket CORS:

```json
[
  {
    "AllowedOrigins": ["https://partners.cleanstart.com"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Development bucket CORS (one origin per worktree port):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3004",
      "http://localhost:3204",
      "http://localhost:3214",
      "http://localhost:3224",
      "http://localhost:3234",
      "http://localhost:3244",
      "http://localhost:3254"
    ],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Downloads are a top level navigation to a presigned URL that carries `Content-Disposition: attachment`, so they need no CORS rule.

## Keys, retention and cleanup

- Key scheme: `documents/<document id>/v<version>/<uuid>-<sanitised file name>`. A purged document's row holds `purged/<document id>` and no object.
- A replaced file stays for 30 days (`document_versions.purge_after`); a deleted document's files go 30 days after deletion. The `document-purge` job (03:20 UTC) deletes both from the database and then from R2. If an R2 delete fails the job logs the key at error level and reports to Sentry: delete that object by hand.
- Abandoned uploads (a ticket was issued, the browser uploaded, nobody confirmed) leave an unreferenced object. They are private and small in number; v1 has no sweep.
- The nightly backup does not cover this bucket. R2 durability is the plan for documents; the originals live with marketing.

## Checks after setup

1. In the portal as marketing, upload a PDF on `/admin/documents`: it appears in the table with `PDF, <size>`.
2. As a partner in the audience, download it from `/partner/documents`: the browser saves the file.
3. In DevTools the redirect target host is the R2 endpoint and the URL contains `X-Amz-Expires=60`.
4. As a partner outside the audience, open `/api/files/<id>` directly: the response is a 404 JSON body, not a redirect.
