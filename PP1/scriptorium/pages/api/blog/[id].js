import prisma from "@/utils/db"
import processTags from "@/lib/helpers/create_tags";
import { authMiddleware } from "@/lib/auth";


/*
DELETE AND UPDATE BLOG FOUND BY BLOG ID
*/

// delete a blog by id 
// will deleting a blog delete its associated comments? i think so 
async function handlerDelete(req,res){
    // do we delete coressponding relations
    const { id } = req.query;

    if(req.method !== 'DELETE'){
        return res.setHeader('Allow', ['DELETE']).status(405).end(`Method ${method} Not Allowed`);
    }

    const blogId = parseInt(id);

    if (isNaN(blogId)) {
        return res.status(400).json({ error: 'Invalid blog ID' });
    }

    try {
        // Check if the blog exists
        const blog = await prisma.blog.findUnique({
          where: { id: blogId },
        });
    
        if (!blog) {
          return res.status(404).json({ error: 'Blog not found' });
        }

        // Check permissions
        const author = await authMiddleware(req, res, { getFullUser: true });
        if (!author || (author.role !== 'SYS_ADMIN' && author.id !== blog.authorId)) {
            return res.status(403).json({ message: "Permission denied" });
        }
    
        // Delete the blog
        await prisma.blog.delete({
          where: { id: blogId },
        });
    
        return res.status(200).json({ message: 'Blog was deleted successfully.' });
    } 

    catch (error) {
        console.error("Error deleting blog:", error);
        return res.status(422).json({ message: "Unprocessable entity: Unable to delete the blog" });
    }

}

// update the blog post
async function handlerUpdate(req,res){
    if (req.method !== 'PUT') {
        return res.setHeader('Allow', ['PUT']).status(405).end(`Method ${method} Not Allowed`);
    }

    const { id } = req.query;
    const blogId = parseInt(id);

    if (isNaN(blogId)) {
        return res.status(400).json({ error: 'Invalid blog ID' });
    }

    const {title, description, tags, flagged, upvotes, downvotes} = req.body;
    const updateData = {};

    // Validate title and description if provided
    if (title !== undefined){
        if(typeof title !== 'string' || title.trim() == ''){
            return res.status(400).json({ message: "Title must be a non-empty string" });
        }

        updateData.title = title.trimEnd();
    } 

    if (description !== undefined){
        if(typeof description !== 'string' || description.trim() == ''){
            return res.status(400).json({ message: "Description must be a non-empty string" });
        }
        updateData.description = description.trimEnd();
    } 


    // Process tags if provided
    if (tags !== undefined) {
        if (!Array.isArray(tags) || tags.length === 0 || tags.some(tag => typeof tag !== 'string' || tag.trim() === '')) {
            return res.status(400).json({ message: "Tags must be a non-empty array of non-empty strings" });
        }

        try {
            // Use processTags to ensure tags exist and get connect array
            const tagConnectArray = await processTags(tags);
            updateData.tags = { set: tagConnectArray };  // Use set to update tags
        } catch (error) {
            console.error("Error processing tags:", error);
            return res.status(422).json({ message: "Unprocessable entity: Unable to process tags" });
        }
    }

    if (upvotes !== undefined) updateData.upvotes = upvotes;
    if (downvotes !== undefined) updateData.downvotes = downvotes;

    if(Object.keys(updateData).length === 0){
        return res.status(200).json({ message: "Nothing provided to update" });
    }
    
    try{
        const blog = await prisma.blog.findUnique({
            where: { id: blogId },
        });

        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Check permissions
        const user = await authMiddleware(req, res, { getFullUser: true });
        if (!user ) {
            return res.status(403).json({ message: "Permission denied" });
        }

        const isAdmin = user.role === 'SYS_ADMIN';
        const isAuthor = user.id === blog.authorId;

        // Restrict to upvotes/downvotes if not admin and not author
        if (!isAdmin && !isAuthor) {
            if (title || description || tags || flagged !== undefined) {
                return res.status(403).json({ message: "Permission denied. Only upvotes/downvotes can be updated." });
            }
        }

        // Prevent non-admins from updating flagged blogs
        if (blog.flagged && !isAdmin) {
            return res.status(403).json({ message: "Permission denied. Flagged blog." });
        }

        // Only SYS_ADMIN can update the flagged status
        if (flagged !== undefined && isAdmin) {
            if (typeof flagged !== 'boolean') {
                return res.status(400).json({ message: "Flagged must be a boolean value" });
            }
            updateData.flagged = flagged;
        }

        const updatedBlog = await prisma.blog.update({
            where: {id: blogId},
            data : updateData,
            include: { tags: true, templates: true },
        });

        return res.status(200).json({message: "Blog updated successfully.", blog: updatedBlog });
    }

    catch(error){
        console.error("Error updating blog:", error);
        return res.status(422).json({ message: "Unprocessable entity: Unable to update the blog" });
    }
    
    // when it comes to editing comments, use other pathway 
    // when it comes to editing the template links, other pathway
}


export default async function handler(req, res) {
    // delete and update are restricted pathways 
    try{
        const author = await authMiddleware(req, res);
        if (!author) {
            // could be null, cos we don't have a current user by jwt 
            return res.status(401).json({ message: "Unauthorized. Please log in to create a blog." });
        }
    }
    
    catch(error){
        return res.status(422).json({ message: "Failed to find current user", error });
    }

    let method = req.method;
    switch(method){
        case "DELETE":
            await handlerDelete(req,res);
            return

        case "PUT":
            await handlerUpdate(req,res);
            return  
    }

    return res.status(400).json({ error: `Method ${method} Not Allowed`});
}