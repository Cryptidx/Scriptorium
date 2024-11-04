import prisma from "@/utils/db";

// Function to process tags during creation/update of blog/comment

/* GPT: Create a helper based on my model for Tags knowing I 
need to create a tag if it doesn't exist and return tag id's 
for the blogs / templates to process for their enteries in the db */
async function processTags(tags) {
    return await Promise.all(tags.map(async (tagName) => {
        const existingTag = await prisma.tag.findUnique({ where: { name: tagName } });
        if (existingTag) {
            return { id: existingTag.id };
        } else {
            const newTag = await prisma.tag.create({ data: { name: tagName } });
            return { id: newTag.id };
        }
    }));
}

export default processTags;
