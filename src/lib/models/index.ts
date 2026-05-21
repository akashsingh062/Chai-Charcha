export * from './User';
export * from './Post';
export * from './Comment';
export * from './Community';
export * from './Notification';
export * from './Report';

import { User } from './User';
import { Post } from './Post';
import { Comment } from './Comment';
import { Community } from './Community';
import { Notification } from './Notification';
import { Report } from './Report';

export {
    User as userSchema,
    Post as postSchema,
    Comment as commentSchema,
    Community as communitySchema,
    Notification as notificationSchema,
    Report as reportSchema
};
