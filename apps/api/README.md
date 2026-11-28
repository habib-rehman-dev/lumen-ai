## Document file storage

Uploads are stored locally by default. To store new uploads in a private AWS S3
bucket, configure the API environment:

```env
STORAGE_BACKEND=s3
S3_BUCKET_NAME=your-bucket-name
AWS_REGION=ap-southeast-2
```

The API uses Boto3's default AWS credential chain. Use an IAM role when the API
runs on AWS, or a local AWS profile for development; do not put AWS access keys
in this file or in source control. The API identity needs `s3:PutObject`,
`s3:GetObject`, and `s3:DeleteObject` on the bucket's `documents/*` objects.

The bucket must remain private. S3 object keys are stored in the document
database, and S3 files are downloaded to temporary local files for ingestion.
Existing local uploads are not migrated automatically.