import { PubSub } from "@google-cloud/pubsub";

let pubSubInstance: PubSub | null = null;

const initializePubSub = () => {
  if (!pubSubInstance) {
    try {
      if (process.env.NODE_ENV === "production") {
        // 本番環境: Base64 エンコードされた環境変数から取得
        const base64Key = process.env.GCP_SERVICE_ACCOUNT_KEY_BASE64;
        if (!base64Key) {
          throw new Error("GCP_SERVICE_ACCOUNT_KEY_BASE64 is not set");
        }

        // Base64 デコードして JSON オブジェクトに変換
        const jsonKey = Buffer.from(base64Key, "base64").toString("utf-8");
        const credentialData = JSON.parse(jsonKey);

        pubSubInstance = new PubSub({
          projectId: credentialData.project_id,
          keyFilename: undefined,
          credentials: credentialData,
        });
      } else {
        // 開発環境: GOOGLE_APPLICATION_CREDENTIALS を使用
        const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (!serviceAccountPath) {
          throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not set in .env.local");
        }

        pubSubInstance = new PubSub({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          keyFilename: serviceAccountPath,
        });
      }
    } catch (error) {
      console.error("Pub/Sub client initialization error:", error);
      throw error;
    }
  }
  return pubSubInstance;
};

export const pubsub = () => {
  return initializePubSub();
};

/**
 * Publish a message to a specified topic
 * @param topicName - The name of the Pub/Sub topic
 * @param message - The message data to publish
 * @param attributes - Optional message attributes
 * @returns Promise with message ID
 */
export const publishMessage = async (
  topicName: string,
  message: Record<string, unknown> | string,
  attributes?: Record<string, string>
): Promise<string> => {
  try {
    const client = pubsub();
    const topic = client.topic(topicName);

    // Convert message to string if it's an object
    const messageData = typeof message === "string" ? message : JSON.stringify(message);
    const dataBuffer = Buffer.from(messageData);

    // Publish message with optional attributes
    const messageId = await topic.publishMessage({
      data: dataBuffer,
      attributes: attributes || {},
    });

    console.log(`Message ${messageId} published to topic ${topicName}`);
    return messageId;
  } catch (error) {
    console.error(`Error publishing message to topic ${topicName}:`, error);
    throw error;
  }
};

/**
 * Publish multiple messages to a specified topic in batch
 * @param topicName - The name of the Pub/Sub topic
 * @param messages - Array of message data to publish
 * @returns Promise with array of message IDs
 */
export const publishBatch = async (
  topicName: string,
  messages: Array<{
    data: Record<string, unknown> | string;
    attributes?: Record<string, string>;
  }>
): Promise<string[]> => {
  try {
    const client = pubsub();
    const topic = client.topic(topicName);

    const publishPromises = messages.map(({ data, attributes }) => {
      const messageData = typeof data === "string" ? data : JSON.stringify(data);
      const dataBuffer = Buffer.from(messageData);

      return topic.publishMessage({
        data: dataBuffer,
        attributes: attributes || {},
      });
    });

    const messageIds = await Promise.all(publishPromises);
    console.log(`${messageIds.length} messages published to topic ${topicName}`);
    return messageIds;
  } catch (error) {
    console.error(`Error publishing batch messages to topic ${topicName}:`, error);
    throw error;
  }
};

/**
 * Check if a topic exists
 * @param topicName - The name of the topic to check
 * @returns Promise<boolean> - True if topic exists, false otherwise
 */
export const topicExists = async (topicName: string): Promise<boolean> => {
  try {
    const client = pubsub();
    const topic = client.topic(topicName);
    const [exists] = await topic.exists();
    return exists;
  } catch (error) {
    console.error(`Error checking if topic ${topicName} exists:`, error);
    return false;
  }
};

/**
 * Create a topic if it doesn't exist
 * @param topicName - The name of the topic to create
 * @returns Promise<void>
 */
export const ensureTopicExists = async (topicName: string): Promise<void> => {
  try {
    const client = pubsub();
    const topic = client.topic(topicName);
    const [exists] = await topic.exists();

    if (!exists) {
      await topic.create();
      console.log(`Topic ${topicName} created successfully`);
    } else {
      console.log(`Topic ${topicName} already exists`);
    }
  } catch (error) {
    console.error(`Error creating topic ${topicName}:`, error);
    throw error;
  }
};

export default pubsub;