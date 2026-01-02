"use client";

import { useSession } from "next-auth/react";

const AdminFooter = () => {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; 2024 EDH Cube Simulator Admin</p>
          <p>管理者: {session.user.email}</p>
        </div>
      </div>
    </footer>
  );
};

export default AdminFooter;