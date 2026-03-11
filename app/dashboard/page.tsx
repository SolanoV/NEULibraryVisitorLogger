import { Metadata } from "next";
import Background from '@/components/Background' // Import the background component
import DashboardClient from "@/components/DashboardClient"; // Adjust this path based on where you saved it!

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="flex-1 flex items-center justify-center w-full p-4">
      <DashboardClient />
    </div>
  )
}