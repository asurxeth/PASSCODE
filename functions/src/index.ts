
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();
const db = admin.firestore();

/**
 * A scheduled Cloud Function that runs every 5 minutes to retry failed webhooks.
 * It queries for pending webhook events and attempts to send them to the verifier's
 * callback URL. It implements an exponential backoff strategy for retries.
 */
export const retryWebhooks = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();

    const snapshot = await db
      .collection("webhook_events")
      .where("status", "==", "pending")
      .where("nextRetryAt", "<=", now)
      .limit(20)
      .get();

    if (snapshot.empty) {
      console.log("No pending webhooks to process.");
      return;
    }

    for (const doc of snapshot.docs) {
      const event = doc.data();
      const eventId = doc.id;

      try {
        console.log(`Attempting to send webhook for event: ${eventId}`);
        await axios.post(event.callbackUrl, event.payload, {
          timeout: 5000,
          headers: { "Content-Type": "application/json" },
        });

        await doc.ref.update({
          status: "success",
        });
        console.log(`Successfully sent webhook for event: ${eventId}`);
      } catch (err: any) {
        const attempts = (event.attempts || 0) + 1;
        console.error(
          `Failed to send webhook for event: ${eventId}. Attempt: ${attempts}. Error: ${err.message}`
        );

        if (attempts >= 5) {
          await doc.ref.update({
            status: "failed",
            attempts,
          });
          console.log(
            `Webhook for event ${eventId} has failed permanently after ${attempts} attempts.`
          );
        } else {
          const nextRetry = new Date(
            Date.now() + attempts * 60000 * Math.pow(2, attempts)
          ); // Exponential backoff

          await doc.ref.update({
            attempts,
            nextRetryAt: admin.firestore.Timestamp.fromDate(nextRetry),
          });
          console.log(
            `Scheduled retry for webhook event ${eventId} at ${nextRetry.toISOString()}`
          );
        }
      }
    }
  });

    