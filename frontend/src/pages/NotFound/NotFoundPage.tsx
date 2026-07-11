import { Link } from 'react-router-dom';
import { HeartSparkle } from '../../components/UI/Icons';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-twinkle-blush/20 flex items-center justify-center mx-auto mb-6">
          <HeartSparkle className="w-10 h-10 text-twinkle-blush" />
        </div>
        <h1 className="text-6xl font-display font-bold text-twinkle-ink mb-2">404</h1>
        <p className="text-lg font-display text-twinkle-ink/60 mb-2">Page not found</p>
        <p className="text-sm text-twinkle-ink/40 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="btn-primary inline-flex"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
