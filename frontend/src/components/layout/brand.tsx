import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export function Brand({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="brand" aria-label="LMS home">
      <span className="brand-mark"><Icon name="book" size={18} /></span>
      <span>LMS</span>
    </Link>
  );
}
