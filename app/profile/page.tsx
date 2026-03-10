import { Metadata } from "next";
import Background from '@/components/Background'
import ProfileClient from "@/components/ProfileClient";

export const metadata: Metadata = {
  title: "My Profile",
};

export default function ProfilePage() {
  return (
    <Background>
      <ProfileClient />
    </Background>
  )
}