import { useState } from "react";
import { UserAuth } from "../context/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Pencil, Trash2, X, Package, ImagePlus,Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
 
} from "../components/ui/dialog"
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
interface VariantProps {
  id: string;
  variantName: string;
  variantPrice: number;
}

interface InventProps {
  id: string,
  name: string,
  price: number,
  costPrice:string,
  variants: VariantProps[],
  imageUrl: string,
  category:string,
  stockAmount:number
  
}

interface restProps{
  restId: string | null,
  restName: string | null
}

export default function Inventory({restId,restName}:restProps) {
  const { session } = UserAuth();
  const [addMode, setAddMode] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [search,setSearch] = useState<string>("")
  

  const [addForm, setAddForm] = useState({
    name: "",
    price: 0,
    costPrice:"",
    category:"",
    stockAmount:0,
    variants: [] as { variantName: string; variantPrice: number }[],
  });
  
  const queryClient = useQueryClient()

  const [editMode, setEditMode] = useState<boolean>(false);

  
  const [updateForm, setupdateForm] = useState({
    id: "",
    userId: session?.id,
    name: "",
    price: 0,
    costPrice:"",
    category:"",
    stockAmount:0,

    variants: [] as { variantName: string; variantPrice: number }[],
  });
  
  const fetchInventory = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/inventory`,{
        credentials:'include'
      });
      const result = await res.json();

      return result?.data
    } catch (err) {
      console.log(err);
    }
  };

  const { data: inventQuery = [], isPending } = useQuery<InventProps[]>({
    queryKey: ["inventory",restId],
    queryFn: fetchInventory,
     staleTime: 5 * 60 * 1000, //5min
  });

  const getPaymentStatus = async () => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/paddle/account`, {
      credentials: "include",
    })
    if (!res.ok) {
      throw new Error("Failed to fetch account")
    }
    return res.json()
  }

  const { data: merchantStatus} = useQuery({
    queryKey: ["account"],
    queryFn: getPaymentStatus,
    refetchOnWindowFocus: false,
  })

  const addItem = async (e: React.FormEvent<HTMLFormElement>) => {


    e.preventDefault();

      if (merchantStatus?.plan === "free" && inventQuery.length >= 5) {
  throw new Error("Only 5 items are allowed in the free plan.");
}
      try {
      let imageUrl = "";
      let publicId = "";
      

  
      if (file) {
        const formData = new FormData(); 
        formData.append("image", file);
        formData.append("folder", "inventory");


        const uploadRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/assets/upload`, {
          method: "POST",
          body: formData,
        });

        const imageData = await uploadRes.json();

        imageUrl = imageData.imageUrl,
        publicId = imageData.publicId;
      
      }

    
      const cleanVariants = addForm.variants.filter(v => v.variantName.trim() !== "");

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...addForm,
          variants: cleanVariants,
          imageUrl,
          publicId,
          restId,
          restName,
        }),
      });

      const data = await res.json();
      console.log(data);
   

      setAddMode(false);
      setFile(null);
      fetchInventory();
      setAddForm({
    name: "",
    price: 0,
    costPrice:"",
    category:"",
    stockAmount:0,
    variants: [],
  })
    } catch (err) {
      console.log(err);
    }
  };

  const {mutate:addItemM}= useMutation({
    mutationKey: ['additem'],
    mutationFn: addItem,
    onSuccess:()=>{
    
            toast.success('Item added')
    
  
      queryClient.invalidateQueries({queryKey:['inventory']})
      
    },
    onError: (error: Error) => {
    toast.error(error.message);
  },
  })

  const addVariant = () => {
    setAddForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { variantName: "", variantPrice: 0 }],
    }));
  };

  const removeVariant = (index: number) => {
    setAddForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const addUpdateVariant = () => {
    setupdateForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { variantName: "", variantPrice: 0 }],
    }));
  };

  const removeUpdateVariant = (index: number) => {
    setupdateForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const deleteItem = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/inventory`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.log(err);
    }
  };

  const {mutate:deleteItemM} = useMutation({
    mutationKey:['deleteItem'],
    mutationFn: deleteItem,
    onSuccess:()=>{
      toast.success('Item deleted')
      queryClient.invalidateQueries({queryKey:['inventory']})
    }
  })

  const updateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      let imageUrl = "";
      let publicId = "";

      if (file) {
        const formData = new FormData();
        formData.append("image", file);

        const uploadRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/assets/upload`, {
          method: "POST",
          body: formData,
        });

        const imageData = await uploadRes.json();
        imageUrl = imageData.imageUrl;
        publicId = imageData.publicId;
      }

      const cleanVariants = updateForm.variants.filter(v => v.variantName.trim() !== "");

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/inventory`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...updateForm,
          variants: cleanVariants,
          imageUrl,
          publicId,
          restId,
          restName
        }),
      });

      const data = await res.json();
      console.log(data);

      setEditMode(false);
      setFile(null);
      fetchInventory();
    } catch (err) {
      console.log(err);
    }
  };

  const {mutate:updateItemM} = useMutation({
    mutationKey:['updateItem'],
    mutationFn: updateItem,
    onSuccess:()=>{
      toast.success('Item updated')
      queryClient.invalidateQueries({queryKey:['inventory']})
    }
  })


  const filterBySearch = inventQuery?.filter(i=>{
    return i.name.toLowerCase().includes(search.toLowerCase())
  })

  const ACCENT = "#D6293F"
