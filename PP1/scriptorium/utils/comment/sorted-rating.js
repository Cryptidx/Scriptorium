import prisma from "@/utils/db";

// chat
export default async function handlerSorting(req, res, which) {
    // GET request 
    // not restricted 
    // 0 blogs 
    // 1 comments 

    // Only allow GET requests
    if (req.method !== "GET") {
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    // get list of blogs based on rating, descending, basd on upvotes
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    // would be null for top level function, cos its directly under blogs
    const blogId = req.query.blogId ? parseInt(req.query.blogId, 10) : null;

    // Convert page and limit to integers and calculate skip
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    // only show valid stuff if i'm not the author 
    // else show everything if i'm the author 

    // go into handle report listing 
    // and get the stuff from report listing 
    // content id could be commeent id or blog id 
    

    try {
        // Fetch paginated blog posts sorted by upvotes in descending order
        // add report information for blogs/ comments where user is same as ]
        // current usr 

        let data;
        let reportData;
        let newData;
        let totalCount;

        const author = await authMiddleware(req, res);
        const authorId = author ? author.id : null;

        if(which === 0){
            // get blogs 
            data = await prisma.blog.findMany({
                orderBy: { upvotes: "desc" },
                skip: skip,
                take: limitInt,
            });

            reportData = authorId ? await getReportsForUserContent(authorId, "BLOG") : {};

            newData = data.map(datum => {
                const isAuthor = authorId && datum.authorId === authorId;
                return {
                    ...datum,
                    reports: isAuthor ? reportData[datum.id] || [] : undefined,
                };
            });

            totalCount = await prisma.blog.count();
        }

        if(which > 0){
            if(which === 1){
                // get comments within a blog
    
                if(!blogId || isNaN(blogId)){
                    return res.status(400).json({ message: "Invalid blog id" });
                }
    
                data = await prisma.comment.findMany({
                    where: {
                      blogId: blogId,
                      parentId: null,  // Only fetch top-level comments
                    },
                    orderBy: { upvotes: "desc" },
                    skip: skip,
                    take: limitInt,
                });
            }

            else{
                // get juiciest comments everywhere 
                data = await prisma.comment.findMany({
                    where: {
                      parentId: null,  // Only fetch top-level comments
                    },
                    orderBy: { upvotes: "desc" },
                    skip: skip,
                    take: limitInt,
                });
            }

            reportData = authorId ? await getReportsForUserContent(authorId, "COMMENT") : {};

            newData = data.map(datum => {
                const isAuthor = authorId && datum.authorId === authorId;
                return {
                    ...datum,
                    reports: isAuthor ? reportData[datum.id] || [] : undefined,
                };
            });

            totalCount = await prisma.comment.count({
                where: { blogId: blogId, parentId: null },
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
        console.log(error);
        return res.status(422).json({ message: "Failed to get sorted blogs or comments" });
    }
}
