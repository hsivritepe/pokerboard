import {
    Prisma,
    User,
    GameSession,
    PlayerSession,
} from '@prisma/client';

export type GameSessionWithRelations = GameSession & {
    host: User;
    participants: (PlayerSession & {
        user: User;
    })[];
    _count: {
        participants: number;
    };
};

export type UserWithAdmin = User & {
    isAdmin: boolean;
};
