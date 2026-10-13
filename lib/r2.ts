import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

function getCleanAccountId(): string {
  const raw = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID || "";
  if (!raw) return "";
  // Extract 32-char hex if a full URL was provided
  const match = raw.match(/([a-fA-F0-9]{32})/);
  if (match) return match[1];
  return raw.replace(/^https?:\/\//, "").split(".")[0];
}

const getAccessKeyId = () => process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "";
const getSecretAccessKey = () => process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "";
const getBucketName = () => process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME || "leaddesk-media";
const getPublicUrl = () => process.env.R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL || "";

export function isR2Configured(): boolean {
  return Boolean(getCleanAccountId() && getAccessKeyId() && getSecretAccessKey() && getBucketName());
}

function getR2Client(): S3Client {
  const accountId = getCleanAccountId();
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: getAccessKeyId(),
      secretAccessKey: getSecretAccessKey(),
    },
  });
}

export interface UploadR2Options {
  buffer: Buffer;
  key: string;
  contentType: string;
}

/**
 * Uploads a file buffer directly to Cloudflare R2 bucket.
 * Returns the public HTTPS URL to access the uploaded asset.
 */
export async function uploadToR2({
  buffer,
  key,
  contentType,
}: UploadR2Options): Promise<{ success: boolean; url: string; key: string }> {
  if (!isR2Configured()) {
    throw new Error(
      "Cloudflare R2 is not fully configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in environment variables."
    );
  }

  const client = getR2Client();
  const bucketName = getBucketName();
  const accountId = getCleanAccountId();
  const publicUrl = getPublicUrl();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);

  // Construct public URL
  let fileUrl = "";
  if (publicUrl) {
    const cleanPublicUrl = publicUrl.replace(/\/+$/, "");
    const cleanKey = key.replace(/^\/+/, "");
    fileUrl = `${cleanPublicUrl}/${cleanKey}`;
  } else {
    fileUrl = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
  }

  return {
    success: true,
    url: fileUrl,
    key,
  };
}

/**
 * Deletes an object from Cloudflare R2 bucket.
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  if (!isR2Configured()) return false;

  try {
    const client = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    });
    await client.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting from Cloudflare R2:", error);
    return false;
  }
}
