import { authMiddleware } from '../../../lib/auth'; // Authentication middleware
import prisma from '../../../lib/prisma'; // Prisma client instance

/* GPT: based on my model and the report use cases, can you
make me handler heler functions for the generla handler for 
1) when any user wants to make a report 
2) when the sys admin wants to view by most flgged */
export default async function handler(req, res) {
    try {
      const { method } = req;
  
      // For POST (report submission), only use userId
      if (method === 'POST') {
        const { userId } = await authMiddleware(req, res);
        if (!userId) return; // authMiddleware already handled the response if unauthorized
  
        return await handleReportSubmission(req, res, userId);
      }
  
      // For GET and PUT (admin actions), get the full user object
      const user = await authMiddleware(req, res, { getFullUser: true });
      if (!user) return; // If unauthorized, authMiddleware handles the response
  
      const isAdmin = user.role === 'SYS_ADMIN';
  
      if (method === 'GET') {
        if (!isAdmin) {
          return res.status(403).json({ error: 'Forbidden: Permission denied.' });
        }
        return await handleReportListing(req, res);
      } else {
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
      }
    } catch (error) {
      console.error('Error in handler:', error);
  
      // Customize error responses based on the scenario
      if (error.message.includes('not found')) {
        res.status(404).json({ error: 'Resource not found' });
      } else if (error.message.includes('validation')) {
        res.status(400).json({ error: 'Bad Request: Validation error' });
      } else {
        res.status(422).json({ error: 'Unprocessable Entity: Unable to complete the action.' });
      }
    }
  }
  

// Handler to allow users to create reports
async function handleReportSubmission(req, res, userId) {
    try {
        const { contentId, contentType, explanation } = req.body;

        // Validate contentType
        if (!['BLOG', 'COMMENT'].includes(contentType)) {
            return res.status(400).json({ error: 'Invalid content type. Must be "BLOG" or "COMMENT".' });
        }

        // Validate contentId by checking if the content exists in the appropriate table
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

        if (!contentExists) {
            return res.status(404).json({ error: 'Content not found.' });
        }

        // Create a new report in the database
        const newReport = await prisma.report.create({
            data: {
            contentId,
            contentType,
            explanation,
            authorId: userId, // Use userId directly for authorId
            },
        });

        res.status(201).json({ message: 'Report submitted successfully', report: newReport });

    } catch (error) {
      console.error('Error in handleReportSubmission:', error);
      res.status(422).json({ error: 'Unprocessable Entity: Unable to create the report.' });
    }
}

/* GPT : Create a handler for the report listing for sys admin but
based on if the sys admin wants ot view both comments and blogs, or only one of the options */
async function handleReportListing(req, res) {
    const { page = 1, pageSize = 10, contentType = 'BOTH' } = req.query; // Allow contentType to be 'BLOG', 'COMMENT', or 'BOTH'
    const skip = (page - 1) * pageSize;
    const take = parseInt(pageSize, 10);

    try {
        // Step 1: Fetch report groups based on the contentType filter
        const reportGroups = await prisma.report.groupBy({
            by: ['contentId', 'contentType'],
            _count: { contentId: true },
            where: contentType === 'BOTH' ? {} : { contentType },
        });

        // Step 2: Fetch all reports to get explanations and group by contentId and contentType
        const allReports = await prisma.report.findMany({
            select: {
                contentId: true,
                contentType: true,
                explanation: true,
            },
            where: contentType === 'BOTH' ? {} : { contentType },
        });

        // Group explanations by contentId and contentType for easier lookup
        const explanationsByContent = allReports.reduce((acc, report) => {
            const key = `${report.contentType}-${report.contentId}`;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(report.explanation);
            return acc;
        }, {});

        // Step 3: Fetch blogs or comments based on the contentType filter
        let allBlogs = [], allComments = [];
        if (contentType === 'BOTH' || contentType === 'BLOG') {
            allBlogs = await prisma.blog.findMany();
        }
        if (contentType === 'BOTH' || contentType === 'COMMENT') {
            allComments = await prisma.comment.findMany();
        }

        // Step 4: Combine blogs and comments, attach report count and explanations
        const contentWithReports = [
            ...allBlogs.map(blog => ({
                ...blog,
                contentType: 'BLOG',
                reportCount: reportGroups.find(
                    r => r.contentId === blog.id && r.contentType === 'BLOG'
                )?._count.contentId || 0,
                explanations: explanationsByContent[`BLOG-${blog.id}`] || [],
            })),
            ...allComments.map(comment => ({
                ...comment,
                contentType: 'COMMENT',
                reportCount: reportGroups.find(
                    r => r.contentId === comment.id && r.contentType === 'COMMENT'
                )?._count.contentId || 0,
                explanations: explanationsByContent[`COMMENT-${comment.id}`] || [],
            })),
        ];

        // Step 5: Sort combined content by report count in descending order
        const sortedContent = contentWithReports.sort((a, b) => b.reportCount - a.reportCount);

        // Step 6: Paginate the sorted results
        const paginatedContent = sortedContent.slice(skip, skip + take);

        // Step 7: Prepare pagination metadata
        const totalCount = contentWithReports.length;
        const totalPages = Math.ceil(totalCount / pageSize);

        res.status(200).json({
            data: paginatedContent,
            meta: {
                totalCount,
                totalPages,
                currentPage: parseInt(page, 10),
                pageSize: take,
            },
        });
    } catch (error) {
        console.error('Error in handleReportListing:', error);
        res.status(422).json({ error: 'Unprocessable Entity: Unable to process the request.' });
    }
}
