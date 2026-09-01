import { getAuthenticatedUser } from "@/lib/supabase/server";
import { listSuppliers } from "@/lib/suppliers/repository";
import { SupplierDirectory } from "@/components/supplier-directory";
export default async function Suppliers() {
  const { client, user } = await getAuthenticatedUser();
  let setupRequired = false;
  const suppliers =
    client && user
      ? await listSuppliers(client, user.id).catch(() => {
          setupRequired = true;
          return [];
        })
      : [];
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">FULFILMENT / PRIVATE DIRECTORY</div>
          <h1>Suppliers</h1>
          <p>
            Build your private network of lawful fulfilment partners and compare
            their capabilities.
          </p>
        </div>
      </header>
      {setupRequired ? (
        <div className="provider-warning">
          Supplier storage is awaiting the V0.9 Supabase migration. Apply the
          migration before adding suppliers.
        </div>
      ) : null}
      <SupplierDirectory
        initialSuppliers={suppliers}
        setupRequired={setupRequired}
      />
    </div>
  );
}
