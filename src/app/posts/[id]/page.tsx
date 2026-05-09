import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PostPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();

  const appUrl = `newsblock://post/${id}`;
  const webUrl = `https://sparknotes.up.railway.app/posts/${id}`;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{post.title} — NewsBlock</title>
        <meta name="description" content={post.snippet} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.snippet} />
        <meta property="og:url" content={webUrl} />
        {post.imageUrl && <meta property="og:image" content={post.imageUrl} />}
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, sans-serif; background: #f5f5f7; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
          .card { background: #fff; border-radius: 20px; max-width: 480px; width: 100%; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .img { width: 100%; height: 220px; object-fit: cover; }
          .body { padding: 24px; }
          .logo { font-size: 15px; font-weight: 800; color: #ff2442; margin-bottom: 16px; }
          h1 { font-size: 20px; font-weight: 800; color: #111; line-height: 1.3; margin-bottom: 10px; }
          .snippet { font-size: 14px; color: #6b7280; line-height: 1.5; margin-bottom: 24px; }
          .open-btn { display: block; text-align: center; background: #ff2442; color: #fff; font-size: 15px; font-weight: 700; padding: 14px; border-radius: 14px; text-decoration: none; margin-bottom: 10px; }
          .download-btn { display: block; text-align: center; background: #f3f4f6; color: #374151; font-size: 14px; font-weight: 600; padding: 13px; border-radius: 14px; text-decoration: none; }
        `}</style>
      </head>
      <body>
        <div className="card">
          {post.imageUrl && <img className="img" src={post.imageUrl} alt={post.title} />}
          <div className="body">
            <div className="logo">📰 NewsBlock</div>
            <h1>{post.title}</h1>
            <p className="snippet">{post.snippet}</p>
            <a className="open-btn" href={appUrl}>Open in NewsBlock</a>
            <a className="download-btn" href="https://apps.apple.com/app/newsblock/id6766168195">Download NewsBlock on App Store</a>
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          // Try to open the app immediately; if it fails, stay on page
          window.location.href = "${appUrl}";
        `}} />
      </body>
    </html>
  );
}
