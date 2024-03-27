import { PRISMA } from '../../shared/db';
import { User } from '../../../prisma/generated/type-graphql';
import { Auth0User } from 'shared/auth-types';

export const getOrCreateSessionUser = async (auth0User: Auth0User): Promise<User> => {
  // TODO: Implement Caching on Redis or Faster solution
  // TODO: Extend to pull all the permissions: Client, Org, and Location Permissions
  const user = await PRISMA.user.findUnique({
    where: { email: auth0User.email },
  });

  if (user == null) {
    const newUser = await PRISMA.user.create({
      data: {
        email: auth0User.email,
        auth0Id: auth0User.auth0_id,
        name:"TEST",
        isActive: true,
      },
    });
    return newUser;
  }

  return user;
};
