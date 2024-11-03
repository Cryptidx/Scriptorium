import prisma from "@/utils/db"

export default async function handlerCreateComment(req,res,which){
    // create a subcomment 
    if(req.method !== "POST"){
        return res.status(405).json({message: "method not allowed"});
    }

    const author = authMiddleware(req, res);
    if (!author) {
        // could be null, cos we don't have a current user by jwt 
        return res.status(401).json({ message: "Unauthorized. Please log in to create a blog." });
    }

    const { blogId, commentId } = req.query;
    const blog_id = parseInt(blogId);
    const comment_id = which === 1 ? parseInt(commentId) : null; 
    

    if (isNaN(blogId) || (which === 1 && isNaN(commentId))) {
        return res.status(400).json({ error: 'Invalid comment or blog ID' });
    }

    const {description} = req.body;

    //chat gpt
    if (!description || typeof description !== 'string' || description.trim() === '') {
        return res.status(400).json({ message: "Description is required and cannot be empty" });
    }

    let newData = {
        blogId: blogId,
        description: description.trim(),
        author: { connect: { id: author.id } },
    };

    if(which === 1){
        // subcomment
        // Set the parent comment ID for subcomment
        newData.parentId = commentId;
    }

    try {
        // Create the subcomment
        const comment = await prisma.comment.create({
            data: newData
        });

        return res.status(201).json(comment);
    } 
    
    catch (error) {
        return res.status(500).json({ message: "Failed to create comment", error });
    }
}



