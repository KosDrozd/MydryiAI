"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useActionState, useEffect, useState } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button"; // <-- Імпорт кнопки
import { LogoGoogle } from "@/components/icons";  // <-- Імпорт лого
import { type LoginActionState, login, googleSignIn } from "../actions"; // <-- Імпорт googleSignIn

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    { status: "idle" }
  );

  const { update: updateSession } = useSession();

  useEffect(() => {
    if (state.status === "failed") {
      toast({ type: "error", description: "Невірні дані входу!" });
    } else if (state.status === "invalid_data") {
      toast({ type: "error", description: "Помилка перевірки даних!" });
    } else if (state.status === "success") {
      setIsSuccessful(true);
      updateSession();
      router.refresh();
    }
  }, [state.status, updateSession, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">Вхід</h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Використовуйте Google або електронну адресу для входу
          </p>
        </div>

        {/* --- ПОЧАТОК: Кнопка Google --- */}
        <div className="px-4 sm:px-16 flex flex-col gap-4">
          <form
            action={async () => {
              await googleSignIn();
            }}
          >
            <Button
              variant="outline"
              className="w-full flex items-center gap-2 py-5 font-semibold"
              type="submit"
            >
              <LogoGoogle /> Увійти через Google
            </Button>
          </form>

          <div className="relative flex items-center py-2">
            <span className="w-full border-t dark:border-zinc-700" />
            <span className="px-2 text-xs text-muted-foreground uppercase bg-background">
              Або
            </span>
            <span className="w-full border-t dark:border-zinc-700" />
          </div>
        </div>
        {/* --- КІНЕЦЬ: Кнопка Google --- */}

        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Вхід через пошту</SubmitButton>
          <p className="mt-4 text-center text-gray-600 text-sm dark:text-zinc-400">
            {" Немаєте аккаунту? "}
            <Link
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              href="/register"
            >
              Зареєструйтеся
            </Link>
            {" безплатно."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}