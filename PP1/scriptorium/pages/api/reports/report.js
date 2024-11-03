import { authMiddleware } from '../../../lib/auth'; // Authentication middleware
import prisma from '../../../lib/prisma'; // Prisma client instance

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
          return res.status(403).json({ error: 'Forbidden: Admin access required to view reports.' });
        }
        return await handleReportListing(req, res);
      } else if (method === 'PUT') {
        if (!isAdmin) {
          return res.status(403).json({ error: 'Forbidden: Admin access required to hide content.' });
        }
        return await handleContentHiding(req, res);
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
  
  /**
 * @api {post} /api/reports/report Submit a content report
 * @apiName SubmitReport
 * @apiGroup Report
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization User's access token.
 *
 * @apiBody {Number} contentId ID of the content being reported (Blog or Comment).
 * @apiBody {String="BLOG","COMMENT"} contentType Type of the content being reported.
 * @apiBody {String} explanation Explanation for the report.
 *
 * @apiSuccess {String} message Success message.
 * @apiSuccess {Object} report Details of the created report.
 *
 * @apiError (400) InvalidContentType Invalid content type.
 * @apiError (404) ContentNotFound Content to report was not found.
 * @apiError (422) UnprocessableEntity Content could not be provided.
 */
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


  /**
 * @api {get} /api/reports/report Get list of reports (Admin only)
 * @apiName GetReportListing
 * @apiGroup Report
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Admin's access token.
 *
 * @apiParam {Number} [page=1] Page number for pagination.
 * @apiParam {Number} [pageSize=10] Number of items per page.
 *
 * @apiSuccess {Object[]} data Array of reported content with counts.
 * @apiSuccess {Number} meta.totalCount Total number of reports.
 * @apiSuccess {Number} meta.totalPages Total pages.
 * @apiSuccess {Number} meta.currentPage Current page number.
 *
 * @apiError (422) UnprocessableEntity Content could not be provided.
 */
async function handleReportListing(req, res) {
    const { page = 1, pageSize = 10 } = req.query;
    const skip = (page - 1) * pageSize;
    const take = parseInt(pageSize, 10);
  
    try {
      // Step 1: Fetch all reports grouped by contentId and contentType
      const reportGroups = await prisma.report.groupBy({
        by: ['contentId', 'contentType'],
        _count: { contentId: true },
      });
  
      // Step 2: Fetch all reports to get explanations and group by contentId and contentType
      const allReports = await prisma.report.findMany({
        select: {
          contentId: true,
          contentType: true,
          explanation: true,
        },
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
  
      // Step 3: Fetch all blogs and comments
      const [allBlogs, allComments] = await Promise.all([
        prisma.blog.findMany(),
        prisma.comment.findMany(),
      ]);
  
      // Step 4: Combine blogs and comments, attach report count and explanations
      const contentWithReports = [
        ...allBlogs.map(blog => ({
          ...blog,
          contentType: 'BLOG',
          reportCount: reportGroups.find(
            r => r.contentId === blog.id && r.contentType === 'BLOG'
          )?._count.contentId || 0,
          explanations: explanationsByContent[`BLOG-${blog.id}`] || [], // Attach explanations list
        })),
        ...allComments.map(comment => ({
          ...comment,
          contentType: 'COMMENT',
          reportCount: reportGroups.find(
            r => r.contentId === comment.id && r.contentType === 'COMMENT'
          )?._count.contentId || 0,
          explanations: explanationsByContent[`COMMENT-${comment.id}`] || [], // Attach explanations list
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
      console.error('Error in handleReportSubmission:', error);
      res.status(422).json({ error: 'Unprocessable Entity: Unable to process the request.' });
    }
  }
  


  /**
 * @api {put} /api/reports/report Hide reported content (Admin only)
 * @apiName HideContent
 * @apiGroup Report
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Admin's access token.
 *
 * @apiBody {Number} contentId ID of the content to hide (Blog or Comment).
 * @apiBody {String="BLOG","COMMENT"} contentType Type of the content to hide.
 *
 * @apiSuccess {String} message Success message.
 * @apiSuccess {Object} content Updated content details.
 *
 * @apiError (400) InvalidContentType Invalid content type.
 * @apiError (404) ContentNotFound Content to hide was not found.
 * @apiError (422) UnprocessableEntity Content could not be hidden.
 */

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
  