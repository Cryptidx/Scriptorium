import handlerSorting from "@/utils/comment/sorted-rating";

export default async function handler(req, res) {
    // GET request: get topmost comments everywhere
    // not restricted 
    await handlerSorting(req,res,2);
}
