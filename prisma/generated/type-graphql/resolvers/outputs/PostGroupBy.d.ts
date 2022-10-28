import { PostAvgAggregate } from "../outputs/PostAvgAggregate";
import { PostCountAggregate } from "../outputs/PostCountAggregate";
import { PostMaxAggregate } from "../outputs/PostMaxAggregate";
import { PostMinAggregate } from "../outputs/PostMinAggregate";
import { PostSumAggregate } from "../outputs/PostSumAggregate";
export declare class PostGroupBy {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    published: boolean;
    title: string;
    content: string | null;
    authorId: number;
    _count: PostCountAggregate | null;
    _avg: PostAvgAggregate | null;
    _sum: PostSumAggregate | null;
    _min: PostMinAggregate | null;
    _max: PostMaxAggregate | null;
}
