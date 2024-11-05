import prisma from "@/utils/db";

// GPT: Create a helper based on my model for finding reports
export async function getReportsForUserContent(userId, contentType, contentIds) {
    // Log input parameters to confirm they’re being passed correctly
    console.log("getReportsForUserContent - userId:", userId);
    console.log("getReportsForUserContent - contentType:", contentType);
    console.log("getReportsForUserContent - contentIds:", contentIds);

    if (!userId || !Array.isArray(contentIds) || contentIds.length === 0) {
        console.log("Invalid input: userId or contentIds missing or empty");
        return {};  // Return an empty object if there's no user ID or content IDs
    }

    try {
        const reports = await prisma.report.findMany({
            where: {
                authorId: userId,
                contentType: contentType,
                contentId: { in: contentIds }, // Filter by the provided content IDs
            },
            select: {
                contentId: true,
                explanation: true,
            },
        });

        // Organize report explanations by content ID for easy lookup
        const reportData = reports.reduce((acc, report) => {
            if (!acc[report.contentId]) {
                acc[report.contentId] = [];
            }
            acc[report.contentId].push(report.explanation);
            return acc;
        }, {});

        return reportData;
    } catch (error) {
        console.error("Error fetching reports:", error);
        return {}; // Return an empty object as needed on error
    }
}
