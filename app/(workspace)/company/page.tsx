import { CompanyProfileForm } from "@/components/company-profile-form";
import Link from "next/link";
export default function Company() {
  return (
    <div className="page">
      <div className="company-settings-access">
        <Link href="/settings">Account settings →</Link>
      </div>
      <CompanyProfileForm />
    </div>
  );
}
