import prisma from '../../../lib/prisma'; // Adjust path as necessary
import { authMiddleware } from "@/lib/auth";
import processTags from "@/lib/helpers/create_tags";

async function handlerDelete(req, res) {
    // DELETE handler, restricted to users only 
    // expects id
    const { id } = req.query;

    if (req.method !== "DELETE"){
        return res.status(405).json({ error: "must use DELETE method"} );
    }

    // makes sure user is logged in
    const author = await authMiddleware(req, res, { getFullUser: true });
    if (!author) {
        return res.status(401).json({ error: "Unauthorized. Please log in to create code." });
    }

    // gets templateId from query
    const templateId = parseInt(id);

    // returns error if templateId is not a Number
    if (isNaN(templateId)) {
        return res.status(400).json({ error: "Invalid template ID" });
    }

    try {
        // checks if template exists
        const template = await prisma.template.findUnique({
          where: { id: templateId },
        });
    
        // returns error if template not found
        if (!template) {
          return res.status(404).json({error: "No template found with that ID"});
        }

        // returns error if author is not the owner or a system admin
        if (author.role !== "SYS_ADMIN" && author.id !== template.ownerId) {
          return res.status(403).json({error: "You do not have correct permission"});
        }

        // deletes template
        await prisma.template.delete({
          where: { id: templateId },
        });
    
        return res.status(200).json({message: "Successfully deleted template"});
    } 

    catch (error) {

        // error while deleting template
        console.error(error.message);
        return res.status(422).json({error: "could not delete template"});
    }
}

function validateAttributes(attributes) {
    // all attributes that can be updated
    const allowedAttributes = ["code", "language", "title", "explanation", "tags"];

    // makes sure only allowed attributes are passed
    for (let key in attributes) {
        if (!allowedAttributes.includes(key)) {
            return false;
        }
    }
    return true;
}

async function handlerUpdate(req, res) {
    // PUT handler, restricted to users only
    // expects id and at least one of: code, language, title, explanation, or tags
    const { id } = req.query;
    const updates = req.body;

    if (req.method !== "PUT"){
        return res.status(405).json({ error: "must use PUT method" });
    }

    // makes sure at least attribute is passed
    if (Object.keys(req.body).length === 0) {
        return res.status(422).json({ error: "Must update at least one attribute" })
    }

    // makes sure the user is logged in
    const author = await authMiddleware(req, res, { getFullUser: true });
    if (!author) {
        return res.status(401).json({ error: "Unauthorized. Please log in to create code." });
    }

    // gets converts id from String to Number
    const templateId = parseInt(id);

    // returns error if tempalteId is NaN
    if (isNaN(templateId)) {
        return res.status(400).json({ error: "Invalid template ID" });
    }

    // returns error if non-valid attribute passed
    if (!validateAttributes(updates)) {
        return res.status(400).json({ error: "Request contains invalid attributes" });
    }

    try {
        // gets template at given id
        const template = await prisma.template.findUnique({
            where: { id: templateId },
          });
        
        // returns error if no template found with given id
        if (!template) {
            return res.status(404).json({error: "No template found with that ID"});
        }

        // returns error if user is not the owner of the template or an admin
        if (author.role !== "SYS_ADMIN" && author.id !== template.ownerId) {
            return res.status(403).json({error: "You do not have correct permission"});
        }

        // gets req's query
        const { code, language, title, explanation, tags } = updates;

        // processes tags by getting newly created or pre-existing ids
        var processedTags = [];
        if (tags && tags.length > 0) {
            processedTags = await processTags(tags);
        }
        
        // updates template based on parameters passed
        const updatedRecord = await prisma.template.update({
            where: { id: templateId },
            data: {
                ...(code && {code}),
                ...(language && {language}),
                ...(title && {title}),
                ...(explanation && {explanation}),
                ...(processedTags && processedTags.length > 0 && { 
                    tags: {
                        set: processedTags,
                    }
                }),
                
            },
            include: {
                tags: true,
            }
        });

        return res.status(200).json({message: "Successfully updated template", template: updatedRecord});
    } catch (error) {
        
        // error while updating template
        console.error(error.message);
        return res.status(422).json({error: "could not update template"});
    }
}

async function handlerGet(req, res) {
    // GET handler
    // expects id
    const { id } = req.query;

    if (req.method !== "GET"){
        return res.status(405).json({ error: "must use GET method" });
    }

    // converts given id to a number
    const templateId = parseInt(id);

    // returns error if id is not a number
    if (isNaN(templateId)) {
        return res.status(400).json({error: "Invalid template ID"});
    }
    
    try {
        // returns template based on given id
        const template = await prisma.template.findUnique({
            where: { id: templateId },
            include: {
                blogs: true,
                tags: true
            }
          });
        
        // returns error if no template found
        if (!template) {
            return res.status(404).json({error: "No template found with that ID"});
        }

        return res.status(200).json({message: "Successfully found template", template: template});

    } catch (error) {

        // error when finding template
        console.error(error.message);
        return res.status(422).json({error: "could not update template"});
    }
}

export default async function handler(req, res) {
    switch(req.method) {
        case "DELETE":
            await handlerDelete(req, res);
            return;

        case "PUT":
            await handlerUpdate(req, res);
            return;
        
        case "GET":
            await handlerGet(req, res);
            return;

        default:
            return res.status(401).json({ error: "must use DELETE, PUT, or GET method" });
    }
}