import React from "react";
import { CloseButton } from "@/components/close-button";

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6 flex justify-end">
        <CloseButton />
      </div>

      <h1 className="text-3xl font-bold mb-4">Про MudryiAI</h1>

      <p className="mb-4">
        MudryiAI — це більше, ніж просто чат-бот. Це інтелектуальний помічник,
        створений українцями для українців. Названий на честь Ярослава Мудрого,
        наш сервіс втілює прагнення до знань, розсудливості та розвитку нашої
        держави.
      </p>

      <p className="mb-4">
        Ми розробили цей сайт як потужну альтернативу глобальним сервісам,
        адаптувавши його під наш культурний контекст, мовні нюанси та щоденні
        потреби громадян. Кожен рядок коду тут просякнутий любов'ю до України та
        вірою у наш технологічний потенціал.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Локальний фокус</h2>
      <p className="mb-4">Глибоке розуміння українських реалій.</p>

      <h2 className="text-xl font-semibold mt-4 mb-2">Якість</h2>
      <p className="mb-4">Сучасні алгоритми (Llama), налаштовані на чисту українську мову.</p>

      <h2 className="text-xl font-semibold mt-4 mb-2">Доступність</h2>
      <p className="mb-4">Професійний інструмент за ціною чашки кави.</p>

      <h2 className="text-xl font-semibold mt-4 mb-2">Розробник</h2>
      <p className="mb-4">Костянтин Дрозд</p>
      <p>Контакти: MudryiAI@gmail.com</p>
    </div>
  );
}
