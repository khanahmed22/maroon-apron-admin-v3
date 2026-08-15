import { useEffect, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { MapPin, Building2, Wallet, ShoppingCart, Pencil, Trash2, Loader2, Plus, MapPinOff, Sliders } from "lucide-react"
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
import { toast } from "sonner";
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

interface FixRate {
  rate: number,
  fixMode: boolean,
  FixMinOrder: number
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
  const INK = "#171717"


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
    staleTime: 5 * 60 * 1000,
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
    onError:()=>{
      toast.error('Invalid Input')
      setDialogOpen(false)
      
    }
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


  // fix rate mode

  //view
  const fetchFixRates = async()=>{
    try{
      const fixRate = await fetch(`${import.meta.env.VITE_BACKEND_URL}/fix-rate/${restId}/view`)
    const data = await fixRate.json()
    return data
    }
    catch(err){
      console.log(err)
      throw err
    }
    
  }

  const {data:FixQuery}= useQuery<FixRate>({
    queryKey:['fixRate',restId],
    queryFn: fetchFixRates,
    enabled:!!restId,
    staleTime: 5 * 60 * 1000,
  })

  // update 

    const [fixRate,setFixRate]= useState(0)
    const [FixMinOrder,setFixMinOrder] = useState(0)

  const updateFixRate = async()=>{
   
    try{
      const fixRateResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/fix-rate/${restId}/update`,{
        method:'PUT',
        headers:{
          'Content-Type':'application/json'

        },
        credentials:'include',
        body:JSON.stringify({fixRate,FixMinOrder})
      })
    const data = await fixRateResponse.json()
    return data
    }
    catch(err){
      console.log(err)
      throw err
    }
    
  }

  const {mutate:updateFixRateM} = useMutation({
    mutationKey:['updateFixRate'],
    mutationFn: updateFixRate,
    onSuccess:()=>toast.success('Rate updated'),
    onError:()=>toast.error('Could not update rate')
  })

  function handleFixRate(e:React.FormEvent<HTMLFormElement>){
     e.preventDefault()
     updateFixRateM()
  }



  

  const enableFixRate = async () => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/fix-rate/enableFixRate`, {
      method: "PUT",
      credentials: "include",
    })
    if (!res.ok) {
      throw new Error("Failed to enable fixed rate mode")
    }
    return res.json()
  }

  const { mutate: enableFixRateM, isPending: isEnabling } = useMutation({
    mutationKey: ["enableFixRate"],
    mutationFn: enableFixRate,
    onSuccess: () => {
      toast.success("Switched to a fixed delivery rate")
      queryClient.invalidateQueries({ queryKey: ["fixRate", restId] })
    },
    onError: () => toast.error("Could not switch to a fixed rate"),
  })

  const disableFixRate = async () => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/fix-rate/disableFixRate`, {
      method: "PUT",
      credentials: "include",
    })
    if (!res.ok) {
      throw new Error("Failed to disable fixed rate mode")
    }
    return res.json()
  }

  const { mutate: disableFixRateM, isPending: isDisabling } = useMutation({
    mutationKey: ["disableFixRate"],
    mutationFn: disableFixRate,
    onSuccess: () => {
      toast.success("Switched to area-based delivery rates")
      queryClient.invalidateQueries({ queryKey: ["fixRate", restId] })
    },
    onError: () => toast.error("Could not switch to area-based rates"),
  })

  useEffect(()=>{
    setFixRate(FixQuery?.rate || 0)
    setFixMinOrder(FixQuery?.FixMinOrder || 0)
  },[FixQuery])

  if (isPending) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* ================= FIXED RATE TOGGLE ================= */}
      <div className="border border-border rounded-2xl p-4 sm:p-5 bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold">Delivery Pricing</h2>
              <p className="text-sm text-muted-foreground">
                {FixQuery?.fixMode
                  ? "One flat rate is charged for every delivery, regardless of area."
                  : "Rates are set per delivery area below."}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="rounded-xl shrink-0"
            disabled={isEnabling || isDisabling}
            onClick={() =>
              FixQuery?.fixMode ? disableFixRateM() : enableFixRateM()
            }
          >
            {(isEnabling || isDisabling) && (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            )}
            {FixQuery?.fixMode ? "Switch to area-based rates" : "Switch to a fixed rate"}
          </Button>
        </div>

        {FixQuery?.fixMode && (
          <form onSubmit={handleFixRate} className="flex flex-col sm:flex-row sm:items-end gap-3 mt-5">
            <div className="flex-1 flex flex-col gap-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-muted-foreground" />
                Flat Delivery Rate
              </Label>
              <Input
                type="number"
                placeholder="Rs. 0"
                value={fixRate}
                onChange={(e) => setFixRate(Number(e.target.value))}
                className="h-11 rounded-xl text-base"
              />
              <Label className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-muted-foreground" />
                Min Order
              </Label>
              <Input
                type="number"
                placeholder="Rs. 0"
                value={FixMinOrder}
                onChange={(e) => setFixMinOrder(Number(e.target.value))}
                className="h-11 rounded-xl text-base"
              />
            </div>
            <Button type="submit" className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              Update
            </Button>
          </form>
        )}
      </div>

      {/* ================= AREA-BASED PRICING ================= */}
      {!FixQuery?.fixMode && (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl max-md:text-xl font-extrabold mb-6" style={{ color: INK }}>
              Delivery Zones
            </h1>
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
        </>
      )}

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