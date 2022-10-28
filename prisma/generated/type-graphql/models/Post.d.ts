import { User } from "../models/User";
export declare class Post {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    published: boolean;
    title: string;
    content?: string | null;
    author?: User;
    authorId: number;
}
