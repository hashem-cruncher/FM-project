import { NextResponse } from 'next/server';

// Temporary in-memory storage until database is set up
let progress = new Map();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { user_id, level_id, progress: progressValue, completed, unlock_next_level, learned_items } = body;

        if (!user_id || !level_id) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        // Store progress in memory (temporary solution)
        const progressKey = `user-${user_id}-level-${level_id}`;
        const progressData = {
            user_id,
            level_id,
            level_progress: progressValue,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
            learned_items,
            unlock_next_level
        };

        progress.set(progressKey, progressData);

        return NextResponse.json({
            success: true,
            data: progressData
        });
    } catch (error) {
        console.error('Error updating progress:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const user_id = url.searchParams.get('user_id');
        const level_id = url.searchParams.get('level_id');

        if (!user_id) {
            return new NextResponse('Missing user_id', { status: 400 });
        }

        // Get progress for specific level or all levels
        const userProgress = Array.from(progress.entries())
            .filter(([key]) => key.startsWith(`user-${user_id}`))
            .map(([_, value]) => value);

        if (level_id) {
            const levelProgress = userProgress.find(p => p.level_id === parseInt(level_id));
            return NextResponse.json(levelProgress || null);
        }

        return NextResponse.json(userProgress);
    } catch (error) {
        console.error('Error fetching progress:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
} 