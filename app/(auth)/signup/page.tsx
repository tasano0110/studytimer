import { SignupForm } from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-700 tracking-wide">
            STUDY TIMER
          </h1>
          <p className="mt-2 text-sm text-slate-600">新規アカウント作成</p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
