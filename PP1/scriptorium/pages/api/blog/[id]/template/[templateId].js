import prisma from "@/utils/db"
import { authMiddleware } from "@/lib/auth";

async function handlerDelete(req, res) {
    if (req.method !== "DELETE") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const blogId = parseInt(req.query.id);
    const templateId = parseInt(req.query.templateId);

    // Validate IDs
    if (isNaN(blogId) || isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid blog or template ID" });
    }

    try {
        // Fetch the blog along with its templatesW
        const template = await prisma.template.findUnique({
            where: { id: templateId }
        });

        if (!template) {
            return res.status(404).json({ error: "Not a valid template ID" })
        }

        const updatedBlog = await prisma.blog.update({
        where: { id: blogId },
        data: {
            templates: {
            disconnect: [{id: template.id}],
            }
        }, 
        include: {
            templates: true,
        },
        });

        // Return the found template
        return res.status(200).json(updatedBlog);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

async function handlerUpdate(req, res) {
    if (req.method !== "PUT") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const blogId = parseInt(req.query.id);
    const templateId = parseInt(req.query.templateId);

    // Validate IDs
    if (isNaN(blogId) || isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid blog or template ID" });
    }

    try {
        // Fetch the blog along with its templatesW
        const template = await prisma.template.findUnique({
        where: { id: templateId }
        });

        if (!template) {
            return res.status(404).json({ error: "Not a valid template ID" })
        }

        const updatedBlog = await prisma.blog.update({
        where: { id: blogId },
        data: {
            templates: {
            connect: {id: template.id},
            }
        }, 
        include: {
            templates: true,
        },
        });

        // Return the found template
        return res.status(200).json(updatedBlog);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

export default async function handler(req, res) {
    const author = await authMiddleware(req, res);
    if (!author) {
        return res.status(401).json({ message: "Unauthorized. Please log in to create code." });
    }

    switch(req.method) {
        case "DELETE": // MAKE SURE USER IS OWNER OR ADMIN
            await handlerDelete(req, res);
            return;

        case "PUT":
            await handlerUpdate(req, res);
            return;
        

        default:
            res.setHeader("Allow", ["GET", "DELETE", "PUT"]).status(405).json({ error: "Method " + req.method + " Not Allowed"});
    }
}