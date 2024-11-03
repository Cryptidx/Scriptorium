import prisma from "@/utils/db"

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

    if (isNaN(bookId)) {
        return res.status(400).json({ error: 'Invalid book ID' });
    }

    try {
        // Check if the book exists
        const blog = await prisma.blog.findUnique({
          where: { id: blogId },
        });
    
        if (!blog) {
          return res.status(404).json({ error: 'Blog not found' });
        }
    
        // Delete the book
        await prisma.blog.delete({
          where: { id: blogId },
        });
    
        return res.status(200).json({ message: 'Blog was deleted successfully.' });
    } 

    catch (error) {
        return res.status(500).json({ error: 'Failed to delete blog' });
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


    // we'd want to edit (like change directly)
    // title 
    // description
    // tag
    // flagged attribute 
    // upvotes
    // downvotes

    const {title, description, tag, flagged, upvotes, downvotes} = req.body;
    const updateData = {};

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


    if (tags !== undefined){
        // CHAT GPT 
        if (!Array.isArray(tag) || tag.length === 0 || tag.some(tag => typeof tag !== 'string' || tag.trim() === '')) {
            return res.status(400).json({ message: "Tags must be a non-empty array of non-empty strings" });
        }
        updateData.tags = JSON.stringify(tag.map(tag => tag.trim()));  // Ensure tags are JSON-formatted
    } 


    if (flagged !== undefined){
        if(typeof flagged !== 'boolean'){
            return res.status(400).json({ message: "Flagged must be a boolean" });
        }
        updateData.flagged = flagged;
    } 

    if (upvotes !== undefined) updateData.upvotes = upvotes;
    if (downvotes !== undefined) updateData.downvotes = downvotes;

    if(Object.keys(updateData).length === 0){
        return res.status(200).json({ message: "Nothing provided to update" });
    }
    
    try{
        const updatedBlog = await prisma.blog.update({
            where: {id: blogId},
            data : updateData,
        })

        return res.status(200).json(updatedBlog);
    }

    catch(error){
        return res.status(500).json({ message: "Failed to update blog post", error });
    }
    
    // when it comes to editing comments, use other pathway 
    // when it comes to editing the template links, another pathway
}


export default async function handler(req, res) {
    // delete and update are restricted pathways 

    const author = authMiddleware(req, res);
    if (!author) {
        // could be null, cos we don't have a current user by jwt 
        return res.status(401).json({ message: "Unauthorized. Please log in to create a blog." });
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