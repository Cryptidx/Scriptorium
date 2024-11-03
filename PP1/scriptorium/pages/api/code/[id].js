import { fork } from 'child_process';
import prisma from '../../../lib/prisma'; // Adjust path as necessary

async function handlerDelete(req, res) {
    const { id } = req.query;

    if (req.method !== "DELETE"){
        return res.setHeader("Allow", ["DELETE"]).status(405).end("Method " + req.method + " Not Allowed");
    }

    const templateId = parseInt(id);

    if (isNaN(templateId)) {
        return res.status(400).json({error: "Invalid template ID"});
    }

    try {
        const template = await prisma.template.findUnique({
          where: { id: templateId },
        });
    
        if (!template) {
          return res.status(404).json({error: "No template found with that ID"});
        }
    
        await prisma.template.delete({
          where: { id: templateId },
        });
    
        return res.status(200).json({message: "Successfully deleted template"});
    } 

    catch (error) {
        return res.status(500).json({error: error.message});
    }
}

function validateAttributes(attributes) {
    const allowedAttributes = ["code", "language", "title", "explanation", "tag"];

    for (let key in attributes) {
        if (!allowedAttributes.includes(key)) {
            return false;
        }
    }
    return true;
}

async function handlerUpdate(req, res) {
    const { id } = req.query;
    const updates = req.body;

    if (req.method !== "PUT"){
        return res.setHeader("Allow", ["PUT"]).status(405).end("Method " + req.method + " Not Allowed");
    }

    const templateId = parseInt(id);

    if (isNaN(templateId)) {
        return res.status(400).json({error: "Invalid template ID"});
    }

    if (!validateAttributes(updates)) {
        return res.status(400).json({error: "Request contains invalid attributes"});
    }

    try {
        const template = await prisma.template.findUnique({
            where: { id: templateId },
          });

        const { code, language, title, explanation, tag } = updates;
      
        if (!template) {
            return res.status(404).json({error: "No template found with that ID"});
        }

        const updatedRecord = await prisma.template.update({
            where: { id: templateId },
            data: {
                code,
                language,
                title,
                explanation,
                tag,
            }
        });

        return res.status(200).json(updatedRecord);
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
}

async function handlerGet(req, res) {
    const { id } = req.query;

    if (req.method !== "GET"){
        return res.setHeader("Allow", ["GET"]).status(405).end("Method " + req.method + " Not Allowed");
    }

    const templateId = parseInt(id);

    if (isNaN(templateId)) {
        return res.status(400).json({error: "Invalid template ID"});
    }

    
    try {
        const template = await prisma.template.findUnique({
            where: { id: templateId },
          });
      
        if (!template) {
            return res.status(404).json({error: "No template found with that ID"});
        }

        return res.status(200).json(template);

    } catch (error) {
        return res.status(500).json({error: error.message});
    }
}

export default async function handler(req, res) {
    const author = authMiddleware(req, res);
    if (!author) {
        return res.status(401).json({ message: "Unauthorized. Please log in to create code." });
    }

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
            res.setHeader("Allow", ["GET", "DELETE", "PUT"]).status(405).json({ error: "Method " + req.method + " Not Allowed"});
    }
}