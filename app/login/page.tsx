import LoginForm from '../../components/LoginForm' // Adjust path based on where you put it
import Background from '../../components/Background' // Import the background component

export const metadata: Metadata = {
  title: "Login", 
};

export default function Login() {
  return (
    <Background>
      <LoginForm />
    </Background>
  )
}