import prisma from "@/utils/db"
import { authMiddleware } from "@/lib/auth";

export default async function handlerCreateComment(req,res,which){
    // create a subcomment 
    if(req.method !== "POST"){
        return res.status(405).json({message: "method not allowed"});
    }

    try{
        let {userId} = await authMiddleware(req, res);
        const author = userId;
        if (!author) {
            // could be null, cos we don't have a current user by jwt 
            return res.status(401).json({ message: "Unauthorized. Please log in to create a blog." });
        }

        const blogId = req.query.id;
        const commentId = req.query.commentId;
    

        //console.log("my id is" + blogId);

        const blog_id = parseInt(blogId);
        const comment_id = which === 1 ? parseInt(commentId) : null; 

        if (isNaN(blog_id) || (which === 1 && isNaN(comment_id))) {
            return res.status(400).json({ error: 'Invalid comment or blog ID' });
        }
    
        const {description} = req.body;

        if (!description || typeof description !== 'string' || description.trim() === '') {
            return res.status(400).json({ message: "Description is required and cannot be empty" });
        }
    
        let newData = {
            // blogId: blog_id,
            blog: { connect: { id: blog_id } },
            description: description.trim(),
            author: { connect: { id: author } },
        };
    
        if(which === 1){
            // subcomment
            // Set the parent comment ID for subcomment
            //newData.parentId = comment_id;
            newData.parent = { connect: { id: comment_id } };
        }

        const comment = await prisma.comment.create({
            data: newData
        });

        return res.status(201).json(comment);
    }

    catch(error){
        console.log(error);
        return res.status(422).json({ message: "Failed to create comment", error_msg: error});
    }   

}



