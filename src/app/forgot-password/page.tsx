"use client";

import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">
          Password Recovery
        </h1>

        <p className="text-gray-600 mb-6">
          Password recovery is coming soon. If you created your account with an
          email, you&apos;ll be able to reset your password here.
        </p>

        <p className="text-gray-500 text-sm mb-6">
          If you need immediate help, please contact support.
        </p>

        <Link
          href="/login"
          className="inline-block bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
