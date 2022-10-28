const {
    FindFirstPostResolver,
    FindFirstUserResolver,
} = require('../prisma/generated/type-graphql');
const {Authorized} = require('type-graphql');
const {applyResolversEnhanceMap} = require('../prisma/generated/type-graphql');
const {ALL_ROLES, MANAGER_ROLES} = require('../server/constants/app.constants');

const resolvers = [
    // User
    FindFirstPostResolver,
    // POST
    FindFirstUserResolver
];

const permission = (roles) => {
    return (resolverData) => {
        if (!roles) return true;
        const {
            context: {user},
        } = resolverData;
        if (!user.role || !user.role.role) {
            return false;
        }
        return roles.includes(user.role.role);
    };
};

const resolversEnhanceMap = {
    User: {
        findFirstUser: [Authorized(permission(ALL_ROLES))],
    },
    Post: {
        findFirstPost: [Authorized(permission(MANAGER_ROLES))],
    },
};

applyResolversEnhanceMap(resolversEnhanceMap);

module.exports = {resolvers};
