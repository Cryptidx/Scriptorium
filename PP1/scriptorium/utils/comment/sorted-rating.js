import prisma from "@/utils/db";

// chat
export default async function handlerSorting(req, res, which) {
    // GET request 
    // not restricted 
    // 0 blogs 
    // 1 comments 

    // get list of blogs based on rating, descending, basd on upvotes
    const { page = 1, limit = 10 } = req.query;

    // Convert page and limit to integers and calculate skip
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        // Fetch paginated blog posts sorted by upvotes in descending order

        let newData;
        let totalCount;

        if(which === 0){
            // get blogs 
            newData = await prisma.blog.findMany({
                orderBy: { upvotes: "desc" },
                skip: skip,
                take: limitInt,
            });

            totalCount = await prisma.blog.count();
        }

        else{
            // get comments 
            newData = await prisma.comment.findMany({
                where: {
                  blogId: parseInt(blogId),
                  parentId: null,  // Only fetch top-level comments
                },
                orderBy: { upvotes: "desc" },
                skip: skip,
                take: limitInt,
              });

            totalCount = await await prisma.comment.count({
                where: { blogId: parseInt(blogId), parentId: null },
              });
        }

    
        return res.status(200).json({
        data: newData,
        pagination: {
            total: totalCount,
            page: pageInt,
            limit: limitInt,
            totalPages: Math.ceil(totalCount / limitInt),
        },
        });
    } 
    
    catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
}
