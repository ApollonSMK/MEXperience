import { LoginForm } from '@/components/login-form';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const loginImage = PlaceHolderImages.find((img) => img.id === 'login-bg');
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-4xl">
        <LoginForm image={loginImage} />
      </div>
    </div>
  );
}
