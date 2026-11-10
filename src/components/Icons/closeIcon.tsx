import type { SVGProps } from "react";

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="m4.5 4.5 9 9m0-9-9 9"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}
