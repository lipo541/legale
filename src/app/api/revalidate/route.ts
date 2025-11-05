import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Example: POST /api/revalidate with body { secret, path }
// For full site revalidation: { secret: "token", path: "/" }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, path } = body;

    if (secret !== process.env.REVALIDATE_SECRET_TOKEN) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    if (!path) {
      return NextResponse.json({ message: 'Path is required' }, { status: 400 });
    }

    // If path is '/', revalidate the entire site by revalidating all layouts
    if (path === '/') {
      // Revalidate all locale layouts to clear entire site cache
      revalidatePath('/[locale]', 'layout');
      console.log('Revalidated entire site cache');
    } else {
      // Revalidate specific path
      revalidatePath(path, 'page');
      console.log(`Revalidated path: ${path}`);
    }
    
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    console.error('Error revalidating:', error);
    return NextResponse.json(
      { message: 'Error revalidating', error: (error as Error).message },
      { status: 500 }
    );
  }
}
