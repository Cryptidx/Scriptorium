import prisma from "@/utils/db"
import { authMiddleware } from "@/lib/auth";

async function handlerDelete(req, res) {
    if (req.method !== "DELETE") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const blogId = parseInt(req.query.id);
    const templateId = parseInt(req.query.templateId);

    // Validate IDs
    if (isNaN(blogId) || isNaN(templateId)) {
        return res.status(400).json({ error: "Invalid blog or template ID" });
    }

    try {
        const author = await authMiddleware(req, res, { getFullUser: true });
        if (!author) {
            return res.status(403).json({ error: "Unauthorized. Please log in to create code." });
        }

        const blog = await prisma.blog.findUnique({
            where: { id: blogId }
            });
    
        if (!blog) {
            return res.status(404).json({ error: "Blog not found" })
        }

        const isAuthor = blog.authorId === author.id;
        const isAdmin = author.role === "SYS_ADMIN";

        if(!isAuthor && !isAdmin){
            return res.status(403).json({ error: "Unauthorized. This is not your blog" });
        }

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
        return res.status(200).json({message: "Success!", changedBlog: updatedBlog});

    } catch (error) {
        console.log("failed to delete template: ", error)
        return res.status(422).json({ error: "failed to delete template"});
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
        return res.status(400).json({ error: "Invalid blog or template ID" });
    }

    try {

        const author = await authMiddleware(req, res, { getFullUser: true });
        if (!author) {
            return res.status(403).json({ error: "Unauthorized. Please log in to create code." });
        }

        const blog = await prisma.blog.findUnique({
            where: { id: blogId }
            });
    
        if (!blog) {
            return res.status(404).json({ error: "Blog not found" })
        }

        const isAuthor = blog.authorId == author.id;
        const isAdmin = author.role == "SYS_ADMIN";

        if(!isAuthor && !isAdmin){
            return res.status(403).json({ error: "Unauthorized. This is not your blog" });
        }


        // Fetch the blog along with its templates
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

        // Return the updated blog with templates
        return res.status(200).json({message: "Success!", changedBlog: updatedBlog});

    } catch (error) {
        console.log("failed to update template: ", error)
        return res.status(422).json({ error: "failed to update template"});
    }
}

export default async function handler(req, res) {

    switch(req.method) {
        // MAKE SURE USER IS OWNER OR ADMIN, doneee
        case "DELETE": 
            await handlerDelete(req, res);
            return;

        case "PUT":
            await handlerUpdate(req, res);
            return;
        

        default:
            res.setHeader("Allow", ["GET", "DELETE", "PUT"]).status(405).json({ error: "Method " + req.method + " Not Allowed"});
    }
}