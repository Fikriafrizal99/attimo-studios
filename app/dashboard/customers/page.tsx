import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/commerce/access";
import { withTenantDb } from "@/lib/db";
import { CustomerManager } from "./CustomerManager";

export const metadata = { title: "Customers | ENDRIYA" };

export default async function CustomersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const customers = await withTenantDb(user.id, async (db) => {
    const result = await db.query<{
      id: string;
      name: string;
      phone: string;
      email: string | null;
      notes: string;
      order_count: number;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT
         c.id,
         c.name,
         c.phone,
         c.email,
         c.notes,
         c.created_at,
         c.updated_at,
         COUNT(o.id)::int AS order_count
       FROM public.customers c
       LEFT JOIN public.orders o ON o.customer_id = c.id
       GROUP BY c.id
       ORDER BY c.updated_at DESC`
    );
    return result.rows;
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#BFA14A]">Commerce Operations</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-50">Customers</h1>
        <p className="mt-1 text-xs text-neutral-500">
          Customer records are private to your operator account and can be linked to one or more orders.
        </p>
      </div>
      <CustomerManager initialCustomers={customers} />
    </div>
  );
}
