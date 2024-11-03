import prisma from "@/utils/db"
import { authMiddleware } from "@/lib/auth";

/*
CREATE AND GET BLOG (FROM SET OF BLOGS)
*/

// create a blog 
async function handlerCreate(req,res){
    // POST handler, restricted to users only 
    // expects: title, description, tag, and code template/empty 
    if(req.method !== "POST"){
        return res.status(405).json({message: "method not allowed"});
    }

    // author of the blog
    const author = authMiddleware(req, res);
    if (!author) {
        // could be null, cos we don't have a current user by jwt 
        return res.status(401).json({ message: "Unauthorized. Please log in to create a blog." });
    }

    const {title, description, tag, templates} = req.body;

    if(!title || !description){
        // these are all mandatory fields 
        return res.status(400).json({message: "fill in provided fields"});
    }

    // hard assumption that tag and template are javascript arays
    // there has to be at least one thing in tags
    if(!tag || tag.length == 0){
        return res.status(400).json({message: "put in at least 1 tag"});
    }
    
    // we want our tags to be json lists
    const tagsJson = JSON.stringify(tag);

    // Format templates array for many-to-many relation
    const templateConnectArray = templates.map(templateId => ({
        id: templateId,
    }));

    const blog = await prisma.blog.create({
        data: {
        title: title,
        description: description,
        tag: tagsJson,
        templates: {
            connect: templateConnectArray,  // Connect existing templates by ID
        },
        author: { connect: { id: author.id } },
        },
        // will comments be empty by default??????
    });

    // returns entire blog for now 
    return res.status(200).json(blog);
}


// get blogs by their title, content, tags, and also the code templates 
// paginated 
async function handlerGet(req,res){
    // not restricted to auth users
    if(req.method !== "GET"){
        return res.status(405).json({message: "method not allowed"});
    }

    // Chat gpt: Please help with searching for items 
    const { title, content, tag, templateId, page = 1, limit = 10 } = req.query;
    const parsedTags = tag ? JSON.parse(tag) : null;

    const filters = { AND: [] };
    if (title) filters.AND.push({ title: { contains: title, mode: "insensitive" } });
    if (content) filters.AND.push({ description: { contains: content, mode: "insensitive" } });
    if (parsedTags && parsedTags.length > 0) filters.AND.push({ tag: { contains: JSON.stringify(parsedTags) } });
    if (templateId) filters.AND.push({ templates: { some: { id: Number(templateId) } } });

    try {
        const blogs = await prisma.blog.findMany({
            where: filters,
            skip: (page - 1) * limit,
            take: parseInt(limit),
            include: {  // might change up these includs 
                author: true,
                templates: true,
                comments: true,
            },
        });
        return res.status(200).json({ blogs, page, limit });
    } catch (error) {
        return res.status(500).json({ message: "Failed to retrieve blogs", error });
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