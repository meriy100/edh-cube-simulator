"use server";

import adminDb from "@/lib/firebase/admin";
import { config } from "@/lib/auth";
import NextAuth from "next-auth";

const { auth } = NextAuth(config);

export async function migratePoolXCardsOutsideField() {
    const session = await auth();

    if (!session || !session.user) {
        return { success: false, error: "Authentication required" };
    }

    try {
        const db = adminDb();
        const poolsSnapshot = await db.collection("pools").get();

        let totalUpdated = 0;
        const batchSize = 500;
        let batch = db.batch();
        let currentBatchCount = 0;

        for (const poolDoc of poolsSnapshot.docs) {
            const poolId = poolDoc.id;
            const poolXCardsSnapshot = await db
                .collection("pools")
                .doc(poolId)
                .collection("poolXCards")
                .get();

            for (const cardDoc of poolXCardsSnapshot.docs) {
                const cardData = cardDoc.data();
                if (cardData.outside === undefined) {
                    batch.update(cardDoc.ref, { outside: false });
                    currentBatchCount++;
                    totalUpdated++;

                    if (currentBatchCount >= batchSize) {
                        await batch.commit();
                        console.log(`Committed a batch of ${currentBatchCount} updates.`);
                        batch = db.batch(); // Create a new batch
                        currentBatchCount = 0;
                    }
                }
            }
        }

        // Commit any remaining updates
        if (currentBatchCount > 0) {
            await batch.commit();
            console.log(`Committed final batch of ${currentBatchCount} updates.`);
        }

        return {
            success: true,
            message: `Successfully migrated ${totalUpdated} poolXCards to have outside: false.`,
            count: totalUpdated,
        };
    } catch (error) {
        console.error("Migration error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred",
        };
    }
}
