import prisma from "@/utils/db"

export async function getReportsForUserContent(userId, contentType) {
    if (!userId) return {};  // Return an empty object if there's no user ID

    try{
        const reports = await prisma.report.findMany({
            where: {
                authorId: userId,
                contentType: contentType, // Filter by content type (BLOG or COMMENT)
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
    }

    catch(error){
        return res.status(422).json({ message: "Failed to get reports", error });
    }
}
