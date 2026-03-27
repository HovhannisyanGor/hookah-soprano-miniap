"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getOrCreateDemoUser, updateDemoUserProfile } from "@/lib/client-user";
import {
  bowlTypeLabel,
  cn,
  formatDateLabel,
  formatPrice,
  getUpcomingDates,
  hookahFlavorLabel,
  hookahStrengthLabel,
  isPhoneValid
} from "@/lib/format";
import { demoTimeOptions } from "@/lib/mock-data";
import { getSelectableTablesForSlot } from "@/lib/reservation-utils";
import type {
  BowlType,
  CreateReservationInput,
  HookahFlavorCategory,
  HookahStrength,
  MenuItem,
  MiniAppCatalog
} from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { Stepper } from "@/components/ui/stepper";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useToast } from "@/components/ui/toast-provider";

const guestOptions = [2, 3, 4, 6, 8];
const strengthOptions: HookahStrength[] = ["light", "medium", "strong"];
const flavorOptions: HookahFlavorCategory[] = [
  "fruity",
  "dessert",
  "citrus",
  "mint",
  "spicy"
];
const bowlOptions: BowlType[] = ["classic", "phunnel", "fruit_bowl"];
const stepTitles = [
  "Филиал",
  "Дата и время",
  "Гости и стол",
  "Контакты",
  "Кальян и доп. заказ",
  "Подтверждение"
];

type BookingFormState = CreateReservationInput;

function SelectTile({
  active,
  disabled,
  title,
  description,
  onClick
}: {
  active: boolean;
  disabled?: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full rounded-[24px] border p-4 text-left transition",
        active
          ? "border-brass/50 bg-brass/12"
          : "border-white/8 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]",
        disabled && "cursor-not-allowed opacity-45"
      )}
    >
      <p className="font-medium text-cream">{title}</p>
      <p className="mt-1 text-sm text-zinc-400">{description}</p>
    </button>
  );
}

