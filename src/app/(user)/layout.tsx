import { PropsWithChildren } from "react";

const UserLayout = ({ children }: PropsWithChildren) => {
  return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 sm:p-10">{children}</div>;
};

export default UserLayout;
