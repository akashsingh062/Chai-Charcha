export * from './User';
export * from './Post';
export * from './Comment';
export * from './Community';
export * from './Notification';
export * from './Report';
export * from './Meetup';

import { User } from './User';
import { Post } from './Post';
import { Comment } from './Comment';
import { Community } from './Community';
import { Notification } from './Notification';
import { Report } from './Report';
import { Meetup } from './Meetup';

export {
    User as userSchema,
    Post as postSchema,
    Comment as commentSchema,
    Community as communitySchema,
    Notification as notificationSchema,
    Report as reportSchema,
    Meetup as meetupSchema
};
