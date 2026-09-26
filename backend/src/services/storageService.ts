import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

let supabaseClient: SupabaseClient | null = null;

const supabaseKey = config.supabase.serviceKey || config.supabase.anonKey;
if (config.supabase.url && supabaseKey) {
  supabaseClient = createClient(config.supabase.url, supabaseKey, {
    auth: { persistSession: false },
  });
  logger.info(`📦 Supabase Storage Client initialized for URL: ${config.supabase.url}`);
} else {
  logger.info(`📦 Supabase Storage credentials not detected; using base64 data URI fallback mode.`);
}

export interface UploadResult {
  url: string;
  publicId: string;
  storageProvider: 'SUPABASE' | 'BASE64';
}

/**
 * Uploads a file buffer to Supabase Storage bucket with automated fallback
 */
export const uploadFileToStorage = async (
  file: Express.Multer.File,
  folder = 'leave-attachments'
): Promise<UploadResult> => {
  const bucketName = config.supabase.bucket || 'leave-attachments';
  const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${folder}/${Date.now()}-${sanitizedName}`;

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.storage
        .from(bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        logger.warn(`⚠️ Supabase upload returned error: ${error.message}. Falling back to base64 encoding.`);
      } else if (data) {
        const { data: urlData } = supabaseClient.storage
          .from(bucketName)
          .getPublicUrl(data.path);

        logger.info(`✅ Uploaded attachment to Supabase Storage: ${urlData.publicUrl}`);
        return {
          url: urlData.publicUrl,
          publicId: data.path,
          storageProvider: 'SUPABASE',
        };
      }
    } catch (err) {
      logger.error('❌ Supabase storage upload exception:', err);
    }
  }

  // Fallback to base64 Data URI
  const base64Data = file.buffer.toString('base64');
  const fileUrl = `data:${file.mimetype};base64,${base64Data}`;
  const publicId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return {
    url: fileUrl,
    publicId,
    storageProvider: 'BASE64',
  };
};

/**
 * Helper to check or create the bucket if service role key is present
 */
export const ensureStorageBucket = async () => {
  if (!supabaseClient) return false;
  try {
    const bucketName = config.supabase.bucket || 'leave-attachments';
    const { data: buckets } = await supabaseClient.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === bucketName);

    if (!exists && config.supabase.serviceKey) {
      const { error } = await supabaseClient.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
      });
      if (error) {
        logger.warn(`Could not auto-create Supabase bucket: ${error.message}`);
      } else {
        logger.info(`✅ Successfully created public Supabase bucket '${bucketName}'`);
      }
    }
    return true;
  } catch (error) {
    return false;
  }
};
