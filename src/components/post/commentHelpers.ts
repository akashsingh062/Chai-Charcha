import { Comment } from "../../app/(main)/post/postData";

/**
 * Recursively inserts a new reply comment at the target parentId.
 * Modifies the array in place or returns whether insertion succeeded.
 */
export const insertReply = (comments: Comment[], parentId: string, newReply: Comment): boolean => {
  for (let i = 0; i < comments.length; i++) {
    if (comments[i].id === parentId) {
      if (!comments[i].replies) {
        comments[i].replies = [];
      }
      comments[i].replies!.push(newReply);
      return true;
    }
    if (comments[i].replies && comments[i].replies!.length > 0) {
      const found = insertReply(comments[i].replies!, parentId, newReply);
      if (found) return true;
    }
  }
  return false;
};

/**
 * Recursively updates comment content at targetId.
 */
export const updateComment = (comments: Comment[], targetId: string, newContent: string): boolean => {
  for (let i = 0; i < comments.length; i++) {
    if (comments[i].id === targetId) {
      comments[i].content = newContent;
      return true;
    }
    if (comments[i].replies && comments[i].replies!.length > 0) {
      const found = updateComment(comments[i].replies!, targetId, newContent);
      if (found) return true;
    }
  }
  return false;
};

/**
 * Recursively deletes comment node at targetId.
 */
export const removeComment = (comments: Comment[], targetId: string): boolean => {
  for (let i = 0; i < comments.length; i++) {
    if (comments[i].id === targetId) {
      comments.splice(i, 1);
      return true;
    }
    if (comments[i].replies && comments[i].replies!.length > 0) {
      const found = removeComment(comments[i].replies!, targetId);
      if (found) return true;
    }
  }
  return false;
};

/**
 * Recursively upvotes a comment at targetId.
 */
export const voteComment = (comments: Comment[], targetId: string): boolean => {
  for (let i = 0; i < comments.length; i++) {
    if (comments[i].id === targetId) {
      comments[i].upvotes += 1;
      return true;
    }
    if (comments[i].replies && comments[i].replies!.length > 0) {
      const found = voteComment(comments[i].replies!, targetId);
      if (found) return true;
    }
  }
  return false;
};

/**
 * Recursively counts all nodes in a comment subtree (parent + all descendent replies).
 */
export const countTotalSubNodes = (node: Comment): number => {
  let count = 1;
  if (node.replies) {
    for (const r of node.replies) {
      count += countTotalSubNodes(r);
    }
  }
  return count;
};

/**
 * Recursively finds targetId in nodes and returns the total sub-nodes in its subtree.
 */
export const findNodeAndGetCount = (nodes: Comment[], targetId: string): number => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === targetId) {
      return countTotalSubNodes(nodes[i]);
    }
    if (nodes[i].replies) {
      const count = findNodeAndGetCount(nodes[i].replies!, targetId);
      if (count > 0) return count;
    }
  }
  return 0;
};