const INK = "#171717"
const MUTE = "#6B7280"
const BORDER = "#E7E5E4"
const SOFT = "#FBF7F6"
 





if (isPending) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ color: MUTE }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} />
        <p className="text-sm font-medium">Loading inventory…</p>
      </div>
    )
  }

  return (
     <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: SOFT }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-extrabold" style={{ color: INK }}>
          Inventory  <span className="text-lg font-medium bg-slate-200 p-2 rounded-lg">{inventQuery?.length || 0} items</span>
        </h1>
 
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-72">
            <Search
              className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: MUTE }}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inventory…"
              className="pl-11 h-11 rounded-xl bg-white text-base"
              style={{ borderColor: BORDER }}
            />
          </div>
 
          <Button
            onClick={() => setAddMode(true)}
            className="h-11 rounded-xl gap-2 text-base text-white"
            style={{ backgroundColor: ACCENT }}
          >
            <Plus className="w-[18px] h-[18px]" />
            Add Item
          </Button>
        </div>
      </div>
 
      {/* ================= ITEM GRID ================= */}
      {filterBySearch?.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filterBySearch?.map((inv) => (
            <div
              key={inv.id}
              className="bg-white rounded-2xl border overflow-hidden flex flex-col"
              style={{ borderColor: BORDER }}
            >
              <img
                src={inv?.imageUrl || "https://placehold.co/300x300"}
                alt={inv.name}
                className="w-full h-44 object-cover"
              />
 
              <div className="p-4 flex flex-col flex-1">
                <div className="flex flex-col items-start justify-between gap-2 mb-1">
                  <span className="text-lg font-bold" style={{ color: INK }}>
                    {inv.name}
                  </span>
                  <span className="text-lg font-bold shrink-0" style={{ color: ACCENT }}>
                    Rs. {inv.price}
                  </span>
                  <span className="text-sm font-bold shrink-0" style={{ color: ACCENT }}>
                    Cost Price Rs. {inv.costPrice || ""}
                  </span>
                   <span className="text-sm font-semibold shrink-0" style={{ color: MUTE }}>
                    In Stock {inv.stockAmount || 0}
                  </span>
                </div>
 
                {inv?.category && (
                  <span
                    className="inline-block w-fit text-sm font-medium px-2.5 py-1 rounded-full mb-3"
                    style={{ backgroundColor: SOFT, color: MUTE }}
                  >
                    {inv.category}
                  </span>
                )}
 
                {inv?.variants?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {inv.variants.map((v) => (
                      <span
                        key={v.id}
                        className="text-sm font-medium px-2.5 py-1 rounded-full border"
                        style={{ borderColor: BORDER, color: MUTE }}
                      >
                        {v.variantName} · Rs. {v.variantPrice}
                      </span>
                    ))}
                  </div>
                )}
 
                <div className="flex gap-3 mt-auto pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl gap-2 text-base"
                    onClick={() => {
                      setEditMode(true)
                      setupdateForm({
                        id: inv.id,
                        userId: session?.id,
                        name: inv.name,
                        price: inv.price,
                        costPrice:inv.costPrice,
                        category: inv.category,
                        stockAmount:inv.stockAmount,
                        variants: inv.variants.map((v) => ({
                          variantName: v.variantName,
                          variantPrice: v.variantPrice,
                        })),
                      })
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 rounded-xl gap-2 text-base"
                    onClick={() => deleteItemM(inv.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="bg-white rounded-2xl border flex flex-col items-center justify-center gap-2 py-20 text-center"
          style={{ borderColor: BORDER, color: MUTE }}
        >
          <Package className="w-10 h-10" style={{ color: BORDER }} />
          <h1 className="text-lg font-semibold" style={{ color: INK }}>
            Add items to inventory
          </h1>
          <p className="text-base">Items you add will show up here.</p>
        </div>
      )}
 
      {/* ================= ADD ITEM ================= */}
      <Dialog open={addMode} onOpenChange={setAddMode}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Add an Item</DialogTitle>
            <DialogDescription className="text-base">
              Fill in the details for your new menu item.
            </DialogDescription>
          </DialogHeader>
 
          <form onSubmit={addItemM} className="flex flex-col gap-y-4">
            <div className="flex flex-col gap-y-1.5">
              <Label>Item Name</Label>
              <Input
                placeholder="Enter item name"
                value={addForm.name}
                className="h-11 rounded-xl text-base"
                style={{ borderColor: BORDER }}
                required
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    name: e.target.value,
                  })
                }
              />
            </div>
 
            <div className="flex flex-col gap-y-1.5">
              <Label>Item Price</Label>
              <Input
                placeholder="Enter price"
                type="number"
                required
                value={addForm.price}
                className="h-11 rounded-xl text-base"
                style={{ borderColor: BORDER }}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    price: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="flex flex-col gap-y-1.5">
              <Label>Cost Price</Label>
              <Input
                placeholder="Enter Cost Price"
                type="number"
                required
                value={addForm.costPrice}
                className="h-11 rounded-xl text-base"
                style={{ borderColor: BORDER }}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    costPrice: e.target.value,
                  })
                }
              />
            </div>
 
            <div className="flex flex-col gap-y-1.5">
              <Label>Category</Label>
              <Input
                placeholder="Enter category"
                value={addForm.category}
                required
                className="h-11 rounded-xl text-base"
                style={{ borderColor: BORDER }}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    category: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex flex-col gap-y-1.5">
              <Label>Stock Amount</Label>
              <Input
                placeholder="Enter Stock Amount"
                value={addForm.stockAmount}
                required
                className="h-11 rounded-xl text-base"
                style={{ borderColor: BORDER }}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    stockAmount: Number(e.target.value),
                  })
                }
              />
            </div>
 
            <div className="flex flex-col gap-y-1.5">
              <Label>Image</Label>
              <label
                className="flex items-center gap-2 h-11 rounded-xl border border-dashed px-4 text-base cursor-pointer"
                style={{ borderColor: BORDER, color: MUTE }}
              >
                <ImagePlus className="w-[18px] h-[18px]" />
                Choose a photo
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
 
            {addForm.variants.length > 0 && (
              <div className="flex flex-col gap-y-3">
                <Label>Variants</Label>
                {addForm.variants.map((variant, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-xl border p-3"
                    style={{ borderColor: BORDER }}
                  >
                    <Input
                      placeholder="Variant name"
                      value={variant.variantName}
                      className="h-10 rounded-lg text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) => {
                        const updated = [...addForm.variants]
                        updated[index].variantName = e.target.value
                        setAddForm({ ...addForm, variants: updated })
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={variant.variantPrice}
                      className="h-10 rounded-lg text-base w-28 shrink-0"
                      style={{ borderColor: BORDER }}
                      onChange={(e) => {
                        const updated = [...addForm.variants]
                        updated[index].variantPrice = Number(e.target.value)
                        setAddForm({ ...addForm, variants: updated })
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                      style={{ color: MUTE }}
                      aria-label="Remove variant"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
 
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center justify-center gap-2 h-11 rounded-xl border text-base font-medium"
              style={{ borderColor: BORDER, color: ACCENT }}
            >
              <Plus className="w-[18px] h-[18px]" />
              Add Variant
            </button>
 
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setAddMode(false)}
                className="flex-1 h-11 rounded-xl border text-base font-medium"
                style={{ borderColor: BORDER, color: INK }}
              >
                Cancel
              </button>
              <button
        
                type="submit"
                className="flex-1 h-11 rounded-xl text-base font-semibold text-white"
                style={{ backgroundColor: ACCENT }}
              >
                Add Item
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
 
      {/* ================= UPDATE ITEM ================= */}
      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Update Item</DialogTitle>
            <DialogDescription className="text-base">
              Make changes to this menu item.
            </DialogDescription>
          </DialogHeader>
 
          <form onSubmit={updateItemM} className="flex flex-col gap-y-4">
            <div className="flex flex-col gap-y-1.5">
              <Label>Item Name</Label>
              <Input
                placeholder="Enter item name"
                value={updateForm.name}
                required
                className="h-11 rounded-xl text-base"
                style={{ borderColor: BORDER }}
                onChange={(e) =>
                  setupdateForm({
                    ...updateForm,
                    name: e.target.value,
                  })
                }
              />
            </div>
 
            <div className="flex flex-col gap-y-1.5">
              <Label>Item Price</Label>
              <Input
                placeholder="Enter price"
                type="number"
                required
                value={updateForm.price}
                className="h-11 rounded-xl text-base"
                style={{ borderColor: BORDER }}
                onChange={(e) =>
                  setupdateForm({
                    ...updateForm,
                    price: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="flex flex-col gap-y-1.5">
              <Label>Cost Price</Label>
              <Input
                placeholder="Enter Cost price"
                type="number"
                required
                value={updateForm.costPrice}
                className="h-11 rounded-xl text-base"
                style={{ borderColor: BORDER }}
                onChange={(e) =>
                  setupdateForm({
                    ...updateForm,
                    costPrice: e.target.value,
                  })
                }
              />
            </div>
 
            <div className="flex flex-col gap-y-1.5">
              <Label>Category</Label>
              <Input
                placeholder="Enter category"
                required
                value={updateForm.category}
                className="h-11 rounded-xl text-base"
                style={{ borderColor: BORDER }}
                onChange={(e) =>
                  setupdateForm({
                    ...updateForm,
                    category: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex flex-col gap-y-1.5">
              <Label>Stock Amount</Label>
              <Input
                placeholder="Enter Stock"
                required
                value={updateForm.stockAmount}
                className="h-11 rounded-xl text-base"
                style={{ borderColor: BORDER }}
                onChange={(e) =>
                  setupdateForm({
                    ...updateForm,
                    stockAmount: Number(e.target.value),
                  })
                }
              />
            </div>
 
            <div className="flex flex-col gap-y-1.5">
              <Label>Image</Label>
              <label
                className="flex items-center gap-2 h-11 rounded-xl border border-dashed px-4 text-base cursor-pointer"
                style={{ borderColor: BORDER, color: MUTE }}
              >
                <ImagePlus className="w-[18px] h-[18px]" />
                Choose a photo
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
 
            {updateForm.variants.length > 0 && (
              <div className="flex flex-col gap-y-3">
                <Label>Variants</Label>
                {updateForm.variants.map((variant, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-xl border p-3"
                    style={{ borderColor: BORDER }}
                  >
                    <Input
                      placeholder="Variant name"
                      value={variant.variantName}
                      className="h-10 rounded-lg text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) => {
                        const updated = [...updateForm.variants]
                        updated[index].variantName = e.target.value
                        setupdateForm({ ...updateForm, variants: updated })
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={variant.variantPrice}
                      className="h-10 rounded-lg text-base w-28 shrink-0"
                      style={{ borderColor: BORDER }}
                      onChange={(e) => {
                        const updated = [...updateForm.variants]
                        updated[index].variantPrice = Number(e.target.value)
                        setupdateForm({ ...updateForm, variants: updated })
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeUpdateVariant(index)}
                      className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                      style={{ color: MUTE }}
                      aria-label="Remove variant"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
 
            <button
              type="button"
              onClick={addUpdateVariant}
              className="flex items-center justify-center gap-2 h-11 rounded-xl border text-base font-medium"
              style={{ borderColor: BORDER, color: ACCENT }}
            >
              <Plus className="w-[18px] h-[18px]" />
              Add Variant
            </button>
 
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="flex-1 h-11 rounded-xl border text-base font-medium"
                style={{ borderColor: BORDER, color: INK }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-11 rounded-xl text-base font-semibold text-white"
                style={{ backgroundColor: ACCENT }}
              >
                Save
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}