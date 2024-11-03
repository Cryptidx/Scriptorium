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

    const { blog_id, comment_id } = req.query;
    const commentId = parseInt(comment_id);
    const blogId = parseInt(blog_id);

    if (isNaN(commentId) || isNaN(blogId)) {
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
        const subcomment = await prisma.comment.create({
            data: newData
        });

        return res.status(201).json(subcomment);
    } 
    
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to create subcomment", error });
    }
}



