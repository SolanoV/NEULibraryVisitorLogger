import LoginForm from '../../components/LoginForm' // Adjust path based on where you put it

export default function Login() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-24">
      {/* We just drop the furniture into the room */}
      <LoginForm />
    </div>
  )
}