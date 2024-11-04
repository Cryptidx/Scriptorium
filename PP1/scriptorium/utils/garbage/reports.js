/*else if (method === 'PUT') {
        if (!isAdmin) {
          return res.status(403).json({ error: 'Forbidden: Permission denied.' });
        }
        return await handleContentHiding(req, res);
      } */

/*
  async function handleContentHiding(req, res) {
    try {
      const { contentId, contentType } = req.body;
  
      if (!['BLOG', 'COMMENT'].includes(contentType)) {
        return res.status(400).json({ error: 'Invalid content type. Must be "BLOG" or "COMMENT".' });
      }

      // Check if the content exists in the specified table
        let contentExists = false;
        if (contentType === 'BLOG') {
        contentExists = await prisma.blog.findUnique({
            where: { id: contentId },
        });
        } else if (contentType === 'COMMENT') {
        contentExists = await prisma.comment.findUnique({
            where: { id: contentId },
        });
        }

        // Return an error if the content does not exist
        if (!contentExists) {
        return res.status(404).json({ error: 'Content not found. Unable to hide non-existent content.' });
        }
  
      // Flag the content
        const updatedContent = contentType === 'BLOG'
        ? await prisma.blog.update({
            where: { id: contentId },
            data: { flagged: true },
        })
        : await prisma.comment.update({
            where: { id: contentId },
            data: { flagged: true },
        });
  
      res.status(200).json({ message: 'Content flagged successfully', content: updatedContent });
    } catch (error) {
      console.error('Error in handleContentHiding:', error);
      res.status(422).json({ error: 'Unprocessable Entity: Unable to hide content.' });
    }
  }
  */