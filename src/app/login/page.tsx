import { LoginForm } from '@/components/login-form';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Meteors } from '@/components/ui/meteors';

export default function LoginPage() {
  const loginImage = PlaceHolderImages.find((img) => img.id === 'login-bg');
  return (
    <div className="relative bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10 overflow-hidden">
      <Meteors number={30} />
      <div className="w-full max-w-4xl z-10">
        <LoginForm image={loginImage} />
      </div>
    </div>
  );
}
