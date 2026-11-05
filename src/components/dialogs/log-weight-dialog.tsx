"use client";

import * as React from "react";
import { useDataStore } from "@/lib/store/data-store";
import { uid, todayISO } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/shared/field";

export function LogWeightDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useDataStore();
  const [date, setDate] = React.useState(todayISO());
  const [weight, setWeight] = React.useState<string>(store.profile ? String(store.profile.currentWeightKg) : "");
  const [waist, setWaist] = React.useState<string>(store.profile ? String(store.profile.waistCm ?? "") : "");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setDate(todayISO());
      setWeight(store.profile ? String(store.profile.currentWeightKg) : "");
      setWaist(store.profile ? String(store.profile.waistCm ?? "") : "");
      setNotes("");
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = () => {
    const w = Number(weight);
    if (!w || w < 25 || w > 300) {
      setError("Enter a weight between 25 and 300 kg");
      return;
    }
    store.addWeightLog({
      id: uid("wl"),
      date,
      weightKg: w,
      waistCm: waist ? Number(waist) : undefined,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    });
    store.updateProfile({ currentWeightKg: w, waistCm: waist ? Number(waist) : undefined });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onOpenChange={onOpenChange} />
      <DialogHeader>
        <DialogTitle>Log your weight</DialogTitle>
        <DialogDescription>Daily weigh-ins help track trends. Short-term changes often reflect water, not fat.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" htmlFor="w-date">
            <Input id="w-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Weight (kg)" htmlFor="w-weight" error={error}>
            <Input id="w-weight" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </Field>
        </div>
        <Field label="Waist (cm, optional)" htmlFor="w-waist">
          <Input id="w-waist" type="number" step="0.1" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="e.g. 84" />
        </Field>
        <Field label="Notes (optional)" htmlFor="w-notes">
          <Input id="w-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Morning, fasted..." />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Save</Button>
        </div>
      </div>
    </Dialog>
  );
}
