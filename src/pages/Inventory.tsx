import { useState, useEffect } from "react";
import { UserAuth } from "../context/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Package,
  ImagePlus,
  Loader2,
  ScanIcon,
  FileSpreadsheet,
} from "lucide-react";
import { extractTextFromImage, extractTextFromPDF } from "../lib/scanMenu/ocr";
import { parseMenuWithGemini } from "../lib/scanMenu/gemini";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import Papa from "papaparse";

interface ScannedItem {
  name: string;
  price: number;
  costPrice: string;
  description: string;
  category: string;
  stockAmount: number;
}
interface VariantProps {
  id: string;
  variantName: string;
  variantPrice: number;
  variantCostPrice: number;
}

interface InventProps {
  id: string;
  name: string;
  price: number;
  costPrice: string;
  description: string;
  variants: VariantProps[];
  imageUrl: string;
  category: string;
  stockAmount: number;
}

interface restProps {
  restId: string | null;
  restName: string | null;
}

export default function Inventory({ restId, restName }: restProps) {
  const { session } = UserAuth();
  const [addMode, setAddMode] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [search, setSearch] = useState<string>("");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [scanPreviewOpen, setScanPreviewOpen] = useState<boolean>(false);
  const [isUnderstandingMenu, setIsUnderstandingMenu] =
    useState<boolean>(false);
  const [isSavingScan, setIsSavingScan] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);

  const [csvPreviewOpen, setCSVPreviewOpen] = useState<boolean>(false);
  const [csvPreviewItems, setCSVPreviewItems] = useState<ScannedItem[]>([]);
  const [isImportingCSV, setIsImportingCSV] = useState<boolean>(false);
  const [isSavingCSV, setIsSavingCSV] = useState<boolean>(false);
  const [csvProgress, setCSVProgress] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    price: 0,
    costPrice: "",
    description: "",
    category: "",
    stockAmount: 0,
    imageUrl: "",
    variants: [] as {
      variantName: string;
      variantPrice: number;
      variantCostPrice: number;
    }[],
  });

  const queryClient = useQueryClient();

  const [editMode, setEditMode] = useState<boolean>(false);

  const [updateForm, setupdateForm] = useState({
    id: "",
    userId: session?.id,
    name: "",
    price: 0,
    costPrice: "",
    description: "",
    category: "",
    stockAmount: 0,
    imageUrl: "",

    variants: [] as {
      variantName: string;
      variantPrice: number;
      variantCostPrice: number;
    }[],
  });

  // generate/revoke a preview URL whenever a new local file is selected
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/inventory`, {
        credentials: "include",
      });
      const result = await res.json();

      return result?.data;
    } catch (err) {
      console.log(err);
      toast.error("Could not fetch Inventory, please try again later");
    }
  };

  const { data: inventQuery = [], isPending } = useQuery<InventProps[]>({
    queryKey: ["inventory", restId],
    queryFn: fetchInventory,
    staleTime: 5 * 60 * 1000, //5min
  });

  const getPaymentStatus = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/paddle/account`,
      {
        credentials: "include",
      },
    );
    if (!res.ok) {
      throw new Error("Failed to fetch account");
    }
    return res.json();
  };

  const { data: merchantStatus } = useQuery({
    queryKey: ["account"],
    queryFn: getPaymentStatus,
    refetchOnWindowFocus: false,
  });

  //add item

  const addItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (merchantStatus?.plan === "free" && inventQuery.length >= 5) {
      toast.error("Only 5 items are allowed in the free plan.");
      setLoading(false);
      return;
    }

    if (merchantStatus?.plan === "pro" && inventQuery.length >= 100) {
      toast.error("Pro plan only allows 100 items");
      setLoading(false);
      return;
    }
    try {
      let imageUrl = addForm.imageUrl;
      let publicId = "";

      if (file) {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("folder", "inventory");

        const uploadRes = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/assets/upload`,
          {
            method: "POST",
            body: formData,
          },
        );

        const imageData = await uploadRes.json();

        imageUrl = imageData.imageUrl;
        publicId = imageData.publicId;
      }

      const cleanVariants = addForm.variants.filter(
        (v) => v.variantName.trim() !== "",
      );

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
      if (!res.ok) {
        throw new Error(data?.message || "Failed to add item");
      }

      setAddMode(false);
      setLoading(false);
      setFile(null);
      fetchInventory();
      setAddForm({
        name: "",
        price: 0,
        costPrice: "",
        description: "",
        category: "",
        stockAmount: 0,
        imageUrl: "",
        variants: [],
      });
    } catch (err) {
      throw err;
    }
  };

  const { mutate: addItemM } = useMutation({
    mutationKey: ["additem"],
    mutationFn: addItem,
    onSuccess: () => {
      toast.success("Item added");

      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: () => {
      toast.error("Item was not added");
      setAddMode(false);
      setLoading(false);
    },
  });

  const itemCount = inventQuery.length;
  const maxItems =
    merchantStatus?.plan === "free"
      ? 5
      : merchantStatus?.plan === "pro"
        ? 100
        : 0;

  const isLimitReached = !!merchantStatus?.plan && itemCount >= maxItems;

  const addVariant = () => {
    setAddForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { variantName: "", variantPrice: 0, variantCostPrice: 0 },
      ],
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
      variants: [
        ...prev.variants,
        { variantName: "", variantPrice: 0, variantCostPrice: 0 },
      ],
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
      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete item");
      }
    } catch (err) {
      throw err;
    }
  };

  const { mutate: deleteItemM } = useMutation({
    mutationKey: ["deleteItem"],
    mutationFn: deleteItem,
    onSuccess: () => {
      toast.success("Item deleted");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: () => {
      toast.error("Item was not deleted");
    },
  });

  // scan feature

  const handleScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (merchantStatus?.plan === "free" && inventQuery.length >= 5) {
      toast.error("Only 5 items are allowed in the free plan.");
      return;
    }
    if (merchantStatus?.plan === "pro" && inventQuery.length >= 100) {
      toast.error("Pro plan only allows 100 items");
      return;
    }

    const scanFile = e.target.files?.[0];
    if (!scanFile) return;

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (scanFile.size > maxSize) {
      toast.error("File must be smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    setIsUnderstandingMenu(true);

    try {
      let rawText = "";

      if (scanFile.type === "application/pdf") {
        rawText = await extractTextFromPDF(scanFile);
      } else {
        rawText = await extractTextFromImage(scanFile);
      }

      if (!rawText?.trim()) {
        throw new Error("No text detected in file");
      }

      const structured = await parseMenuWithGemini(rawText);

      if (!structured?.items?.length) {
        toast.warning("No menu items could be detected.");
      }

      const items: ScannedItem[] = (structured.items || []).map(
        (item: any) => ({
          name: item.foodName || item.name || "",
          price: Number(item.price) || 0,
          costPrice: String(item.BaseCostPrice ?? item.costPrice ?? ""),
          description: item.description || "",
          category: item.category || "",
          stockAmount: Number(item.stockAmount) || 0,
        }),
      );

      setScannedItems(items);
      setScanPreviewOpen(true);
    } catch (err: any) {
      console.error("Scan failed:", err);
      toast.error(
        err?.message || "Failed to understand menu. Please try another image.",
      );
    } finally {
      setIsUnderstandingMenu(false);
      e.target.value = "";
    }
  };

  const saveScannedItems = async () => {
    if (
      merchantStatus?.plan === "free" &&
      inventQuery.length + scannedItems.length > 5
    ) {
      toast.error("Only 5 items are allowed in the free plan.");
      return;
    }

    setIsSavingScan(true);
    setScanProgress(0);

    let success = 0;
    const total = scannedItems.length;

    for (let i = 0; i < total; i++) {
      const item = scannedItems[i];
      try {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/inventory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: item.name || "Unnamed Item",
            price: item.price,
            costPrice: item.costPrice,
            description: item.description,
            category: item.category || "Uncategorized",
            stockAmount: item.stockAmount,
            variants: [],
            imageUrl: "",
            publicId: "",
            restId,
            restName,
          }),
        });
        success++;
      } catch (err) {
        console.log(err);
        setScanPreviewOpen(false);
        toast.error("Something went wrong, try again later");
      }
      setScanProgress(Math.round(((i + 1) / total) * 100));
    }

    toast.success(`${success} item(s) added to inventory`);
    setIsSavingScan(false);
    setScanPreviewOpen(false);
    setScannedItems([]);
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
  };

  // csv import

  const headerMap = {
    name: ["name", "item", "food name", "product name", "item name"],
    price: ["price", "selling price"],
    costPrice: ["cost price", "cost"],
    description: ["description"],
    category: ["category"],
    stockAmount: ["stock", "quantity", "qty"],
  };

  function mapHeaders(row: Record<string, any>) {
    const mapped: Record<string, any> = {};

    for (const [target, aliases] of Object.entries(headerMap)) {
      for (const alias of aliases) {
        const key = Object.keys(row).find(
          (k) => k.trim().toLowerCase() === alias.toLowerCase(),
        );

        if (key) {
          mapped[target] = row[key];
          break;
        }
      }
    }

    return mapped;
  }

  const handleCSVUpload = (file: File) => {
    if (!file) return;

    setIsImportingCSV(true);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,

      complete: (results) => {
        const rows = results.data.map(mapHeaders);

        const items: ScannedItem[] = rows.map((row: any) => ({
          name: row.name || "",
          price: Number(row.price) || 0,
          costPrice: String(row.costPrice || ""),
          description: row.description || "",
          category: row.category || "",
          stockAmount: Number(row.stockAmount) || 0,
        }));

        setCSVPreviewItems(items);
        setCSVPreviewOpen(true);
        setIsImportingCSV(false);
        console.log(isImportingCSV);
      },

      error: () => {
        toast.error("Failed to read CSV");

        setIsImportingCSV(false);
      },
    });
  };

  const saveCSVItems = async () => {
    if (
      merchantStatus?.plan === "free" &&
      inventQuery.length + csvPreviewItems.length > 5
    ) {
      toast.error("Only 5 items are allowed in the free plan.");
      return;
    }
    if (merchantStatus?.plan === "pro" && inventQuery.length >= 100) {
      toast.error("Pro plan only allows 100 items");
      return;
    }

    setIsSavingCSV(true);
    setCSVProgress(0);

    let success = 0;
    const total = csvPreviewItems.length;

    for (let i = 0; i < total; i++) {
      const item = csvPreviewItems[i];
      try {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/inventory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: item.name || "Unnamed Item",
            price: item.price,
            costPrice: item.costPrice,
            description: item.description,
            category: item.category || "Uncategorized",
            stockAmount: item.stockAmount,
            variants: [],
            imageUrl: "",
            publicId: "",
            restId,
            restName,
          }),
        });
        success++;
      } catch (err) {
        console.log(err);
      }
      setCSVProgress(Math.round(((i + 1) / total) * 100));
    }

    toast.success(`${success} item(s) imported to inventory`);
    setIsSavingCSV(false);
    setCSVPreviewOpen(false);
    setCSVPreviewItems([]);
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
  };

  const updateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = updateForm.imageUrl;
      let publicId = "";

      if (file) {
        const formData = new FormData();
        formData.append("image", file);

        const uploadRes = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/assets/upload`,
          {
            method: "POST",
            body: formData,
          },
        );

        const imageData = await uploadRes.json();
        imageUrl = imageData.imageUrl;
        publicId = imageData.publicId;
      }

      const cleanVariants = updateForm.variants.filter(
        (v) => v.variantName.trim() !== "",
      );

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
          restName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update item");
      }

      setEditMode(false);
      setLoading(false);
      setFile(null);
      fetchInventory();
    } catch (err) {
      throw err;
    }
  };

  const { mutate: updateItemM } = useMutation({
    mutationKey: ["updateItem"],
    mutationFn: updateItem,
    onSuccess: () => {
      toast.success("Item updated");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: () => {
      toast.error("Item was not updated");

      setEditMode(false);
      setLoading(false);
    },
  });

  const filterBySearch = inventQuery?.filter((i) => {
    return i.name.toLowerCase().includes(search.toLowerCase());
  });

  const ACCENT = "#D6293F";
  const INK = "#171717";
  const MUTE = "#6B7280";
  const BORDER = "#E7E5E4";
  const SOFT = "#FBF7F6";

  if (isPending) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ color: MUTE }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} />
        <p className="text-sm font-medium">Loading inventory…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: SOFT }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1
          className="text-3xl max-md:text-xl font-extrabold"
          style={{ color: INK }}
        >
          Inventory{" "}
          <span className="text-lg max-md:text-sm font-medium bg-slate-200 p-2 rounded-lg">
            {inventQuery?.length || 0} items
          </span>
        </h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-4 top-5 -translate-y-1/2 h-4 w-4"
              style={{ color: MUTE }}
            />

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inventory..."
              className="h-11 pl-11 pr-4 rounded-xl bg-white text-base"
              style={{ borderColor: BORDER }}
            />
          </div>
          <div className="flex flex-col gap-y-3">
            <Button
              disabled={isLimitReached}
              onClick={() => setAddMode(true)}
              className="h-11 rounded-xl gap-2 text-base text-white"
              style={{ backgroundColor: ACCENT }}
            >
              <Plus className="w-4.5 h-4.5" />
              Add Item
            </Button>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:flex-none">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleScanUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />

                <Button
                  variant="outline"
                  className="w-full sm:w-auto h-11 rounded-xl gap-2 text-base pointer-events-none"
                  style={{ borderColor: BORDER }}
                >
                  <ScanIcon className="w-4.5 h-4.5" />
                  Scan Menu
                </Button>
              </div>

              <div className="relative flex-1 sm:flex-none">
                <input
                  type="file"
                  accept=".csv"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCSVUpload(file);
                  }}
                />

                <Button
                  variant="outline"
                  className="w-full sm:w-auto h-11 rounded-xl gap-2 text-base pointer-events-none"
                  style={{ borderColor: BORDER }}
                >
                  <FileSpreadsheet className="w-4.5 h-4.5" />
                  <span>Import CSV</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isUnderstandingMenu && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-xl px-6 py-5 w-[280px] text-center space-y-3 shadow-lg">
            <Loader2
              className="mx-auto h-8 w-8 animate-spin"
              style={{ color: ACCENT }}
            />
            <p className="text-sm font-medium">Understanding menu…</p>
            <p className="text-xs" style={{ color: MUTE }}>
              Extracting items from scanned image. Please wait.
            </p>
          </div>
        </div>
      )}

      <Dialog open={csvPreviewOpen} onOpenChange={setCSVPreviewOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">CSV Import Preview</DialogTitle>

            <DialogDescription className="text-base">
              Review your imported menu before adding it to inventory.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-y-4">
            {csvPreviewItems.length === 0 && (
              <p className="text-sm" style={{ color: MUTE }}>
                No items found.
              </p>
            )}

            {csvPreviewItems.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border p-3 space-y-2 relative"
                style={{ borderColor: BORDER }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setCSVPreviewItems((prev) =>
                      prev.filter((_, i) => i !== idx),
                    )
                  }
                  className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5"
                  style={{ color: ACCENT }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <Label>Item Name</Label>
                <Input
                  value={item.name}
                  onChange={(e) => {
                    const copy = [...csvPreviewItems];
                    copy[idx].name = e.target.value;
                    setCSVPreviewItems(copy);
                  }}
                />

                <Label>Price</Label>
                <Input
                  type="number"
                  value={item.price}
                  onChange={(e) => {
                    const copy = [...csvPreviewItems];
                    copy[idx].price = Number(e.target.value);
                    setCSVPreviewItems(copy);
                  }}
                />

                <Label>Cost Price</Label>
                <Input
                  type="number"
                  value={item.costPrice}
                  onChange={(e) => {
                    const copy = [...csvPreviewItems];
                    copy[idx].costPrice = e.target.value;
                    setCSVPreviewItems(copy);
                  }}
                />

                <Label>Description</Label>
                <Input
                  value={item.description}
                  onChange={(e) => {
                    const copy = [...csvPreviewItems];
                    copy[idx].description = e.target.value;
                    setCSVPreviewItems(copy);
                  }}
                />

                <Label>Category</Label>
                <Input
                  value={item.category}
                  onChange={(e) => {
                    const copy = [...csvPreviewItems];
                    copy[idx].category = e.target.value;
                    setCSVPreviewItems(copy);
                  }}
                />

                <Label>Stock Amount</Label>
                <Input
                  type="number"
                  value={item.stockAmount}
                  onChange={(e) => {
                    const copy = [...csvPreviewItems];
                    copy[idx].stockAmount = Number(e.target.value);
                    setCSVPreviewItems(copy);
                  }}
                />
              </div>
            ))}

            {isSavingCSV && (
              <div className="space-y-1">
                <p className="text-sm" style={{ color: MUTE }}>
                  Importing items… {csvProgress}%
                </p>
                <div
                  className="w-full h-2 rounded"
                  style={{ backgroundColor: BORDER }}
                >
                  <div
                    className="h-2 rounded transition-all"
                    style={{
                      width: `${csvProgress}%`,
                      backgroundColor: ACCENT,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCSVPreviewOpen(false)}
                disabled={isSavingCSV}
              >
                Cancel
              </Button>

              <Button
                className="flex-1"
                style={{ backgroundColor: ACCENT }}
                onClick={saveCSVItems}
                disabled={isSavingCSV || csvPreviewItems.length === 0}
              >
                {isSavingCSV
                  ? "Importing…"
                  : `Import ${csvPreviewItems.length} Item${csvPreviewItems.length !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= ITEM GRID ================= */}
      {/* ================= ITEM LIST ================= */}
      {filterBySearch?.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {filterBySearch?.map((inv) => (
            <div
              key={inv.id}
              className="bg-white rounded-xl border overflow-hidden flex flex-row"
              style={{ borderColor: BORDER }}
            >
              <img
                src={inv?.imageUrl || "/maroonapron-logo.png"}
                alt={inv.name}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover shrink-0"
              />

              <div className="p-2.5 flex flex-col flex-1 min-w-0">
                <div className="flex flex-col items-start gap-0.5 mb-1">
                  <div className="flex items-center justify-between w-full gap-2">
                    <span
                      className="text-sm font-bold truncate"
                      style={{ color: INK }}
                    >
                      {inv.name}
                    </span>
                    <span
                      className="text-xs font-semibold shrink-0"
                      style={{ color: MUTE }}
                    >
                      Stock: {inv.stockAmount || 0}
                    </span>
                  </div>

                  {inv.variants?.length > 0 ? (
                    <div className="text-xs" style={{ color: MUTE }}>
                      From Rs.{" "}
                      {Math.min(...inv.variants.map((v) => v.variantPrice))}
                    </div>
                  ) : (
                    <span
                      className="text-sm font-bold"
                      style={{ color: ACCENT }}
                    >
                      Rs: {inv.price}
                    </span>
                  )}

                  <span
                    className="text-xs line-clamp-1"
                    style={{ color: MUTE }}
                  >
                    {inv.description || ""}
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: ACCENT }}
                  >
                    Cost: Rs {inv.costPrice || ""}
                  </span>
                </div>

                {inv?.category && (
                  <span className="inline-block w-fit text-xs font-medium px-2 py-0.5 rounded-full mb-1.5 bg-red-500 text-white">
                    {inv.category}
                  </span>
                )}

                {inv?.variants?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {inv.variants.map((v) => (
                      <span
                        key={v.id}
                        className="text-xs font-medium px-2 py-0.5 rounded-full border"
                        style={{ borderColor: BORDER, color: MUTE }}
                      >
                        {v.variantName} · Rs.{v.variantPrice} · CP:
                        {v.variantCostPrice}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-auto pt-1 max-w-xs">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-lg gap-1 text-xs h-8"
                    onClick={() => {
                      setEditMode(true);
                      setFile(null);
                      setupdateForm({
                        id: inv.id,
                        userId: session?.id,
                        name: inv.name,
                        price: inv.price,
                        costPrice: inv.costPrice,
                        description: inv.description,
                        category: inv.category,
                        stockAmount: inv.stockAmount,
                        imageUrl: inv.imageUrl,
                        variants: inv.variants.map((v) => ({
                          variantName: v.variantName,
                          variantPrice: v.variantPrice,
                          variantCostPrice: v.variantCostPrice,
                        })),
                      });
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 rounded-lg gap-1 text-xs h-8"
                    onClick={() => deleteItemM(inv.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
      <Dialog
        open={addMode}
        onOpenChange={(open) => {
          setAddMode(open);
          if (!open) setFile(null);
        }}
      >
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
              <Label>Item Price - Leave 0 if variants exists</Label>
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
              <Label>Cost Price - Leave 0 if variants exists</Label>
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
              <Label>Description</Label>
              <Input
                placeholder="Enter Description"
                type="text"
                required
                value={addForm.description}
                className="h-11 rounded-xl text-base"
                style={{ borderColor: BORDER }}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    description: e.target.value,
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
              <Label>
                Image - Max 5 MB - PNG, JPG, JPEG, and WebP images allowed only
              </Label>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-xl border"
                  style={{ borderColor: BORDER }}
                />
              )}
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
                    className="flex flex-col items-center gap-2 rounded-xl border p-3"
                    style={{ borderColor: BORDER }}
                  >
                    <Label>Variant Name</Label>
                    <Input
                      placeholder="Variant name"
                      value={variant.variantName}
                      className="h-10 rounded-lg text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) => {
                        const updated = [...addForm.variants];
                        updated[index].variantName = e.target.value;
                        setAddForm({ ...addForm, variants: updated });
                      }}
                    />
                    <Label>Variant Price</Label>
                    <Input
                      type="number"
                      placeholder="Variant Price"
                      value={variant.variantPrice}
                      className="h-10 rounded-lg text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) => {
                        const updated = [...addForm.variants];
                        updated[index].variantPrice = Number(e.target.value);
                        setAddForm({ ...addForm, variants: updated });
                      }}
                    />
                    <Label>Variant Cost Price</Label>
                    <Input
                      type="number"
                      placeholder="Variant Cost Price"
                      value={variant.variantCostPrice}
                      className="h-10 rounded-lg text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) => {
                        const updated = [...addForm.variants];
                        updated[index].variantCostPrice = Number(
                          e.target.value,
                        );
                        setAddForm({ ...addForm, variants: updated });
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
                onClick={() => {
                  setAddMode(false);
                  setFile(null);
                }}
                className="flex-1 h-11 rounded-xl border text-base font-medium"
                style={{ borderColor: BORDER, color: INK }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-11 rounded-xl text-base font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: ACCENT }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/*Scan menu*/}

      <Dialog open={scanPreviewOpen} onOpenChange={setScanPreviewOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Scanned Menu Preview</DialogTitle>
            <DialogDescription className="text-base">
              Review and edit before saving to inventory.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-y-4">
            {scannedItems.length === 0 && (
              <p className="text-sm" style={{ color: MUTE }}>
                No items detected.
              </p>
            )}

            {scannedItems.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border p-3 space-y-2 relative"
                style={{ borderColor: BORDER }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setScannedItems((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5"
                  style={{ color: ACCENT }}
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <Label>Item Name</Label>
                <Input
                  value={item.name}
                  className="h-10 rounded-lg text-base"
                  style={{ borderColor: BORDER }}
                  onChange={(e) => {
                    const copy = [...scannedItems];
                    copy[idx].name = e.target.value;
                    setScannedItems(copy);
                  }}
                />

                <Label>Price</Label>
                <Input
                  type="number"
                  value={item.price}
                  className="h-10 rounded-lg text-base"
                  style={{ borderColor: BORDER }}
                  onChange={(e) => {
                    const copy = [...scannedItems];
                    copy[idx].price = Number(e.target.value);
                    setScannedItems(copy);
                  }}
                />

                <Label>Cost Price</Label>
                <Input
                  type="number"
                  value={item.costPrice}
                  className="h-10 rounded-lg text-base"
                  style={{ borderColor: BORDER }}
                  onChange={(e) => {
                    const copy = [...scannedItems];
                    copy[idx].costPrice = e.target.value;
                    setScannedItems(copy);
                  }}
                />

                <Label>Description</Label>
                <Input
                  type="text"
                  value={item.description}
                  className="h-10 rounded-lg text-base"
                  style={{ borderColor: BORDER }}
                  onChange={(e) => {
                    const copy = [...scannedItems];
                    copy[idx].description = e.target.value;
                    setScannedItems(copy);
                  }}
                />

                <Label>Category</Label>
                <Input
                  value={item.category}
                  className="h-10 rounded-lg text-base"
                  style={{ borderColor: BORDER }}
                  onChange={(e) => {
                    const copy = [...scannedItems];
                    copy[idx].category = e.target.value;
                    setScannedItems(copy);
                  }}
                />

                <Label>Stock Amount</Label>
                <Input
                  type="number"
                  value={item.stockAmount}
                  className="h-10 rounded-lg text-base"
                  style={{ borderColor: BORDER }}
                  onChange={(e) => {
                    const copy = [...scannedItems];
                    copy[idx].stockAmount = Number(e.target.value);
                    setScannedItems(copy);
                  }}
                />
              </div>
            ))}

            {isSavingScan && (
              <div className="space-y-1">
                <p className="text-sm" style={{ color: MUTE }}>
                  Saving items… {scanProgress}%
                </p>
                <div
                  className="w-full h-2 rounded"
                  style={{ backgroundColor: BORDER }}
                >
                  <div
                    className="h-2 rounded transition-all"
                    style={{
                      width: `${scanProgress}%`,
                      backgroundColor: ACCENT,
                    }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isSavingScan || scannedItems.length === 0}
              onClick={saveScannedItems}
              className="h-11 rounded-xl text-base font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}
            >
              {isSavingScan ? "Saving…" : "Save All Items"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= UPDATE ITEM ================= */}
      <Dialog
        open={editMode}
        onOpenChange={(open) => {
          setEditMode(open);
          if (!open) setFile(null);
        }}
      >
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
              <Label>Item Price - Leave Blank if variants exists</Label>
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
              <Label>Description</Label>
              <Input
                placeholder="Enter Description"
                type="text"
                required
                value={updateForm.description}
                className="h-11 rounded-xl text-base"
                style={{ borderColor: BORDER }}
                onChange={(e) =>
                  setupdateForm({
                    ...updateForm,
                    description: e.target.value,
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
              <Label>
                Image - Max 5 MB - PNG, JPG, JPEG, and WebP images allowed only
              </Label>
              {(previewUrl || updateForm.imageUrl) && (
                <img
                  src={previewUrl || updateForm.imageUrl}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-xl border"
                  style={{ borderColor: BORDER }}
                />
              )}
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
                    className="flex flex-col items-center gap-2 rounded-xl border p-3"
                    style={{ borderColor: BORDER }}
                  >
                    <Label>Variant Name</Label>
                    <Input
                      placeholder="Variant name"
                      value={variant.variantName}
                      className="h-10 rounded-lg text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) => {
                        const updated = [...updateForm.variants];
                        updated[index].variantName = e.target.value;
                        setupdateForm({ ...updateForm, variants: updated });
                      }}
                    />
                    <Label>Variant Price</Label>
                    <Input
                      type="number"
                      placeholder="Variant Price"
                      value={variant.variantPrice}
                      className="h-10 rounded-lg text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) => {
                        const updated = [...updateForm.variants];
                        updated[index].variantPrice = Number(e.target.value);
                        setupdateForm({ ...updateForm, variants: updated });
                      }}
                    />
                    <Label>Variant Cost Price</Label>
                    <Input
                      type="number"
                      placeholder="Variant Cost Price"
                      value={variant.variantCostPrice}
                      className="h-10 rounded-lg text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) => {
                        const updated = [...updateForm.variants];
                        updated[index].variantCostPrice = Number(
                          e.target.value,
                        );
                        setupdateForm({ ...updateForm, variants: updated });
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
                onClick={() => {
                  setEditMode(false);
                  setFile(null);
                }}
                className="flex-1 h-11 rounded-xl border text-base font-medium"
                style={{ borderColor: BORDER, color: INK }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-11 rounded-xl text-base font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: ACCENT }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
