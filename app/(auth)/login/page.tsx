import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-700 tracking-wide">
            STUDY TIMER
          </h1>
          <p className="mt-2 text-sm text-slate-600">アカウントにログイン</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
