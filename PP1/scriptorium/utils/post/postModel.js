// postModel.js

// chatgpt
// prompt:
import prisma from "@/utils/db"

class Post {
  constructor(id, flagged, title, content, published, authorId, upvotes = 0, downvotes = 0) {
    this.id = id
    this.title = title
    this.flagged = flagged
    this.content = content
    this.published = published
    this.authorId = authorId
    this.upvotes = upvotes
    this.downvotes = downvotes
  }

  // Getter for post ID
  getId() {
    return this.id
  }

  getflagged(){
    return this.flagged;
  }

  async setflagged(flag){
    this.flag = flag;
    await prisma.post.update({
        where: { id: this.id },
        data: { flagged: this.flag },
      })
  }
  // Getter for upvotes
  getUpvotes() {
    return this.upvotes
  }

  // Setter for upvotes with database update
  async changeUpvotes(increase) {
    let by = -1;
    if(increase){
        by = 1;
    }
    this.upvotes += by;
    await prisma.post.update({
      where: { id: this.id },
      data: { upvotes: this.upvotes },
    })
  }

  // Getter for downvotes
  getDownvotes() {
    return this.downvotes
  }

  // Setter for downvotes with database update
  async changeDownvotes(increase) {
    let by = -1;
    if(increase){
        by = 1;
    }

    this.downvotes += by;
    
    await prisma.post.update({
      where: { id: this.id },
      data: { downvotes: this.downvotes },
    })
  }

  // Static method to retrieve a Post by ID
  static async fetchById(id) {
    const postData = await prisma.post.findUnique({
      where: { id },
    })
    if (postData) {
      const { id, title, content, published, authorId, upvotes, downvotes } = postData
      return new Post(id, title, content, published, authorId, upvotes, downvotes)
    }
    return null
  }
}

export default Post
