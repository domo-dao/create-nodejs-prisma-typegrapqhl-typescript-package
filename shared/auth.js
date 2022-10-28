const {userFromRequest} = require("../server/api/middlewares/jwtAuth");
const {PrismaClient} = require('@prisma/client');

/**
 * This where all the permissions should be checked
 * @param root
 * @param args
 * @param context
 * @param info
 * @param roles
 */
class CustomAuthChecker {
    async check(resolverData, permissions) {
        // const { root, args, context, info } = resolverData;
        const {context} = resolverData;

        if (context !== undefined) return true;

        if (context.user == null) {
            return false;
        }

        if (context.user.status !== "ACTIVE") {
            return false;
        }

        if (permissions.length === 0) {
            return true;
        }

        for (let i = 0, j = permissions.length; i < j; i++) {
            const permission = permissions[i];
            const hasAccess = await permission(resolverData);
            // TODO: Revert this. If any is false, return false
            if (hasAccess) {
                return true;
            }
        }
        // no permissions matched, restrict access
        return false;
    }
}

const authChecker = async ({root, args, context, info}, permissions) => {
    return await new CustomAuthChecker().check(
        {root, args, context, info},
        permissions
    );
};


/**
 * This is the context for Grapqhl calls. This gets injected on Custom Resolvers and Queries.
 * For example, if we want the user making the request,  we can use here the request object to pull the token and find the User on our Database
 * @param req
 * @returns {Promise<{prisma, req, user: null}>}
 */
const getGraphqlContext = async options => {
    const {req, res} = options;
    const prisma = new PrismaClient()

    console.dir(prisma);
    console.log(prisma);
    console.log(prisma);
    console.log(prisma);


    const user = await userFromRequest(req, res);
    return {prisma, req, user};
};

module.exports = {
    CustomAuthChecker,
    authChecker,
    getGraphqlContext
};
