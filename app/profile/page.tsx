import { Metadata } from "next";
import Background from '@/components/Background'
import ProfileClient from "@/components/features/ProfileClient";

export const metadata: Metadata = {
  title: "My Profile",
};

export default function ProfilePage() {
  return (
    <div className="flex-1 flex items-center justify-center w-full p-4">
      <ProfileClient />
    </div>
  )
}