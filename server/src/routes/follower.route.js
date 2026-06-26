import expres from 'express'
import { verifyUser } from '../middlewares/user.middleware.js';
import { checkFollowing, countFollowers, countFollowing, followSomeone, unfollowSomeone } from '../controllers/followers.controller.js';
const FollowersRoute = expres.Router();
FollowersRoute.post('/add-followers', verifyUser, followSomeone);
FollowersRoute.post('/unfollow', verifyUser, unfollowSomeone);
FollowersRoute.post('/followers-count', verifyUser, countFollowers);
FollowersRoute.post('/following-count', verifyUser, countFollowing);
FollowersRoute.post('/check-follow', verifyUser, checkFollowing);

export default FollowersRoute;