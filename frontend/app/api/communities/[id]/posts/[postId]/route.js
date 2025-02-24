import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { id, postId } = await params;
        const communityId = parseInt(id);
        const postIdInt = parseInt(postId);

        // Vérifier que l'utilisateur est membre de la communauté
        // const membershipAsLearner = await prisma.community_learners.findFirst({
        //     where: {
        //         community_id: communityId,
        //         learner_id: parseInt(session.user.id)
        //     }
        // });





        const isInThisCommunity = await prisma.community.findFirst({
            where: {
                OR: [
                    { creator_id: parseInt(session.user.id) },
                    {
                        community_contributors: {
                            some: {
                                contributor_id: parseInt(session.user.id)
                            }
                        }
                    },
                    {
                        community_learners: {
                            some: {
                                learner_id: parseInt(session.user.id)
                            }
                        }
                    }
                ]
            }
        })

        if (!isInThisCommunity) {
            return NextResponse.json(
                { error: "Vous n'êtes pas membre de cette communauté" },
                { status: 403 }
            );
        }

        // Récupérer le post avec les informations de l'auteur
        const post = await prisma.community_posts.findUnique({
            where: {
                id: postIdInt,
                community_id: communityId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        profilePicture: true
                    }
                }
            }
        });

        if (!post) {
            return NextResponse.json(
                { error: "Post non trouvé" },
                { status: 404 }
            );
        }

        return NextResponse.json(post);
    } catch (error) {
        console.log("Erreur lors de la récupération du post:", error.stack);
        return NextResponse.json(
            { error: "Erreur lors de la récupération du post" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { id, postId } = await params;
        const { title, content, cover_image_url, tag, accept_contributions } = await request.json();
        const communityId = parseInt(id);
        const postIdInt = parseInt(postId);
        const userId = parseInt(session.user.id);

        // Vérifier que l'utilisateur est l'auteur du post
        const post = await prisma.community_posts.findUnique({
            where: { id: postIdInt }
        });

        if (!post || post.author_id !== userId) {
            return NextResponse.json(
                { error: "Non autorisé à modifier ce post" },
                { status: 403 }
            );
        }

        // Mettre à jour le post
        const updatedPost = await prisma.community_posts.update({
            where: { id: postIdInt },
            data: {
                title,
                content,
                cover_image_url,
                tag,
                accept_contributions
            }
        });

        return NextResponse.json(updatedPost);
    } catch (error) {
        console.error("Erreur lors de la modification du post:", error);
        return NextResponse.json(
            { error: "Erreur lors de la modification du post" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
} 