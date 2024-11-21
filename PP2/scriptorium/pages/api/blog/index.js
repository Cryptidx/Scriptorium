import prisma from "@/utils/db"
import { authMiddleware } from "@/lib/auth";
import processTags from "@/lib/helpers/create_tags";
import { getReportsForUserContent } from "@/utils/comment-blog/find-report";

/* CREATE and GET all blogs, not specified by ID specific operations*/

// Create a blog with the given title, description, and tags
/* requirements: must be a user and all required body args are the expected variables */
async function handlerCreate(req,res){
    try {
        // POST handler to create 
        if(req.method !== "POST"){
            return res.status(405).json({error: "method not allowed"});
        }

        // Author of the blog and must be a user
        const author = await authMiddleware(req, res, { getFullUser: true });
        console.log(author);
        if (!author && !author.id) {
            return res.status(401).json({ error: "Unauthorized. Please log in to create a blog." }); // could be null, cos we don't have a current user by jwt 
        }

        const {title, description, tags} = req.body;

        if (!title || !description || !tags) {
            return res.status(400).json({ error: "Invalid input. Ensure all fields are provided." });
        }

        // Validate title and description are non-empty strings
        if (typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({ error: "Title must be a non-empty string" });
        }

        if (typeof description !== 'string' || description.trim() === '') {
            return res.status(400).json({ error: "Description must be a non-empty string" });
        }

        // Validate tag array
        if (!Array.isArray(tags) || tags.length === 0) {
            return res.status(400).json({ error: "Request must contain at least one tag" });
        }

        // hard assumption that tag and template are javascript arays
        // there has to be at least one thing in tags
        if(!tags || tags.length == 0){
            return res.status(400).json({error: "Request must contain at least 1 tag"});
        }

        const tagConnectArray = await processTags(tags);
        

         console.log(tagConnectArray);

         // On creation: If you don’t specify comments, Prisma just sets it 
         // as an empty array in the returned object. same thing w template
        const blog = await prisma.blog.create({
            data: {
            title: title,
            description: description,
            tags: { connect: tagConnectArray },
            author: { connect: { id: author.id } },
            },
            include: {  // This will include tags in the response
                tags: true,
                templates: true,
            },
        });

        // returns entire blog for now 
        return res.status(200).json({message: "Blog created successfully", blog: blog});

    } catch (error) {
        console.error("Error creating blog:", error);
        return res.status(422).json({ error: "Unprocessable entity: Unable to create the blog" });
    }
}


// get blogs by their title, content, tags, and also the code templates 
// - paginated 

// go through blog results, check if ivalid 
// if author of blog is not auth user, show indication that it should be flagged
// if is a user and is flagged show additional reports 

async function handlerGet(req,res){
    // not restricted to auth users
    if(req.method !== "GET"){
        return res.status(405).json({error: "method not allowed"});
    }

    // Chat gpt: Please help with searching for items 
    // TODO: check if this is dereferencing properly 
    const { title, content, tags, templateId, page = 1, limit = 10 } = req.query;

    // Check that title, content, and templateId are either undefined or strings
    if ((title && typeof title !== 'string') || 
    (content && typeof content !== 'string') || 
    (templateId && typeof templateId !== 'string')) {
    return res.status(400).json({ error: "Invalid input. 'title', 'content', and 'templateId' must be strings if provided." });
    }

    // split all strings in tags query 
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    const filters = { AND: [] };
    if (title) filters.AND.push({ title: { contains: title, mode: "insensitive" } });
    if (content) filters.AND.push({ description: { contains: content, mode: "insensitive" } });
    //if (parsedTags && parsedTags.length > 0) filters.AND.push({ tags: { contains: JSON.stringify(parsedTags) } });
    if (parsedTags && parsedTags.length > 0) {
        filters.AND.push({
            tags: {
                some: {
                    name: { in: parsedTags }
                }
            }
        });
    }
    if (templateId) filters.AND.push({ templates: { some: { id: Number(templateId) } } });

    try {
        const author = await authMiddleware(req, res, {getFullUser: true});
        const authorId = author ? author.id : null;

        // Add additional logic for flagged blogs
        if (!authorId) {
            // For unauthenticated users: exclude all flagged blogs
            filters.AND.push({ flagged: false });
        } else {
            // For authenticated users: include flagged blogs only if authored by the user
            filters.AND.push({
                OR: [
                    { flagged: false }, // Include non-flagged blogs
                    { flagged: true, authorId: authorId }, // Include flagged blogs authored by the user
                ],
            });
        }

        const blogs = await prisma.blog.findMany({
            where: filters,
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit),
            include: {  
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    }
                },                templates: true,
                comments: true,
                tags: true,
            },
        });

        // If user is authenticated, fetch reports for their flagged blogs
        let reportData = {};
        if (authorId) {
            // Fetch reports for flagged blogs authored by the authenticated user
            const flaggedBlogIds = blogs.filter(blog => blog.flagged).map(blog => blog.id);

            if (flaggedBlogIds.length > 0) {
                reportData = await getReportsForUserContent(authorId, "BLOG", flaggedBlogIds);
            }
        }

        // Enrich blogs by attaching reports for flagged blogs authored by the authenticated user
        const enrichedBlogs = blogs.map(blog => ({
            ...blog,
            reports: blog.flagged && blog.authorId === authorId ? reportData[blog.id] || [] : undefined,
        }));
        
        // Calculate total count with the same filters
        const totalCount = await prisma.blog.count({where: filters,});
        const totalPages = Math.ceil(totalCount / parseInt(limit));
        const currentPage = parseInt(page);
        const pagesLeft = totalPages - currentPage;

        // Return enriched blogs with extended pagination info
        return res.status(200).json({
            message: "Blogs fetched successfully",
            data: enrichedBlogs,
            pagination: {
                total: totalCount,
                firstPage: 1,
                currentPage: currentPage,
                totalPages: totalPages,
                pagesLeft: pagesLeft > 0 ? pagesLeft : 0, // Ensure non-negative pagesLeft
                limit: parseInt(limit),
            },
        });

    } catch (error) {
        console.error("Error fetching blog:", error);
        return res.status(422).json({ error: "Unprocessable entity: Unable to get the blogs" });
    }
}



export default async function handler(req, res) {
    let method = req.method;
    switch(method){
        case "POST":
            await handlerCreate(req,res);
            return

        case "GET":
            await handlerGet(req,res);
            return  
    }

    return res.status(400).json({ error: `Method ${method} Not Allowed`});
}