import prisma from "@/utils/db"
import { authMiddleware } from "@/lib/auth";
import processTags from "@/lib/helpers/create_tags";

async function handlerCreate(req,res){
    // POST handler, restricted to users only 
    // expects: code, language, title, explanation, and tags
    if (req.method !== "POST"){
        return res.status(405).json({ error: "must use POST method"} );
    }

    // makes sure user is logged in + returns user
    const author = await authMiddleware(req, res, { getFullUser: true });
    if (!author) {
        return res.status(401).json({ error: "Unauthorized. Please log in to create a blog." });
    }

    // possible body requests
    const {forkedFromId, code, language, title, explanation, tags} = req.body;

    // mandatory fields
    if(!code || !language || !title || !explanation){
        return res.status(400).json({ error: "fill in all required fields" });
    }
    
    var processedTags = [];

    // gets processed tags, returning pre-existing or new tags that have the same string
    if (tags && tags.length > 0) {
        processedTags = await processTags(tags);
    }

    // makes sure at least one tag is included
    if (processedTags.length === 0) {
        return res.status(400).json({ error: "fill in all required fields" });
    }
    
    try {
        if (forkedFromId) {
            // checks if forkedFromId passed is a real id
            const forkedTemplate = await prisma.template.findUnique({
                where: { id: forkedFromId }
            })

            // throws error if it does not point to a template
            if (!forkedTemplate) {
                return res.status(400).json({ error: "forked template does not exist" });
            }
        }

        // creates the template based on required fields
        const template = await prisma.template.create({
            data: {
                ownerId: author.id,
                code,
                language,
                title,
                explanation,
                ...(forkedFromId && { forkedFromId }), // optional field
                tags: {
                    connect: processedTags, // many-to-many relation -> use connect
                }
            },

            include: {
                tags: true // returns tags of newly created blog
            }
        });
    
        // returns entire template
        return res.status(201).json({ message: "template created successfully", template: template });

    } catch (error) {

        // error in creating template
        console.error(error.message);
        return res.status(422).json({ error: "error when creating template" });
    }
}


async function handlerGet(req,res){
    // GET handler
    // optional: forkedFromId, code, language, title, explanation, tags, and blogs

    if (req.method !== "GET"){
        return res.status(405).json({ error: "must use GET method"} );
    }

    // possible body requests
    const { forkedFromId, code, language, title, explanation, tags, blogs, page = 1, limit = 10 } = req.query;

    // transformes forkedFromId to a Number from a String
    var numForkedFromId = parseInt(forkedFromId);

    var processedTags = [];

    if (tags) {
        // splits string of tags into array
        var parseTags = tags.split(',');

        // makes sure no empty String in array
        if (!parseTags.every(tag => tag !== "")) {
            return res.status(400).json({ error: "Invalid tags passed" });
        }

        // gets newly created or pre-existing tag's id
        if (parseTags && parseTags.length > 0) {
            processedTags = await processTags(parseTags);
        }
    }

    var processedBlogs = [];
    
    if (blogs) {
        // splits string of blogIds into array
        var parsedBlogs = blogs.split(',');

        // makes sure no empty String in array
        if (!parsedBlogs.every(blog => blog !== "")) {
            return res.status(400).json({ error: "Invalid blogs passed" });
        }

        // converts each blogId from a String to a Number
        if (parsedBlogs && parsedBlogs.length > 0) {
            processedBlogs = parsedBlogs.map(str => parseInt(str));
        }

        // makes sure every blogId is a Number
        if (!processedBlogs.every(blog => !isNaN(blog))) {
            return res.status(400).json({ error: "Invalid blogs passed" });
        }
    }

    const filter = [];

    // adds each query passed to general filter
    // only adds if value was passed for query
    if (!isNaN(numForkedFromId)) { filter.push({ forkedFromId: numForkedFromId });}
    if (code) {filter.push({ code: { contains: code } });}
    if (language) {filter.push({ language: { contains: language } });}
    if (explanation) {filter.push({ explanation: { contains: explanation } });}
    if (title) {filter.push({ title: { contains: title } });}
    if (processedBlogs && processedBlogs.length > 0) { processedBlogs.forEach(blogId => {filter.push({ blogs: { some: { id: blogId }  } })}); }
    if (processedTags && processedTags.length > 0) { processedTags.forEach(tag => {filter.push({ tags: { some: { id: tag.id }  } })}); }

    // converts page to number
    var numPage = parseInt(page);
    if (isNaN(page)) {
        numPage = 1; // sets to default
    }

    // converts limit to number
    var numLimit = parseInt(limit);
    if (isNaN(limit)) {
        numLimit = 10; // sets to default
    }

    try {
        // finds templates based on filter
        const templates = await prisma.template.findMany({
            where: {
                AND: filter,
            },
            skip: (numPage - 1) * numLimit, // number of templates skipped equaled to this calculation
            take: numLimit, // only take limit number of templates
            include: { // alos returns blogs and tags
                blogs: true,
                tags: true,
            },
        });

        // returns template
        return res.status(200).json({ message: "successfully found templates", templates: templates, pagination: { page: numPage, limit: numLimit }  });
    } catch (error) {

        // error in getting template
        console.error(error.message);
        return res.status(422).json({ error: "could not get template"});
    }
}

export default async function handler(req, res) {
    let method = req.method;

    switch (method) {
        case "POST":
            await handlerCreate(req,res);
            return;

        case "GET":
            await handlerGet(req,res);
            return;
        
        default:
            res.status(405).json({ error: "must use GET or POST method" });
    }
}