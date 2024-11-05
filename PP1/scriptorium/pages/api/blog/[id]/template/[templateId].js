import prisma from "@/utils/db"
import { authMiddleware } from "@/lib/auth";

async function handlerDelete(req, res) {
    // DELETE handler, restricted to users only 
    // expects id and templateId
    if (req.method !== "DELETE") {
        return res.status(405).json({ error: "must use DELETE method"} );
    }

    // authenticates user
    const author = await authMiddleware(req, res, { getFullUser: true } );
    if (!author) {
        return res.status(401).json({ error: "Unauthorized. Please log in to create code." });
    }

    // converts blogId and templateId to a String
    const blogId = parseInt(req.query.id);
    const templateId = parseInt(req.query.templateId);

    // returns error if either id is NaN
    if (isNaN(blogId) || isNaN(templateId)) {
        return res.status(400).json({ error: "Invalid blog or template ID" });
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

        // returns error if template does not exist
        if (!template) {
            return res.status(404).json({ error: "Not a valid template ID" })
        }

        // gets blog from given blogId
        const blog = await prisma.blog.findUnique({
            where: { id: blogId }
        });

        // returns error if blog does not exist
        if (!blog) {
            return res.status(404).json({ error: "Not a valid blog ID" })
        }

        // returns error if user is not an admin or if not the author of the blog
        if (author.role !== "SYS_ADMIN" && author.id !== blog.authorId) {
            return res.status(403).json({error: "You do not have correct permission"});
        }

        // removes template from blog
        const updatedBlog = await prisma.blog.update({
            where: { id: blogId },
            data: {
                templates: {
                    disconnect: [{id: template.id}], // disconnect due to many-to-many relation
                }
            }, 
            include: {
                templates: true,
            },
        });

        // returns the updated blog
        return res.status(200).json({ message: "Successfully removed template", blog: updatedBlog});
        // Return the found template
        return res.status(200).json({message: "Success!", changedBlog: updatedBlog});

    } catch (error) {
        console.log("failed to delete template: ", error)
        return res.status(422).json({ error: "failed to delete template"});
    }
}

async function handlerUpdate(req, res) {
    // PUT handler, restricted to users only 
    // expects id and templateId
    if (req.method !== "PUT") {
        return res.status(405).json({ error: "must use PUT method"} );
    }

    // authenticates user
    const author = await authMiddleware(req, res, { getFullUser: true } );
    if (!author) {
        return res.status(401).json({ error: "Unauthorized. Please log in to create code." });
    }

    // converts blogId and templateId to a String
    const blogId = parseInt(req.query.id);
    const templateId = parseInt(req.query.templateId);

    // returns error if either id is NaN
    if (isNaN(blogId) || isNaN(templateId)) {
        return res.status(400).json({ error: "Invalid blog or template ID" });
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

        // returns error if template does not exist
        if (!template) {
            return res.status(404).json({ error: "Not a valid template ID" })
        }

        // gets blog from given blogId
        const blog = await prisma.blog.findUnique({
            where: { id: blogId }
        });

        // returns error if blog does not exist
        if (!blog) {
            return res.status(404).json({ error: "Not a valid blog ID" })
        }

        // returns error if user is not an admin or if not the author of the blog
        if (author.role !== "SYS_ADMIN" && author.id !== blog.authorId) {
            return res.status(403).json({error: "You do not have correct permission"});
        }

        const updatedBlog = await prisma.blog.update({
        where: { id: blogId },
            data: {
                templates: {
                    connect: {id: template.id}, // connect due to many-to-many relation
                }
            }, 
            include: {
                templates: true,
            },
        });

        // returns the updated blog
        return res.status(200).json({ message: "Successfully added template", blog: updatedBlog});

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
            return res.status(405).json({ error: "must use DELETE or PUT method"} );
    }
}