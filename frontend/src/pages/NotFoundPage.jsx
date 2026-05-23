/**
 * NotFoundPage.jsx — 404 Page
 * Shown when no route matches.
 */
import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 text-center">
    <h1 className="text-6xl font-bold text-brand-500 mb-2">404</h1>
    <p className="text-gray-600 text-base mb-6">
      Oops! This page doesn't exist.
    </p>
    <Link to="/feed" className="btn-primary w-full max-w-[200px]">
      Go Home
    </Link>
  </div>
);

export default NotFoundPage;
