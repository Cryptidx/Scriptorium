import prisma from "@/utils/db";

// Function to process tags
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
