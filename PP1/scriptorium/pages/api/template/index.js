import prisma from "@/utils/db"
import { authMiddleware } from "@/lib/auth";
import processTags from "@/lib/helpers/create_tags";

// create a template
async function handlerCreate(req,res){
    // POST handler, restricted to users only 
    // expects: title, description, tag, and code template/empty 
    if (req.method !== "POST"){
        return res.setHeader("Allow", ["POST"]).status(405).end("Method " + req.method + " Not Allowed");
    }

    // author of the blog
    const author = await authMiddleware(req, res, { getFullUser: true });
    if (!author) {
        // could be null, cos we don't have a current user by jwt 
        return res.status(401).json({ message: "Unauthorized. Please log in to create a blog." });
    }

    const {forkedFromId, code, language, title, explanation, tags, blogs} = req.body;

    if(!code || !language || !title || !explanation){
        // these are all mandatory fields 
        return res.status(400).json({message: "fill in provided fields"});
    }
    
    var processedTags = [];

    if (tags && tags.length > 0) {
        processedTags = await processTags(tags);
    }

    if (processedTags.length === 0) {
        return res.status(400).json({message: "fill in provided fields"});
    }
    
    try {
        const template = await prisma.template.create({
            data: {
                ownerId: author.id,
                code,
                language,
                title,
                explanation,
                ...(forkedFromId && { forkedFromId }),
    
                ...(blogs && blogs.length > 0 && {
                    blogs: {
                        connect: blogs.map((id) => ({ id })),
                    }
                }),

                ...(processedTags && processedTags.length > 0 && {
                    tags: {
                        connect: processedTags,
                    }
                }),
            },

            include: {
                blogs: true,
                tags: true
            }
        });
    
        // returns entire blog for now 
        return res.status(200).json(template);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


// get blogs by their title, content, tags, and also the code templates 
// paginated 
async function handlerGet(req,res){
    // not restricted to auth users
    if(req.method !== "GET"){
        return res.setHeader("Allow", ["GET"]).status(405).end("Method " + req.method + " Not Allowed");
    }

    const { forkedFromId, code, language, title, explanation, tags, blogs, page = 1, limit = 10 } = req.query;

    var numForkedFromId = parseInt(forkedFromId);

    var processedTags = [];

    if (tags) {
        var parseTags = tags.split(',');
        parseTags.every(tag => tag !== "");

        if (parseTags && parseTags.length > 0) {
            processedTags = await processTags(parseTags);
        }
    }

    const filter = [];

    if (!isNaN(numForkedFromId)) { filter.push({ forkedFromId: numForkedFromId });}

    if (code) {filter.push({ code: { contains: code } });}
    if (language) {filter.push({ language: { contains: language } });}
    if (explanation) {filter.push({ explanation: { contains: explanation } });}
    if (title) {filter.push({ title: { contains: title } });}
    if (blogs && blogs.length > 0) { blogs.forEach(blogId => {filter.push({ blogs: { some: { id: blogId }  } })}); }
    if (processedTags && processedTags.length > 0) { processedTags.forEach(tag => {filter.push({ tags: { some: { id: tag.id }  } })}); }

    var numPage = parseInt(page);
    if (isNaN(page)) {
        numPage = 1;
    }

    var numLimit = parseInt(limit);
    if (isNaN(limit)) {
        numLimit = 10;
    }

    try {
        const templates = await prisma.template.findMany({
            where: {
                AND: filter,
            },
            skip: (numPage - 1) * numLimit,
            take: numLimit,
            include: {
                blogs: true,
                tags: true,
            },
        });
        return res.status(200).json({ templates, numPage, numLimit });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

export default async function handler(req, res) {
    let method = req.method;
    switch(method){
        case "POST":
            await handlerCreate(req,res);
            return;

        case "GET":
            await handlerGet(req,res);
            return;
        
        default:
            res.setHeader("Allow", ["GET", "POST"]).status(405).json({ error: "Method " + req.method + " Not Allowed"});
    }
}