export function BookingFlow({ initialData }: { initialData: MiniAppCatalog }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const dateOptions = useMemo(() => getUpcomingDates(5), []);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<BookingFormState>({
    userId: "web-demo-user",
    userName: "",
    phone: "",
    venueId: initialData.venues[0]?.id ?? "",
    tableId: "",
    date: dateOptions[0]?.value ?? "",
    time: demoTimeOptions[2] ?? "20:00",
    guests: 4,
    hookahPreorder: {
      strength: "medium",
      flavorCategory: "fruity",
      bowlType: "phunnel",
      comment: "",
      menuItemIds: []
    }
  });

  useEffect(() => {
    const demoUser = getOrCreateDemoUser();
    setForm((current) => ({
      ...current,
      userId: demoUser.id,
      userName: current.userName || demoUser.name,
      phone: current.phone || demoUser.phone
    }));
  }, []);

  const selectedVenue = initialData.venues.find((item) => item.id === form.venueId);
  const selectedTable = initialData.tables.find((item) => item.id === form.tableId);
  const selectedMenuItems = initialData.menuItems.filter((item) =>
    form.hookahPreorder.menuItemIds.includes(item.id)
  );

  const selectableTables = useMemo(
    () =>
      getSelectableTablesForSlot({
        venueId: form.venueId,
        date: form.date,
        time: form.time,
        tables: initialData.tables,
        reservations: initialData.reservations
      }),
    [form.date, form.time, form.venueId, initialData.reservations, initialData.tables]
  );

  useEffect(() => {
    if (form.tableId && !selectableTables.some((item) => item.id === form.tableId)) {
      setForm((current) => ({ ...current, tableId: "" }));
    }
  }, [form.tableId, selectableTables]);

  function toggleMenuItem(item: MenuItem) {
    setForm((current) => {
      const exists = current.hookahPreorder.menuItemIds.includes(item.id);
      return {
        ...current,
        hookahPreorder: {
          ...current.hookahPreorder,
          menuItemIds: exists
            ? current.hookahPreorder.menuItemIds.filter((id) => id !== item.id)
            : [...current.hookahPreorder.menuItemIds, item.id]
        }
      };
    });
  }

  function validateCurrentStep() {
    switch (step) {
      case 0:
        return form.venueId ? null : "Выберите филиал.";
      case 1:
        if (!form.date) return "Выберите дату.";
        if (!form.time) return "Выберите время.";
        return null;
      case 2:
        if (!form.guests) return "Укажите количество гостей.";
        if (!form.tableId) return "Выберите стол.";
        return null;
      case 3:
        if (form.userName.trim().length < 2) return "Укажите имя гостя.";
        if (!isPhoneValid(form.phone)) return "Введите корректный телефон.";
        return null;
      case 4:
        if (!form.hookahPreorder.strength) return "Выберите крепость.";
        if (!form.hookahPreorder.flavorCategory) return "Выберите категорию вкуса.";
        if (!form.hookahPreorder.bowlType) return "Выберите тип чаши.";
        return null;
      default:
        return null;
    }
  }

  function nextStep() {
    const error = validateCurrentStep();
    if (error) {
      pushToast({ title: error, tone: "error" });
      return;
    }
    setStep((current) => Math.min(current + 1, stepTitles.length - 1));
  }

  async function submit() {
    const error = validateCurrentStep();
    if (error) {
      pushToast({ title: error, tone: "error" });
      return;
    }

    setSubmitting(true);
    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const payload = (await response.json()) as
      | { reservation: { id: string } }
      | { error: string };

    if (!response.ok || !("reservation" in payload)) {
      pushToast({
        title: "Не удалось создать бронь",
        description: "Попробуйте поменять стол или время.",
        tone: "error"
      });
      setSubmitting(false);
      return;
    }

    updateDemoUserProfile({
      id: form.userId,
      name: form.userName,
      phone: form.phone
    });
    pushToast({
      title: "Бронь создана",
      description: "Открываю экран подтверждения.",
      tone: "success"
    });
    router.push(`/booking/confirmation/${payload.reservation.id}`);
  }

  return (
    <div className="space-y-5">
      <SurfaceCard tone="accent" className="space-y-4">
        <Pill className="border-brass/20 bg-brass/10 text-amber-200">
          забронировать стол
        </Pill>
        <div className="space-y-2">
          <h1 className="font-display text-4xl leading-none text-cream">
            Сценарий бронирования
          </h1>
          <p className="max-w-sm text-sm text-zinc-300">
            Полноценный MVP-поток: филиал, слот, стол, контакты и предзаказ кальяна в одном
            компактном сценарии.
          </p>
        </div>
        <Stepper steps={stepTitles} current={step} />
      </SurfaceCard>

      {step === 0 && (
        <div className="grid gap-3">
          {initialData.venues.map((venue) => (
            <SelectTile
              key={venue.id}
              active={form.venueId === venue.id}
              title={venue.name}
              description={`${venue.shortTag} · ${venue.address}`}
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  venueId: venue.id,
                  tableId: ""
                }))
              }
            />
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <SurfaceCard className="space-y-3">
            <p className="text-sm text-zinc-400">Дата</p>
            <div className="grid grid-cols-2 gap-3">
              {dateOptions.map((dateOption) => (
                <SelectTile
                  key={dateOption.value}
                  active={form.date === dateOption.value}
                  title={formatDateLabel(dateOption.value)}
                  description="вечерний слот"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      date: dateOption.value,
                      tableId: ""
                    }))
                  }
                />
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="space-y-3">
            <p className="text-sm text-zinc-400">Время</p>
            <div className="grid grid-cols-2 gap-3">
              {demoTimeOptions.map((time) => (
                <Button
                  key={time}
                  variant={form.time === time ? "primary" : "secondary"}
                  block
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      time,
                      tableId: ""
                    }))
                  }
                >
                  {time}
                </Button>
              ))}
            </div>
          </SurfaceCard>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <SurfaceCard className="space-y-3">
            <p className="text-sm text-zinc-400">Сколько будет гостей?</p>
            <div className="grid grid-cols-5 gap-2">
              {guestOptions.map((value) => (
                <Button
                  key={value}
                  variant={form.guests === value ? "primary" : "secondary"}
                  block
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      guests: value,
                      tableId: ""
                    }))
                  }
                >
                  {value}
                </Button>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-400">Доступные столы</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Моковая availability-логика по выбранному слоту
                </p>
              </div>
              <Pill className="border-white/10 bg-white/5 text-zinc-300">
                {selectableTables.length} варианта
              </Pill>
            </div>
            <div className="grid gap-3">
              {selectableTables.length ? (
                selectableTables.map((table) => (
                  <SelectTile
                    key={table.id}
                    active={form.tableId === table.id}
                    title={`${table.name} · ${table.zone}`}
                    description={`${table.capacity} гостей · депозит от ${formatPrice(table.minimumSpend)} · ${table.description}`}
                    onClick={() => setForm((current) => ({ ...current, tableId: table.id }))}
                  />
                ))
              ) : (
                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-sm text-zinc-400">
                  На этот слот свободных столов нет. Поменяйте время или филиал.
                </div>
              )}
            </div>
          </SurfaceCard>
        </div>
      )}

      {step === 3 && (
        <SurfaceCard className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Имя</label>
            <input
              value={form.userName}
              onChange={(event) =>
                setForm((current) => ({ ...current, userName: event.target.value }))
              }
              placeholder="Например, Алексей"
              className="h-12 w-full rounded-2xl border border-white/8 bg-white/[0.04] px-4 text-cream outline-none transition placeholder:text-zinc-500 focus:border-brass/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Телефон</label>
            <input
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
              placeholder="+7 999 123-45-67"
              className="h-12 w-full rounded-2xl border border-white/8 bg-white/[0.04] px-4 text-cream outline-none transition placeholder:text-zinc-500 focus:border-brass/40"
            />
          </div>
          <p className="text-xs text-zinc-500">
            В MVP без настоящей Telegram-авторизации контакт просто сохраняется в локальную базу.
          </p>
        </SurfaceCard>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <SurfaceCard className="space-y-3">
            <p className="text-sm text-zinc-400">Крепость</p>
            <div className="grid grid-cols-3 gap-3">
              {strengthOptions.map((value) => (
                <Button
                  key={value}
                  variant={form.hookahPreorder.strength === value ? "primary" : "secondary"}
                  block
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      hookahPreorder: { ...current.hookahPreorder, strength: value }
                    }))
                  }
                >
                  {hookahStrengthLabel(value)}
                </Button>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="space-y-3">
            <p className="text-sm text-zinc-400">Категория вкуса</p>
            <div className="grid grid-cols-2 gap-3">
              {flavorOptions.map((value) => (
                <Button
                  key={value}
                  variant={
                    form.hookahPreorder.flavorCategory === value ? "primary" : "secondary"
                  }
                  block
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      hookahPreorder: { ...current.hookahPreorder, flavorCategory: value }
                    }))
                  }
                >
                  {hookahFlavorLabel(value)}
                </Button>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="space-y-3">
            <p className="text-sm text-zinc-400">Тип чаши</p>
            <div className="grid gap-3">
              {bowlOptions.map((value) => (
                <SelectTile
                  key={value}
                  active={form.hookahPreorder.bowlType === value}
                  title={bowlTypeLabel(value)}
                  description={
                    value === "classic"
                      ? "База для понятных и стабильных миксов."
                      : value === "phunnel"
                        ? "Чище вкус и дольше курение."
                        : "Подача для wow-эффекта и мягкой ароматики."
                  }
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      hookahPreorder: { ...current.hookahPreorder, bowlType: value }
                    }))
                  }
                />
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-zinc-400">Доп. заказ</p>
              <Pill className="border-white/10 bg-white/5 text-zinc-300">
                не обязательно
              </Pill>
            </div>
            <div className="grid gap-3">
              {initialData.menuItems.map((item) => {
                const active = form.hookahPreorder.menuItemIds.includes(item.id);
                return (
                  <SelectTile
                    key={item.id}
                    active={active}
                    title={`${item.name} · ${formatPrice(item.price)}`}
                    description={item.description}
                    onClick={() => toggleMenuItem(item)}
                  />
                );
              })}
            </div>
          </SurfaceCard>

          <SurfaceCard className="space-y-2">
            <label className="text-sm text-zinc-400">Комментарий к кальяну</label>
            <textarea
              value={form.hookahPreorder.comment}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  hookahPreorder: { ...current.hookahPreorder, comment: event.target.value }
                }))
              }
              rows={4}
              placeholder="Например: без холода, мягче по крепости, добавить чайную ноту."
              className="w-full rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-cream outline-none transition placeholder:text-zinc-500 focus:border-brass/40"
            />
          </SurfaceCard>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <SurfaceCard tone="accent" className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-zinc-400">
                итог брони
              </p>
              <h2 className="mt-2 font-display text-4xl text-cream">
                Проверьте детали
              </h2>
            </div>
            <div className="grid gap-3 rounded-[28px] border border-white/8 bg-black/15 p-4 text-sm text-zinc-300">
              <div className="flex items-center justify-between gap-3">
                <span>Филиал</span>
                <span className="text-right font-medium text-cream">{selectedVenue?.name}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Дата и время</span>
                <span className="text-right font-medium text-cream">
                  {formatDateLabel(form.date)} · {form.time}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Стол</span>
                <span className="text-right font-medium text-cream">
                  {selectedTable?.name} · {selectedTable?.zone}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Контакт</span>
                <span className="text-right font-medium text-cream">
                  {form.userName}, {form.phone}
                </span>
              </div>
              <div className="space-y-1">
                <span>Кальян</span>
                <p className="font-medium text-cream">
                  {hookahStrengthLabel(form.hookahPreorder.strength)} ·{" "}
                  {hookahFlavorLabel(form.hookahPreorder.flavorCategory)} ·{" "}
                  {bowlTypeLabel(form.hookahPreorder.bowlType)}
                </p>
              </div>
              <div className="space-y-1">
                <span>Напитки и снеки</span>
                <p className="font-medium text-cream">
                  {selectedMenuItems.length
                    ? selectedMenuItems.map((item) => item.name).join(", ")
                    : "Не выбраны"}
                </p>
              </div>
              {form.hookahPreorder.comment && (
                <div className="space-y-1">
                  <span>Комментарий</span>
                  <p className="font-medium text-cream">{form.hookahPreorder.comment}</p>
                </div>
              )}
            </div>
          </SurfaceCard>
        </div>
      )}

      <div className="sticky bottom-24 z-20 flex gap-3 rounded-[28px] border border-white/10 bg-zinc-950/85 p-3 shadow-lounge backdrop-blur-xl">
        <Button
          variant="ghost"
          block
          disabled={step === 0 || submitting}
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
        >
          Назад
        </Button>
        {step < stepTitles.length - 1 ? (
          <Button block onClick={nextStep}>
            Дальше
          </Button>
        ) : (
          <Button block disabled={submitting} onClick={() => void submit()}>
            {submitting ? "Создаю бронь..." : "Подтвердить бронь"}
          </Button>
        )}
      </div>
    </div>
  );
}
