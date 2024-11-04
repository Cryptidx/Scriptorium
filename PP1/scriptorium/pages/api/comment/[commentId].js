import prisma from "@/utils/db"
import {authMiddleware} from "@/lib/auth";


/* 
UPDATE COMMENTS IDENTIFIABLE BY COMMENT ID 
ALSO, DELETE COMMENTS (doesn't really delete them, but changes their flag for 
)
 */
export default async function handler(req,res){
    // this should update top level and sub level commets 
    // cos all we need is comment id tbh

    // authorized action
    if (req.method !== 'PUT') {
        return res.setHeader('Allow', ['PUT']).status(405).end(`Method ${method} Not Allowed`);
    }

    try{
        const author = await authMiddleware(req, res, { getFullUser: true });
        if (!author){
            return res.status(403).json({ message: "Permission denied" });
        }
        
        const commentId = req.query.commentId;
        const comment_id = parseInt(commentId);

        if (isNaN(comment_id)) {
            return res.status(400).json({ error: 'Invalid comment ID' });
        }

        const comment = await prisma.comment.findUnique({
            where: { id: comment_id},
        });

        if (!comment) {
            return res.status(404).json({ error: 'comment not found' });
        }

        const isAdmin = author.role === "SYS_ADMIN"
        const isAuthor = author.id === comment.authorId

        if (comment.flagged && !isAdmin) {
            return res.status(403).json({ message: "Permission denied, flagged blog" });
        }


        const {description,upvotes,downvotes,flagged} = req.body;
        const updateData = {};

        if (description !== undefined){
            if(typeof description !== 'string' || description.trim() == ''){
                return res.status(400).json({ message: "Description must be a non-empty string" });
            }
            updateData.description = description.trimEnd();
        } 

    
        if (flagged !== undefined && isAdmin){
            if(typeof flagged !== 'boolean'){
                return res.status(400).json({ message: "Flagged must be a boolean" });
            }
            updateData.flagged = flagged; 
        } 

        // atp, we should short circuit, if we are neither 
        if(!isAdmin && !isAuthor){
            if(description || flagged){
                // if theres stuff in here
                return res.status(403).json({ message: "Permission denied, only upvotes and downvotes" });
            }
        }

        if (upvotes !== undefined) updateData.upvotes = upvotes;
        if (downvotes !== undefined) updateData.downvotes = downvotes;


        if(Object.keys(updateData).length === 0){
            return res.status(200).json({ message: "Nothing provided to update" });
        }

        const updatedComment = await prisma.comment.update({
            where: {id: comment_id},
            data : updateData,
        })

        // can this return empty? no cos i checked its existence before
        return res.status(200).json(updatedComment);

    }

    catch(error){
        return res.status(422).json({ message: "Failed to update comment", error });
    }

}