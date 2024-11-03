import prisma from "@/utils/db"
// someone knows the template id within the blog (which we also know the id)
// it can be passed in as a param 

// we search through this blog's templates
// use the template id to get the one that we want in particular 
// so we do the "pressing a link to get the template use case"
// we need another endpoint to add a template to a blog (greg will handle)

/*
GET TEMPLATE FROM BLOGS LIST OF TEMPLATES (use case: I click on a template link 
    and want to get the information for one template out of the many templates 
    i add)
*/

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const blogId = parseInt(req.query.blogId);
  const templateId = parseInt(req.query.templateId);

  // Validate IDs
  if (isNaN(blogId) || isNaN(templateId)) {
    return res.status(400).json({ message: "Invalid blog or template ID" });
  }

  try {
    // Fetch the blog along with its templates
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: {
        templates: true, // Get the templates associated with this blog
      },
    });

    // If blog not found
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Find the specific template within the blog’s templates
    const template = blog.templates.find(template => template.id === templateId);

    // If the template doesn't exist within this blog
    if (!template) {
      return res.status(404).json({ message: "Template not found in this blog" });
    }

    // Return the found template
    return res.status(200).json(template);

  } catch (error) {
    console.error("Error fetching template:", error);
    return res.status(500).json({ message: "Error fetching template", error });
  }
}
