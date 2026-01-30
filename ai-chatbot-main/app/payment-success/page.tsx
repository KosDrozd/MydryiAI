"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Автоматичне перенаправлення через 5 секунд
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <svg
              className="h-10 w-10 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Дякуємо за підтримку! 🎉</h1>
          <p className="text-muted-foreground">
            Ваш платіж успішно оброблено
          </p>
        </div>

        <div className="space-y-4 rounded-lg border bg-card p-6 text-left">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              ✅ Тепер ви маєте Premium доступ
            </p>
            <p className="text-sm text-muted-foreground">
              ✅ 20 повідомлень на день
            </p>
            <p className="text-sm text-muted-foreground">
              ✅ Пріоритетна підтримка
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Перенаправлення через {countdown} секунд...
          </p>
          
          <Button
            onClick={() => router.push("/")}
            className="w-full"
            size="lg"
          >
            Повернутися до чату
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Якщо у вас виникли питання, зв'яжіться з підтримкою
        </p>
      </div>
    </div>
  );
}
