import prisma from "@/utils/db"
import handlerCreateComment from "@/utils/comment/create-comment";

// export default async function handlerCreate(req,res){
//     // create a subcomment 
//     if(req.method !== "POST"){
//         return res.status(405).json({message: "method not allowed"});
//     }

//     const author = authMiddleware(req, res);
//     if (!author) {
//         // could be null, cos we don't have a current user by jwt 
//         return res.status(401).json({ message: "Unauthorized. Please log in to create a blog." });
//     }

//     const { blog_id, comment_id } = req.query;
//     const commentId = parseInt(comment_id);
//     const blogId = parseInt(blog_id);

//     if (isNaN(commentId) || isNaN(blogId)) {
//         return res.status(400).json({ error: 'Invalid comment or blog ID' });
//     }

//     const {description} = req.body;

//     //chat gpt
//     if (!description || typeof description !== 'string' || description.trim() === '') {
//         return res.status(400).json({ message: "Description is required and cannot be empty" });
//     }

//     try {
//         // Create the subcomment
//         const subcomment = await prisma.comment.create({
//             data: {
//                 blogId: blogId,
//                 description: description.trim(),
//                 author: { connect: { id: author.id } },
//                 parentId: commentId // Set the parent comment ID for subcomment
//             }
//         });

//         return res.status(201).json(subcomment);
//     } 
    
//     catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: "Failed to create subcomment", error });
//     }
    
    
// }


export default async function handler(req,res){
    // how do we do nesting common functions?

    // how do we await?

    return handlerCreateComment(req,res,1);
}


