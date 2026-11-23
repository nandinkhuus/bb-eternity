import Image from "next/image";
import Link from "next/link";

export function Logo({ compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex">
      <Image
        src="/weblogo.jpg"
        alt="Bayan Burd Eternity"
        width={1193}
        height={225}
        priority
        className={compact ? "h-8 w-auto" : "h-10 w-auto"}
      />
    </Link>
  );
}
