import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface AppFormProps {
  email: string;
  full_name: string;
  phone: string;
  business_name: string;
  address: string;
  category: string;
  description: string;
  social_links: string;
  cnic: string;
}

export default function MerchantApp() {
  const [appForm, setAppForm] = useState<AppFormProps>({
    email: "",
    full_name: "",
    phone: "",
    business_name: "",
    address: "",
    category: "",
    description: "",
    social_links: "",
    cnic: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setAppForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const submitApp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/merchant-application`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(appForm),
      });

      const data = await res.json();
      console.log(data);
      toast.success('Application Submitted')
      setAppForm({
        email: "",
    full_name: "",
    phone: "",
    business_name: "",
    address: "",
    category: "",
    description: "",
    social_links: "",
    cnic: "",
      })
    } catch (err) {
      console.log(err);
    }
  };

  const fetchApplicationStatus = async()=>{
    try{
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/merchant-application/submitted-application`,{
        credentials:'include'
      })
      return res.json()
    }
    catch(err){
      console.log(err)
    }
  }

  const {data:appStatus}= useQuery({
    queryKey:['application status'],
    queryFn:fetchApplicationStatus,
    staleTime: 5 * 60 * 1000,
  })

  if(appStatus?.status === 'submitted'){
    return (
      <div className="flex items-center justify-center font-bold text-lg p-3 min-h-screen">
        <h1>Application Already submitted, wait for approval</h1>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Merchant Application</h1>

      <form onSubmit={submitApp} className="space-y-4">
        <div>
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            name="full_name"
            value={appForm.full_name}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={appForm.email}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            value={appForm.phone}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="business_name">Business Name</Label>
          <Input
            id="business_name"
            name="business_name"
            value={appForm.business_name}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            value={appForm.address}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            value={appForm.category}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            value={appForm.description}
            onChange={handleChange}
            className="w-full min-h-28 rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <Label htmlFor="social_links">Social Links</Label>
          <Input
            id="social_links"
            name="social_links"
            value={appForm.social_links}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="cnic">CNIC</Label>
          <Input
            id="cnic"
            name="cnic"
            value={appForm.cnic}
            onChange={handleChange}
          />
        </div>

        <Button type="submit" className="w-full">
          Submit Application
        </Button>
      </form>
    </div>
  );
}