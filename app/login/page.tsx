import { Metadata } from "next";
import LoginForm from '@/components/LoginForm' // Adjust path based on where you put it
import Background from '@/components/Background' // Import the background component

export const metadata: Metadata = {
  title: "Login", 
};

export default function Login() {
  return (
    // 'flex-1' stretches this container from the bottom of the Navbar to the bottom of the screen.
    // 'items-center justify-center' pushes the LoginForm into the dead center of that space.
    <div className="flex-1 flex items-center justify-center w-full p-4">
      <LoginForm />
    </div>
  )
}