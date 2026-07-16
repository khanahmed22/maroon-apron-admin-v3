import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { MapPin, Building2, Wallet, ShoppingCart, Pencil, Trash2, Loader2, Plus, MapPinOff } from "lucide-react"
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog"
interface RestProps {
  restId: string | null;
}

interface AreaProps {
  areaId: string;
  areaName: string;
  cityName: string;
  deliveryFee: string;
  minOrder: string;
}

const EMPTY_FORM = {
  areaName: "",
  cityName: "",
  deliveryFee: "",
  minOrder: "",
}

export default function DeliveryZones({ restId }: RestProps) {
  const queryClient = useQueryClient();

  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchDeliveryZones = async (): Promise<AreaProps[]> => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/area-list/${restId}/view`
    );

    if (!res.ok) {
      throw new Error("Failed to fetch delivery zones");
    }

    return res.json();
  };

  const { data: deliveryList, isPending } = useQuery({
    queryKey: ["deliveryZone", restId],
    queryFn: fetchDeliveryZones,
    enabled: !!restId,
  });

  const addArea = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/area-list/${restId}/add`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            areaName: form.areaName,
            cityName: form.cityName,
            deliveryFee: form.deliveryFee,
            minOrder: form.minOrder,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to add area");
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["deliveryZone", restId],
      });

      setForm(EMPTY_FORM);
    },
  });

  const deleteArea = useMutation({
    mutationFn: async (areaId: string) => {
      setDeletingId(areaId);

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/area-list/${restId}/delete`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            areaId,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to delete area");
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["deliveryZone", restId],
      });
    },

    onSettled: () => {
      setDeletingId(null);
    },
  });

  const updateArea = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/area-list/${restId}/update`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            areaId: editingAreaId,
            areaName: form.areaName,
            cityName: form.cityName,
            deliveryFee: form.deliveryFee,
            minOrder: form.minOrder,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update area");
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["deliveryZone", restId],
      });

      setEditingAreaId(null);
      setForm(EMPTY_FORM);
    },
  });

  // ---- Dialog open/close + save helpers ----

  const openAddDialog = () => {
    setEditingAreaId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (area: AreaProps) => {
    setEditingAreaId(area.areaId);
    setForm({
      areaName: area.areaName,
      cityName: area.cityName,
      deliveryFee: area.deliveryFee,
      minOrder: area.minOrder,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingAreaId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    if (editingAreaId) {
      updateArea.mutate(undefined, { onSuccess: () => setDialogOpen(false) });
    } else {
      addArea.mutate(undefined, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const isSaving = editingAreaId ? updateArea.isPending : addArea.isPending;

  if (isPending) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Delivery Zones</h2>
        <Button
          onClick={openAddDialog}
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Area
        </Button>
      </div>

      {/* ================= DELIVERY ZONE LIST ================= */}
      <div className="space-y-3">
        {deliveryList?.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center gap-2 py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
            <MapPinOff className="w-8 h-8 text-border" />
            <p className="font-medium">No delivery zones added yet.</p>
            <p className="text-sm">Add an area to start delivering there.</p>
          </div>
        )}

        {deliveryList?.map((area) => (
          <div
            key={area.areaId}
            className="border border-border rounded-2xl p-4 flex items-center justify-between bg-card"
          >
            <div>
              <h3 className="font-semibold">{area.areaName}</h3>
              <p className="text-muted-foreground text-sm">{area.cityName}</p>
              <p className="text-sm mt-1">
                Delivery Fee: <strong className="text-primary">Rs. {area.deliveryFee}</strong>
              </p>
              <p className="text-sm">
                Minimum Order: <strong>Rs. {area.minOrder}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => openEditDialog(area)}
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label={`Edit ${area.areaName}`}
              >
                <Pencil className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`Delete "${area.areaName}"?`)) {
                    deleteArea.mutate(area.areaId)
                  }
                }}
                disabled={deletingId === area.areaId}
                className="text-destructive hover:opacity-80 transition-opacity"
                aria-label={`Delete ${area.areaName}`}
              >
                {deletingId === area.areaId ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= ADD / EDIT DIALOG ================= */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAreaId ? "Update Area" : "Add Area"}</DialogTitle>
            <DialogDescription>
              {editingAreaId
                ? "Update the details for this delivery zone."
                : "Add a new area you deliver to, with its fee and minimum order."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col gap-y-1.5">
              <Label className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Area Name
              </Label>
              <Input
                placeholder="e.g. Gulshan-e-Iqbal"
                value={form.areaName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, areaName: e.target.value }))
                }
                className="h-11 rounded-xl text-base"
              />
            </div>

            <div className="flex flex-col gap-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                City
              </Label>
              <Input
                placeholder="e.g. Karachi"
                value={form.cityName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, cityName: e.target.value }))
                }
                className="h-11 rounded-xl text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  Delivery Fee
                </Label>
                <Input
                  type="number"
                  placeholder="Rs. 0"
                  value={form.deliveryFee}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, deliveryFee: e.target.value }))
                  }
                  className="h-11 rounded-xl text-base"
                />
              </div>

              <div className="flex flex-col gap-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                  Minimum Order
                </Label>
                <Input
                  type="number"
                  placeholder="Rs. 0"
                  value={form.minOrder}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, minOrder: e.target.value }))
                  }
                  className="h-11 rounded-xl text-base"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" className="rounded-xl" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {editingAreaId
                ? isSaving
                  ? "Updating..."
                  : "Update Area"
                : isSaving
                  ? "Adding..."
                  : "Add Area"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}