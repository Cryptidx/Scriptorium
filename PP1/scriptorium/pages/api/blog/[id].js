// delete a blog by id 
// will deleting a blog delete its associated comments?
async function handlerDelete(req,res){
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
    const { id } = req.query;
    const {title, description, tags, templates} = req.body;

    if (req.method !== 'PUT') {
        return res.setHeader('Allow', ['PUT']).status(405).end(`Method ${method} Not Allowed`);
    }

    const blogId = parseInt(id);
    if (isNaN(blogId)) {
        return res.status(400).json({ error: 'Invalid blog ID' });
    }


    // we'd want to edit (like change directly)
    // description
    // tag
    // title 
    // link 
    // upvotes
    // downvotes
    // flagged attribute 
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