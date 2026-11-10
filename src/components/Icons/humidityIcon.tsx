import type { SVGProps } from "react";

export function HumidityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={16}
      height={18}
      viewBox="0 0 20 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10 1s7 7.5 7 12a7 7 0 0 1-14 0C3 8.5 10 1 10 1Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 13a4 4 0 0 0 4 4"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}
