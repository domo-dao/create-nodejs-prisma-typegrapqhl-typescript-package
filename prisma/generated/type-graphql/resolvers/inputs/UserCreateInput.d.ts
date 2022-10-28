import { PostCreateNestedManyWithoutAuthorInput } from "../inputs/PostCreateNestedManyWithoutAuthorInput";
export declare class UserCreateInput {
    email: string;
    name: string;
    posts?: PostCreateNestedManyWithoutAuthorInput | undefined;
}
