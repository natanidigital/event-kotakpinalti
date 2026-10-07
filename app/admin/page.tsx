import {redirect} from "next/navigation";
import {serverClient} from "@/lib/supabase/server";
import AdminDashboard from "@/components/AdminDashboard";
export const dynamic="force-dynamic";
export default async function Admin() {
  const {data:{user}}=await (await serverClient()).auth.getUser();
  if(!user)redirect("/login");
  return <AdminDashboard userId={user.id} />;
}
