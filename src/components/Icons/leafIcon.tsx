import type { SVGProps } from "react";

export function LeafIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={28}
      height={28}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M20 4c-8-1-15 2-15 8a6 6 0 0 0 6 6c6 0 9-6 9-14Z" />
      <path d="M4 21 14 11M9 16v-5m0 5h5" />
    </svg>
  );
}
