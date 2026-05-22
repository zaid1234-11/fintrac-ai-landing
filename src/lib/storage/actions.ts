import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { auth } from '@clerk/nextjs/server';

/**
 * Generates a secure, normalized filename to prevent collisions and sanitize names
 */
export function generateSecureFilename(originalName: string): string {
  const timestamp = Date.now();
  const cleanName = originalName
    .replace(/[^a-zA-Z0-9.\-_]/g, '_') // sanitize characters
    .replace(/_{2,}/g, '_'); // clear double underscores
  return `${timestamp}-${cleanName}`;
}

/**
 * Uploads a file buffer to the user's isolated directory inside 'bank-statements' bucket
 */
export async function uploadStatement(
  fileBuffer: Buffer,
  originalFilename: string,
  contentType: string
) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const supabase = await createClient();
  const secureFilename = generateSecureFilename(originalFilename);
  const filePath = `${userId}/${secureFilename}`;

  // 1. Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('bank-statements')
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // 2. Track in uploaded_files table for auditing
  const { data: dbData, error: dbError } = await supabase
    .from('uploaded_files')
    .insert({
      user_id: userId,
      bucket_id: 'bank-statements',
      file_path: filePath,
      file_type: contentType,
      file_size_bytes: fileBuffer.length,
    })
    .select()
    .single();

  if (dbError) {
    console.error('Failed to log file upload in DB:', dbError);
    // Non-blocking for the upload, but log it
  }

  return {
    filePath,
    filename: secureFilename,
    uploadData,
    dbRecord: dbData,
  };
}

/**
 * Generates a temporary signed URL to safely read private statements
 */
export async function getSignedStatementUrl(filePath: string, expiresInSeconds = 3600) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.storage
    .from('bank-statements')
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) {
    console.error('Error generating signed URL:', error);
    throw new Error(`Could not generate signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Administrative method to download file from bucket during async background parsing
 */
export async function downloadStatementAdmin(filePath: string): Promise<Buffer> {
  const supabaseAdmin = createAdminClient();
  
  const { data, error } = await supabaseAdmin.storage
    .from('bank-statements')
    .download(filePath);

  if (error) {
    console.error('Admin statement download error:', error);
    throw new Error(`Admin download failed: ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
