import prisma from "@/utils/db"
import { authMiddleware } from "@/lib/auth";
import processTags from "@/lib/helpers/create_tags";
/*
CREATE AND GET BLOG (FROM SET OF BLOGS)
*/

// create a blog 
async function handlerCreate(req,res){
    /*
    requirements:
    - is a user
    - all required args are the right variables and 
    handles cases when null 
    
    */
    try {
        // POST handler, restricted to users only 
        // expects: title, description, tag, and code template/empty 
        if(req.method !== "POST"){
            return res.status(405).json({message: "method not allowed"});
        }

        // author of the blog
        const author = await authMiddleware(req, res, { getFullUser: true });
        console.log(author);
        if (!author && !author.id) {
            // could be null, cos we don't have a current user by jwt 
            return res.status(401).json({ message: "Unauthorized. Please log in to create a blog." });
        }

        const {title, description, tags, templates} = req.body;

        if (!title || !description || !tags) {
            return res.status(400).json({ message: "Invalid input. Ensure all fields are provided." });
        }

        // Validate title and description are non-empty strings
        if (typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({ message: "Title must be a non-empty string" });
        }

        if (typeof description !== 'string' || description.trim() === '') {
            return res.status(400).json({ message: "Description must be a non-empty string" });
        }

        // Validate tag array
        if (!Array.isArray(tags) || tags.length === 0) {
            return res.status(400).json({ message: "Request must contain at least one tag" });
        }

        // hard assumption that tag and template are javascript arays
        // there has to be at least one thing in tags
        if(!tags || tags.length == 0){
            return res.status(400).json({message: "Request must contain at least 1 tag"});
        }

        const tagConnectArray = await processTags(tags);
        
        // Format templates array for many-to-many relation
        // Process templates only if valid
         const templateConnectArray = Array.isArray(templates) && templates.length > 0 
         ? templates.map(templateId => {
             if (typeof templateId !== 'number') {
                 throw new Error("Invalid template ID format. Template IDs must be integers.");
             }
             return { id: templateId };
         })
         : [];

         console.log(tagConnectArray);

         // On creation: If you don’t specify comments, Prisma just sets it 
         // as an empty array in the returned object.
        const blog = await prisma.blog.create({
            data: {
            title: title,
            description: description,
            tags: { connect: tagConnectArray },
            templates: { connect: templateConnectArray }, // Connect existing templates by ID
            author: { connect: { id: author.id } },
            },
            include: {  // This will include tags in the response
                tags: true,
                templates: true,
            },
        });

        // returns entire blog for now 
        return res.status(200).json(blog);

    } catch (error) {
        console.error("Error creating blog:", error);
        return res.status(422).json({ message: "Unprocessable entity: Unable to create the blog" });
    }
}


// get blogs by their title, content, tags, and also the code templates 
// paginated 
async function handlerGet(req,res){
    // not restricted to auth users
    if(req.method !== "GET"){
        return res.status(405).json({message: "method not allowed"});
    }

    // Chat gpt: Please help with searching for items 
    const { title, content, tags, templateId, page = 1, limit = 10 } = req.query;

    // Check that title, content, and templateId are either undefined or strings
    if ((title && typeof title !== 'string') || 
    (content && typeof content !== 'string') || 
    (templateId && typeof templateId !== 'string')) {
    return res.status(400).json({ message: "Invalid input. 'title', 'content', and 'templateId' must be strings if provided." });
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
        const blogs = await prisma.blog.findMany({
            where: filters,
            skip: (page - 1) * limit,
            take: parseInt(limit),
            include: {  // might change up these includs 
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
        return res.status(200).json({ blogs, page, limit });
    } catch (error) {
        console.error("Error fetching blog:", error);
        return res.status(422).json({ message: "Unprocessable entity: Unable to get the blogs" });
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