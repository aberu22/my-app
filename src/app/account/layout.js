// app/account/layout.js
import AccountSidebar from "../components/AccountSidebar";

export default function AccountLayout({ children }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      <AccountSidebar />

      <main className="flex-1 p-6 lg:p-10">
        {children}
      </main>
    </div>
  );
}
