'use client'

export function PhotoIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 20 20"
      className={className}
    >
      <path
        d="M16.8003 12.8 13.3659 9.36558c-.3128-.3128-.8192-.3128-1.1312 0L8.8003 12.8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.3999 16.7999h-9.6c-1.3256 0-2.4-1.0744-2.4-2.4v-9.6c0-1.3256 1.0744-2.4 2.4-2.4h9.6c1.3256 0 2.4 1.0744 2.4 2.4v9.6c0 1.3256-1.0744 2.4-2.4 2.4Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.8 16.8 7.76564 11.7656c-.3128-.3128-.8192-.3128-1.1312 0L2.75684 15.6432"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.41242 6.98779c.11716.11716.11716.30711 0 .42427-.11715.11716-.3071.11716-.42426 0-.11716-.11716-.11716-.30711 0-.42427.11716-.11715.30711-.11715.42426 0"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LargeChevronIcon({ rotated = false }: { rotated?: boolean } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="7"
      fill="none"
      viewBox="0 0 12 7"
      className={rotated ? "rotate-180 transition-transform" : "transition-transform"}
    >
      <path
        fill="#6C7688"
        fillRule="evenodd"
        d="M.256.256c.342-.342.896-.342 1.238 0L6 4.762l4.256-4.506c.342-.342.896-.342 1.238 0s.342.897 0 1.239L6.494 6.494a.875.875 0 0 1-1.238 0L.256 1.494c-.342-.342-.342-.897 0-1.238Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function ArrowRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="11" viewBox="0 0 12 11" fill="none">
      <path
        d="M7.28033 0.21967C6.98744 -0.0732233 6.51256 -0.0732233 6.21967 0.21967C5.92678 0.512563 5.92678 0.987437 6.21967 1.28033L9.43934 4.5H0.75C0.335786 4.5 0 4.83579 0 5.25C0 5.66421 0.335786 6 0.75 6H9.43934L6.21967 9.21967C5.92678 9.51256 5.92678 9.98744 6.21967 10.2803C6.51256 10.5732 6.98744 10.5732 7.28033 10.2803L11.7803 5.78033C11.9268 5.63388 12 5.44194 12 5.25C12 5.05806 11.9268 4.86612 11.7803 4.71967L7.28033 0.21967Z"
        fill="#474E5A"
      />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M6.7 0.85C6.7 0.380558 6.31944 0 5.85 0C5.38056 0 5 0.380558 5 0.85V5H0.85C0.380558 5 0 5.38056 0 5.85C0 6.31944 0.380558 6.7 0.85 6.7H5V10.85C5 11.3194 5.38056 11.7 5.85 11.7C6.31944 11.7 6.7 11.3194 6.7 10.85V6.7H10.85C11.3194 6.7 11.7 6.31944 11.7 5.85C11.7 5.38056 11.3194 5 10.85 5H6.7V0.85Z"
        fill="#474E5A"
      />
    </svg>
  )
}

export function TrashIcon({ className }: { className?: string } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.99998 3V1.5C8.99998 0.671573 8.3284 0 7.49998 0H4.49998C3.67155 0 2.99998 0.671573 2.99998 1.5V3H0.75C0.335786 3 0 3.33579 0 3.75C0 4.16421 0.335786 4.5 0.75 4.5H1.49998V10C1.49998 11.1046 2.39541 12 3.49998 12H8.49998C9.60454 12 10.5 11.1046 10.5 10V4.5H11.25C11.6642 4.5 12 4.16421 12 3.75C12 3.33579 11.6642 3 11.25 3H8.99998ZM7.49998 1.4H4.49998C4.44475 1.4 4.39998 1.44477 4.39998 1.5V3H7.59998V1.5C7.59998 1.44477 7.5552 1.4 7.49998 1.4ZM9.09998 4.5V10C9.09998 10.3314 8.83135 10.6 8.49998 10.6H3.49998C3.1686 10.6 2.89998 10.3314 2.89998 10V4.5H9.09998Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.62498 5.5C4.97015 5.5 5.24998 5.77982 5.24998 6.125V8.875C5.24998 9.22018 4.97015 9.5 4.62498 9.5C4.2798 9.5 3.99998 9.22018 3.99998 8.875V6.125C3.99998 5.77982 4.2798 5.5 4.62498 5.5Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.37498 5.5C7.72015 5.5 7.99998 5.77982 7.99998 6.125V8.875C7.99998 9.22018 7.72015 9.5 7.37498 9.5C7.0298 9.5 6.74998 9.22018 6.74998 8.875V6.125C6.74998 5.77982 7.0298 5.5 7.37498 5.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.256282 0.256282C0.59799 -0.0854272 1.15201 -0.0854272 1.49372 0.256282L7 5.76256L12.5063 0.256282C12.848 -0.0854272 13.402 -0.0854272 13.7437 0.256282C14.0854 0.59799 14.0854 1.15201 13.7437 1.49372L8.23744 7L13.7437 12.5063C14.0854 12.848 14.0854 13.402 13.7437 13.7437C13.402 14.0854 12.848 14.0854 12.5063 13.7437L7 8.23744L1.49372 13.7437C1.15201 14.0854 0.59799 14.0854 0.256282 13.7437C-0.0854272 13.402 -0.0854272 12.848 0.256282 12.5063L5.76256 7L0.256282 1.49372C-0.0854272 1.15201 -0.0854272 0.59799 0.256282 0.256282Z"
        fill="#474E5A"
      />
    </svg>
  )
}

export function CloseTinyIcon({ className }: { className?: string } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.248959 0.248959C0.580905 -0.0829864 1.1191 -0.0829864 1.45104 0.248959L5 3.79792L8.54896 0.248959C8.88091 -0.0829864 9.4191 -0.0829864 9.75104 0.248959C10.083 0.580905 10.083 1.1191 9.75104 1.45104L6.20208 5L9.75104 8.54896C10.083 8.88091 10.083 9.4191 9.75104 9.75104C9.4191 10.083 8.88091 10.083 8.54896 9.75104L5 6.20208L1.45104 9.75104C1.1191 10.083 0.580905 10.083 0.248959 9.75104C-0.0829864 9.4191 -0.0829864 8.88091 0.248959 8.54896L3.79792 5L0.248959 1.45104C-0.0829864 1.1191 -0.0829864 0.580905 0.248959 0.248959Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="7" height="12" viewBox="0 0 7 12" fill="none" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.256.256c-.342.342-.342.897 0 1.238L4.762 6 .256 10.256c-.342.342-.342.897 0 1.238s.897.342 1.238 0l5-5c.342-.342.342-.897 0-1.238l-5-5c-.342-.342-.897-.342-1.238 0Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ChevronLeftIcon({ className }: { className?: string } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.78033 2.21967C8.07322 2.51256 8.07322 2.98744 7.78033 3.28033L5.06066 6L7.78033 8.71967C8.07322 9.01256 8.07322 9.48744 7.78033 9.78033C7.48744 10.0732 7.01256 10.0732 6.71967 9.78033L3.46967 6.53033C3.17678 6.23744 3.17678 5.76256 3.46967 5.46967L6.71967 2.21967C7.01256 1.92678 7.48744 1.92678 7.78033 2.21967Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ExitIcon({ className }: { className?: string } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="14"
      viewBox="0 0 15 14"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 0C13.5188 0 14.75 1.23122 14.75 2.75V11.25C14.75 12.7688 13.5188 14 12 14H7.75C7.33579 14 7 13.6642 7 13.25C7 12.8358 7.33579 12.5 7.75 12.5H12C12.6904 12.5 13.25 11.9404 13.25 11.25V2.75C13.25 2.05964 12.6904 1.5 12 1.5H7.75C7.33579 1.5 7 1.16421 7 0.75C7 0.335786 7.33579 0 7.75 0H12Z"
        fill="currentColor"
      />
      <path
        d="M3.71967 2.96967C4.01256 2.67678 4.48744 2.67678 4.78033 2.96967C5.07322 3.26256 5.07322 3.73744 4.78033 4.03033L2.56066 6.25H9.75C10.1642 6.25 10.5 6.58579 10.5 7C10.5 7.41421 10.1642 7.75 9.75 7.75H2.56066L4.78033 9.96967C5.07322 10.2626 5.07322 10.7374 4.78033 11.0303C4.48744 11.3232 4.01256 11.3232 3.71967 11.0303L0.219669 7.53033C0.0790167 7.38968 -9.53674e-07 7.19891 -9.53674e-07 7C-9.53674e-07 6.80109 0.0790167 6.61032 0.219669 6.46967L3.71967 2.96967Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function HelpIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.8864 4.92282C6.65368 5.17294 6.5 5.55331 6.5 6.04545C6.5 6.45967 6.16421 6.79545 5.75 6.79545C5.33579 6.79545 5 6.45967 5 6.04545C5 5.24215 5.2544 4.47479 5.78823 3.90105C6.32915 3.31968 7.09913 3 8 3C8.90087 3 9.67085 3.31968 10.2118 3.90105C10.7456 4.47479 11 5.24215 11 6.04545C11 7.27924 10.1311 7.96688 9.56438 8.37658C9.47014 8.4447 9.38575 8.5042 9.30937 8.55805C9.11953 8.69189 8.97916 8.79085 8.85995 8.90077C8.79024 8.96503 8.76105 9.00433 8.75 9.02233V9.5C8.75 9.91421 8.41421 10.25 8 10.25C7.58579 10.25 7.25 9.91421 7.25 9.5V9C7.25 8.43699 7.57587 8.04442 7.84318 7.79796C8.04139 7.61521 8.29958 7.43355 8.51465 7.28224C8.57594 7.23911 8.63372 7.19846 8.68562 7.16094C9.24387 6.75739 9.5 6.46776 9.5 6.04545C9.5 5.55331 9.34631 5.17294 9.1136 4.92282C8.88797 4.68032 8.53295 4.5 8 4.5C7.46705 4.5 7.11203 4.68032 6.8864 4.92282Z"
        fill="#474E5A"
      />
      <path d="M9 12C9 12.5514 8.5514 13 8 13C7.4486 13 7 12.5514 7 12C7 11.4486 7.4486 11 8 11C8.5514 11 9 11.4486 9 12Z" fill="#474E5A" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 9.02218 1.67899 9.60751 2.10262 10.3985C2.4189 10.989 2.51047 11.712 2.28063 12.4015L1.62171 14.3783L3.59848 13.7194C4.28801 13.4895 5.01103 13.5811 5.60154 13.8974C6.39249 14.321 6.97782 14.5 8 14.5ZM8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 9.29031 0.250384 10.1172 0.780342 11.1067C0.915539 11.3591 0.948157 11.6555 0.857606 11.9272L0.0513167 14.3461C0.0173279 14.448 0 14.5548 0 14.6623V15C0 15.5523 0.447715 16 1 16H1.33772C1.4452 16 1.55198 15.9827 1.65395 15.9487L4.07282 15.1424C4.34447 15.0518 4.6409 15.0845 4.89332 15.2197C5.88278 15.7496 6.70969 16 8 16Z"
        fill="#474E5A"
      />
    </svg>
  )
}

export function ControlsIcon({ className }: { className?: string } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.5 7C12.433 7 14 8.567 14 10.5C14 12.433 12.433 14 10.5 14C8.82456 14 7.42548 12.8224 7.08203 11.25H1.625C1.21079 11.25 0.875 10.9142 0.875 10.5C0.875 10.0858 1.21079 9.75 1.625 9.75H7.08203C7.42548 8.17757 8.82456 7.00001 10.5 7ZM10.5 8.5C9.39544 8.50001 8.5 9.39544 8.5 10.5C8.5 11.6046 9.39544 12.5 10.5 12.5C11.6046 12.5 12.5 11.6046 12.5 10.5C12.5 9.39543 11.6046 8.5 10.5 8.5Z"
        fill="#474E5A"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.5 0C5.17545 0 6.57452 1.17756 6.91797 2.75H12.375C12.7892 2.75 13.125 3.08579 13.125 3.5C13.125 3.91421 12.7892 4.25 12.375 4.25H6.91797C6.57452 5.82244 5.17545 7 3.5 7C1.567 7 0 5.433 0 3.5C0 1.567 1.567 0 3.5 0ZM3.5 1.5C2.39543 1.5 1.5 2.39543 1.5 3.5C1.5 4.60457 2.39543 5.5 3.5 5.5C4.60457 5.5 5.5 4.60457 5.5 3.5C5.5 2.39543 4.60457 1.5 3.5 1.5Z"
        fill="#474E5A"
      />
    </svg>
  )
}

export function AiSparkleIcon({ className }: { className?: string } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M11.4725 2.62411C11.5435 2.59893 11.5994 2.54302 11.6246 2.47196L12.2649 0.665039C12.3042 0.554041 12.4023 0.49854 12.5005 0.498535C12.5986 0.498531 12.6968 0.554032 12.7361 0.665038L13.3764 2.47196C13.4016 2.54302 13.4575 2.59893 13.5285 2.62411L15.3355 3.26436C15.4465 3.30369 15.502 3.40184 15.502 3.5C15.502 3.59816 15.4465 3.69631 15.3355 3.73565L13.5285 4.3759C13.4575 4.40108 13.4016 4.45698 13.3764 4.52805L12.7361 6.33497C12.6968 6.44597 12.5986 6.50147 12.5005 6.50147C12.4023 6.50147 12.3042 6.44597 12.2649 6.33497L11.6246 4.52805C11.5994 4.45698 11.5435 4.40108 11.4725 4.3759L9.66554 3.73565C9.55453 3.69632 9.49903 3.59816 9.49903 3.5C9.49903 3.40184 9.55453 3.30369 9.66553 3.26436L11.4725 2.62411Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.0005 5.49119L6.44075 7.07092C6.21413 7.71049 5.71098 8.21363 5.07142 8.44025L3.49169 9L5.07142 9.55975C5.71098 9.78637 6.21413 10.2895 6.44075 10.9291L7.0005 12.5088L7.56025 10.9291C7.78687 10.2895 8.29001 9.78637 8.92958 9.55975L10.5093 9L8.92958 8.44025C8.29001 8.21363 7.78687 7.71049 7.56025 7.07092L7.0005 5.49119ZM7.70743 2.99511C7.58943 2.6621 7.29496 2.49559 7.00049 2.4956C6.70602 2.4956 6.41156 2.6621 6.29356 2.99511L5.02688 6.56994C4.95134 6.78313 4.78363 6.95084 4.57044 7.02638L0.995603 8.29307C0.662596 8.41106 0.496093 8.70553 0.496094 9C0.496094 9.29447 0.662598 9.58894 0.995604 9.70693L4.57044 10.9736C4.78363 11.0492 4.95134 11.2169 5.02688 11.4301L6.29356 15.0049C6.41156 15.3379 6.70602 15.5044 7.00049 15.5044C7.29496 15.5044 7.58943 15.3379 7.70743 15.0049L8.97411 11.4301C9.04965 11.2169 9.21737 11.0492 9.43056 10.9736L13.0054 9.70693C13.3384 9.58894 13.5049 9.29447 13.5049 9C13.5049 8.70553 13.3384 8.41106 13.0054 8.29307L9.43056 7.02638C9.21737 6.95084 9.04965 6.78313 8.97411 6.56994L7.70743 2.99511Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function CodeBracketsIcon({ className }: { className?: string } = {}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" viewBox="0 0 16 15" fill="none" className={className}>
      <path d="M8.36538 0.688642C8.45458 0.227753 8.90052 -0.073558 9.36141 0.0156448C9.8223 0.104848 10.1236 0.550785 10.0344 1.01167L7.63445 13.4116C7.54525 13.8725 7.09931 14.1738 6.63842 14.0846C6.17753 13.9954 5.87622 13.5495 5.96543 13.0886L8.36538 0.688642Z" fill="currentColor"/>
      <path d="M5.20094 2.44891C5.53289 2.78085 5.53289 3.31904 5.20095 3.65099L1.80208 7.0499L4.60107 9.84889C4.93301 10.1808 4.93301 10.719 4.60107 11.051C4.26912 11.3829 3.73093 11.3829 3.39898 11.051L0.395406 8.04739C0.142232 7.79422 0 7.45084 0 7.0928V7.00701C0 6.64897 0.14223 6.3056 0.395399 6.05242L3.99886 2.44891C4.3308 2.11697 4.86899 2.11696 5.20094 2.44891Z" fill="currentColor"/>
      <path d="M11.399 3.04926C11.7309 2.71731 12.2691 2.7173 12.6011 3.04924L15.6045 6.0526C15.8577 6.30577 16 6.64916 16 7.00721V7.09299C16 7.45103 15.8577 7.79441 15.6045 8.04758L12.0011 11.6511C11.6691 11.983 11.131 11.983 10.799 11.6511C10.4671 11.3191 10.4671 10.7809 10.799 10.449L14.1979 7.05011L11.399 4.25135C11.067 3.91941 11.067 3.38122 11.399 3.04926Z" fill="currentColor"/>
    </svg>
  )
}

export function EllipsesIcon({ className }: { className?: string } = {}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="3" viewBox="0 0 12 3" fill="none" className={className}>
      <path
        d="M5.75 2.5C6.44036 2.5 7 1.94036 7 1.25C7 0.559644 6.44036 0 5.75 0C5.05964 0 4.5 0.559644 4.5 1.25C4.5 1.94036 5.05964 2.5 5.75 2.5Z"
        fill="#474E5A"
      />
      <path
        d="M10.25 2.5C10.9404 2.5 11.5 1.94036 11.5 1.25C11.5 0.559644 10.9404 0 10.25 0C9.55964 0 9 0.559644 9 1.25C9 1.94036 9.55964 2.5 10.25 2.5Z"
        fill="#474E5A"
      />
      <path
        d="M1.25 2.5C1.94036 2.5 2.5 1.94036 2.5 1.25C2.5 0.559644 1.94036 0 1.25 0C0.559644 0 0 0.559644 0 1.25C0 1.94036 0.559644 2.5 1.25 2.5Z"
        fill="#474E5A"
      />
    </svg>
  )
}

export function AddSmallIcon({ className }: { className?: string } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="8"
      height="8"
      viewBox="0 0 8 8"
      fill="none"
      className={className ?? "text-[#533AFD]"}
    >
      <path
        d="M4.75 0.75C4.75 0.335786 4.41421 0 4 0C3.58579 0 3.25 0.335786 3.25 0.75V3.25H0.75C0.335786 3.25 0 3.58579 0 4C0 4.41421 0.335786 4.75 0.75 4.75H3.25V7.25C3.25 7.66421 3.58579 8 4 8C4.41421 8 4.75 7.66421 4.75 7.25V4.75H7.25C7.66421 4.75 8 4.41421 8 4C8 3.58579 7.66421 3.25 7.25 3.25H4.75V0.75Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ProductIcon({ className }: { className?: string } = {}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.5 8.0205V3.9795C10.5 3.622 10.3095 3.292 10 3.1135L6.5 1.093C6.1905 0.914497 5.8095 0.914497 5.5 1.093L2 3.113C1.6905 3.292 1.5 3.622 1.5 3.9795V8.021C1.5 8.3785 1.6905 8.7085 2 8.887L5.5 10.9075C5.8095 11.086 6.1905 11.086 6.5 10.9075L10 8.887C10.3095 8.708 10.5 8.378 10.5 8.0205Z"
        stroke="#474E5A"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 11.04V6" stroke="#474E5A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M6 6L10.365 3.48"
        stroke="#474E5A"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.63477 3.48L5.99977 6"
        stroke="#474E5A"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PriceIcon({ className }: { className?: string } = {}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className={className}>
      <path
        d="M4.15658 3.87947C4.23253 3.95543 4.23253 4.07858 4.15658 4.15454C4.08062 4.2305 3.95747 4.2305 3.88151 4.15454C3.80555 4.07858 3.80555 3.95543 3.88151 3.87947C3.95747 3.80352 4.08062 3.80352 4.15658 3.87947"
        stroke="#474E5A"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.622 1.5125L5.0465 1.5C5.312 1.4975 5.5675 1.6025 5.7555 1.79L10.2075 6.244C10.598 6.6345 10.598 7.268 10.2075 7.6585L7.6605 10.207C7.27 10.598 6.636 10.598 6.2455 10.207L1.79 5.75C1.6045 5.5645 1.5 5.3125 1.5 5.0495V3.6435C1.5 3.3805 1.6045 3.1285 1.79 2.943L2.93 1.8025C3.114 1.6185 3.3625 1.5145 3.622 1.5125Z"
        stroke="#474E5A"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MeterIcon({ className, style }: { className?: string; style?: React.CSSProperties } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={className}
      style={style}
    >
      <path fillRule="evenodd" clipRule="evenodd" d="M6 2.71923C3.64416 2.71923 1.73437 4.59963 1.73437 6.91923C1.73437 7.75286 1.98018 8.5281 2.40478 9.18077H9.59522C10.0198 8.5281 10.2656 7.75286 10.2656 6.91923C10.2656 4.59963 8.35584 2.71923 6 2.71923ZM9.86084 10.15C10.0112 10.15 10.1548 10.0832 10.2443 9.96232C10.8768 9.1086 11.25 8.05683 11.25 6.91923C11.25 4.06434 8.89949 1.75 6 1.75C3.10051 1.75 0.75 4.06434 0.75 6.91923C0.75 8.05683 1.12322 9.1086 1.75567 9.96232C1.8452 10.0832 1.98877 10.15 2.13916 10.15H9.86084Z" fill="currentColor"/>
      <path d="M7.69152 4.77907C7.79133 4.68757 7.91879 4.64286 8.0456 4.64446C8.17414 4.64607 8.30202 4.69527 8.39978 4.79152C8.5 4.8902 8.54999 5.02006 8.54917 5.14984C8.5484 5.27151 8.50297 5.39312 8.41242 5.48888L6.06273 7.9738C5.93486 8.10903 5.76071 8.17548 5.5874 8.17232C5.42954 8.16945 5.27237 8.10882 5.15151 7.98982C5.02729 7.86751 4.9657 7.70746 4.96604 7.54771C4.96639 7.38136 5.0339 7.21534 5.16777 7.09261L7.69152 4.77907Z" fill="currentColor"/>
      <path d="M1.73437 6.91923C1.73437 4.59963 3.64416 2.71923 6 2.71923C8.35584 2.71923 10.2656 4.59963 10.2656 6.91923C10.2656 7.75286 10.0198 8.5281 9.59522 9.18077H2.40478C1.98018 8.5281 1.73437 7.75286 1.73437 6.91923ZM11.25 6.91923C11.25 8.05683 10.8768 9.1086 10.2443 9.96232C10.1548 10.0832 10.0112 10.15 9.86084 10.15H2.13916C1.98877 10.15 1.8452 10.0832 1.75567 9.96232C1.12322 9.1086 0.75 8.05683 0.75 6.91923C0.75 4.06434 3.10051 1.75 6 1.75C8.89949 1.75 11.25 4.06434 11.25 6.91923ZM5.15151 7.98982C5.02729 7.86751 4.9657 7.70746 4.96604 7.54771C4.96639 7.38136 5.0339 7.21534 5.16777 7.09261L7.69152 4.77907C7.79133 4.68757 7.91879 4.64286 8.0456 4.64446C8.17414 4.64607 8.30202 4.69527 8.39978 4.79152C8.5 4.8902 8.54999 5.02006 8.54917 5.14984C8.5484 5.27151 8.50297 5.39312 8.41242 5.48888L6.06273 7.9738C5.93486 8.10903 5.76071 8.17548 5.5874 8.17232C5.42954 8.16945 5.27237 8.10882 5.15151 7.98982Z" stroke="currentColor" strokeWidth="0.2"/>
    </svg>
  )
}

export function SingleProductIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.75 12.0308V5.96925C15.75 5.433 15.4643 4.938 15 4.67025L9.75 1.6395C9.28575 1.37175 8.71425 1.37175 8.25 1.6395L3 4.6695C2.53575 4.938 2.25 5.433 2.25 5.96925V12.0315C2.25 12.5678 2.53575 13.0628 3 13.3305L8.25 16.3613C8.71425 16.629 9.28575 16.629 9.75 16.3613L15 13.3305C15.4643 13.062 15.75 12.567 15.75 12.0308Z"
        stroke="#474E5A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 16.56V9" stroke="#474E5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 9L15.5475 5.22" stroke="#474E5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.45215 5.22L8.99965 9" stroke="#474E5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PricingPlanIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M17.4995 14.15L9.99121 17.5" stroke="#474E5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.99167 17.5L2.5 14.15" stroke="#474E5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.4995 10L9.99121 13.35" stroke="#474E5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.99167 13.35L2.5 10" stroke="#474E5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.5 5.85333L9.98917 9.2075L17.5 5.85333L10.0108 2.5L2.5 5.85333Z"
        stroke="#474E5A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PricingPlanMiniIcon({ style }: { style?: React.CSSProperties } = {}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 10 12" fill="none" style={{ aspectRatio: '10/10.74', ...style }}>
      <path d="M9.20215 2.45391C9.33538 2.3781 9.50087 2.47439 9.50098 2.62774V7.57109C9.50098 7.6677 9.4491 7.75655 9.36523 7.80449L5.29102 10.1326C5.15772 10.2086 4.99219 10.1123 4.99219 9.95879V5.01641C4.99219 4.91979 5.04404 4.82997 5.12793 4.78203L9.20215 2.45391Z" stroke="currentColor"/>
      <path d="M0.799805 2.45391C0.666572 2.3781 0.501082 2.47439 0.500977 2.62774V7.57109C0.500977 7.6677 0.552852 7.75655 0.636719 7.80449L4.71094 10.1326C4.84424 10.2086 5.00977 10.1123 5.00977 9.95879V5.01641C5.00977 4.91979 4.95791 4.82997 4.87402 4.78203L0.799805 2.45391Z" stroke="currentColor"/>
      <path d="M9.13199 2.49882L5.37978 4.65718C5.14255 4.79364 4.85069 4.79378 4.61333 4.65756L0.851973 2.49888C0.781458 2.45841 0.786144 2.35517 0.860036 2.32126L4.67543 0.570118C4.87934 0.476529 5.11394 0.476631 5.31777 0.570396L9.12392 2.32129C9.19771 2.35523 9.20239 2.45833 9.13199 2.49882Z" stroke="currentColor"/>
    </svg>
  )
}

export function RateMiniIcon({ style }: { style?: React.CSSProperties } = {}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" style={style}>
      <path d="M4.66797 0.950195C4.94642 0.950215 5.21326 1.06092 5.41016 1.25781L10.5352 6.38281C10.9452 6.79285 10.9452 7.45715 10.5352 7.86719L7.86719 10.5352C7.45715 10.9452 6.79285 10.9452 6.38281 10.5352L1.25781 5.41016C1.06092 5.21326 0.950215 4.94642 0.950195 4.66797V2C0.950195 1.4201 1.4201 0.950195 2 0.950195H4.66797Z" stroke="currentColor" strokeWidth="1.1"/>
      <circle cx="3.35" cy="3.35" r="0.85" fill="currentColor"/>
    </svg>
  )
}

export function CreditGrantMiniIcon({ style }: { style?: React.CSSProperties } = {}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" style={style}>
      <mask id="cg-mask" fill="white">
        <rect x="1" y="4" width="10" height="7" rx="1"/>
      </mask>
      <rect x="1" y="4" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="2.4" mask="url(#cg-mask)"/>
      <rect x="5.5" y="5" width="1.2" height="5" fill="currentColor"/>
      <circle cx="4.57146" cy="3.12857" r="1.42857" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="7.42857" cy="3.12857" r="1.42857" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  )
}

export function SubscriptionFeeMiniIcon({ style }: { style?: React.CSSProperties } = {}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" style={style}>
      <mask id="lf-mask" fill="white">
        <rect x="1" y="2" width="10" height="8" rx="1"/>
      </mask>
      <rect x="1" y="2" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="2.4" mask="url(#lf-mask)"/>
      <rect x="5.45001" y="4.5" width="1.2" height="3" rx="0.6" fill="currentColor"/>
    </svg>
  )
}

export function ProductMiniIcon({ style }: { style?: React.CSSProperties } = {}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" style={style}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.5 8.0205V3.9795C10.5 3.622 10.3095 3.292 10 3.1135L6.5 1.093C6.1905 0.914497 5.8095 0.914497 5.5 1.093L2 3.113C1.6905 3.292 1.5 3.622 1.5 3.9795V8.021C1.5 8.3785 1.6905 8.7085 2 8.887L5.5 10.9075C5.8095 11.086 6.1905 11.086 6.5 10.9075L10 8.887C10.3095 8.708 10.5 8.378 10.5 8.0205Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 11.04V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 6L10.365 3.48" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1.63477 3.48L5.99977 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function RateCardMiniIcon({ style }: { style?: React.CSSProperties } = {}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" style={style}>
      <rect x="1.25" y="1.5" width="9.5" height="3" rx="0.6" stroke="currentColor" strokeWidth="1.05"/>
      <rect x="1.25" y="7" width="9.5" height="3" rx="0.6" stroke="currentColor" strokeWidth="1.05"/>
    </svg>
  )
}

export function MeteredItemMiniIcon({ style }: { style?: React.CSSProperties } = {}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" style={style}>
      <g clipPath="url(#mi-clip)">
        <path d="M2.97461 10.5L4.4877 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7.51465 10.5L9.02774 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11.0002 3.78255H1.79004" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.2101 8.21736H1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <defs>
        <clipPath id="mi-clip">
          <rect width="12" height="12" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  )
}

export function SearchIcon({ className }: { className?: string } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className={className}
    >
      <rect x="0.5" y="0.5" width="6.77462" height="6.77462" rx="3.38731" stroke="#6C7688"/>
      <path d="M6.6648 6.52546L9.44158 8.88575" stroke="#6C7688" strokeLinecap="round"/>
    </svg>
  )
}

export function ChevronDownTiny({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="7.25" height="4.5" viewBox="0 0 8 5" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M0.231072 0.20851C-0.0679853 0.495107 -0.0780867 0.969873 0.20851 1.26893L3.08351 4.26893C3.22489 4.41646 3.42035 4.49992 3.62469 4.5C3.82903 4.50009 4.02455 4.41679 4.16606 4.26938L7.04106 1.27438C7.32791 0.975563 7.3182 0.500788 7.01938 0.213943C6.72056 -0.0729032 6.24579 -0.0631974 5.95894 0.235621L3.62545 2.66651L1.29149 0.231072C1.0049 -0.0679853 0.530129 -0.0780867 0.231072 0.20851Z" fill="#818DA0"/>
    </svg>
  )
}

export function SettingsIcon({ className }: { className?: string } = {}) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.9333 10C12.8445 10.2023 12.818 10.4262 12.8573 10.6435C12.8965 10.8608 12.9996 11.0618 13.1533 11.22L13.1933 11.26C13.3174 11.3839 13.4159 11.531 13.4832 11.693C13.5505 11.8549 13.5852 12.0284 13.5852 12.2037C13.5852 12.3789 13.5505 12.5524 13.4832 12.7143C13.4159 12.8763 13.3174 13.0234 13.1933 13.1473C13.0694 13.2714 12.9223 13.3699 12.7604 13.4372C12.5984 13.5045 12.4249 13.5392 12.2497 13.5392C12.0744 13.5392 11.9009 13.5045 11.739 13.4372C11.577 13.3699 11.4299 13.2714 11.306 13.1473L11.266 13.1073C11.1078 12.9537 10.9068 12.8505 10.6895 12.8113C10.4722 12.7721 10.2483 12.7985 10.046 12.8873C9.84774 12.9722 9.67881 13.1134 9.56011 13.2934C9.44141 13.4733 9.37827 13.684 9.37867 13.8993V14C9.37867 14.3536 9.23825 14.6928 8.98821 14.9428C8.73816 15.1929 8.39902 15.3333 8.04533 15.3333C7.69165 15.3333 7.35251 15.1929 7.10246 14.9428C6.85241 14.6928 6.712 14.3536 6.712 14V13.9463C6.70792 13.7256 6.63735 13.5113 6.50945 13.3311C6.38154 13.1509 6.20217 13.0133 5.99467 12.9367C5.79238 12.8478 5.56851 12.8214 5.35118 12.8606C5.13385 12.8999 4.93289 13.0031 4.77467 13.1567L4.73467 13.1967C4.61076 13.3208 4.46367 13.4193 4.30173 13.4866C4.13978 13.5539 3.96626 13.5886 3.791 13.5886C3.61574 13.5886 3.44222 13.5539 3.28028 13.4866C3.11833 13.4193 2.97124 13.3208 2.84733 13.1967C2.72327 13.0728 2.62475 12.9257 2.55746 12.7637C2.49017 12.6018 2.45548 12.4283 2.45548 12.253C2.45548 12.0778 2.49017 11.9042 2.55746 11.7423C2.62475 11.5804 2.72327 11.4333 2.84733 11.3093L2.88733 11.2693C3.04098 11.1111 3.14412 10.9102 3.18333 10.6929C3.22255 10.4755 3.19614 10.2517 3.10733 10.0493C3.02243 9.85111 2.88127 9.68218 2.7013 9.56348C2.52132 9.44478 2.31067 9.38164 2.09533 9.38204H2C1.64632 9.38204 1.30718 9.24163 1.05713 8.99158C0.807079 8.74153 0.666667 8.40239 0.666667 8.04871C0.666667 7.69502 0.807079 7.35588 1.05713 7.10583C1.30718 6.85579 1.64632 6.71538 2 6.71538H2.05367C2.27433 6.71129 2.48864 6.64072 2.66888 6.51282C2.84912 6.38492 2.98668 6.20555 3.06333 5.99804C3.15214 5.79576 3.17855 5.57188 3.13933 5.35456C3.10012 5.13723 2.99698 4.93626 2.84333 4.77804L2.80333 4.73804C2.67927 4.61413 2.58075 4.46704 2.51346 4.3051C2.44617 4.14315 2.41148 3.96963 2.41148 3.79437C2.41148 3.61911 2.44617 3.44559 2.51346 3.28365C2.58075 3.1217 2.67927 2.97461 2.80333 2.85071C2.92724 2.72665 3.07433 2.62812 3.23628 2.56083C3.39822 2.49354 3.57174 2.45886 3.747 2.45886C3.92226 2.45886 4.09578 2.49354 4.25773 2.56083C4.41967 2.62812 4.56676 2.72665 4.69067 2.85071L4.73067 2.89071C4.88889 3.04436 5.08985 3.1475 5.30718 3.18671C5.52451 3.22593 5.74838 3.19951 5.95067 3.11071H6C6.19822 3.0258 6.36715 2.88464 6.48585 2.70467C6.60455 2.52469 6.66769 2.31405 6.66729 2.09871V2C6.66729 1.64632 6.80771 1.30718 7.05776 1.05713C7.30781 0.807079 7.64694 0.666667 8.00063 0.666667C8.35431 0.666667 8.69345 0.807079 8.9435 1.05713C9.19354 1.30718 9.33396 1.64632 9.33396 2V2.05367C9.33356 2.26901 9.39669 2.47965 9.5154 2.65962C9.6341 2.8396 9.80302 2.98076 10.0013 3.06567C10.2036 3.15447 10.4275 3.18089 10.6448 3.14167C10.8621 3.10246 11.0631 2.99932 11.2213 2.84567L11.2613 2.80567C11.3852 2.68161 11.5323 2.58308 11.6943 2.51579C11.8562 2.4485 12.0297 2.41382 12.205 2.41382C12.3803 2.41382 12.5538 2.4485 12.7157 2.51579C12.8777 2.58308 13.0248 2.68161 13.1487 2.80567C13.2727 2.92957 13.3713 3.07666 13.4386 3.23861C13.5058 3.40056 13.5405 3.57408 13.5405 3.74933C13.5405 3.92459 13.5058 4.09811 13.4386 4.26006C13.3713 4.42201 13.2727 4.56909 13.1487 4.693L13.1087 4.733C12.955 4.89122 12.8519 5.09218 12.8127 5.30951C12.7734 5.52684 12.7999 5.75072 12.8887 5.953V6C12.9736 6.19822 13.1147 6.36715 13.2947 6.48585C13.4747 6.60455 13.6854 6.66769 13.9007 6.66729H14C14.3537 6.66729 14.6928 6.80771 14.9429 7.05776C15.1929 7.30781 15.3333 7.64694 15.3333 8.00063C15.3333 8.35431 15.1929 8.69345 14.9429 8.9435C14.6928 9.19354 14.3537 9.33396 14 9.33396H13.9463C13.731 9.33356 13.5204 9.39669 13.3404 9.5154C13.1604 9.6341 13.0193 9.80302 12.9343 10.0013L12.9333 10Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DuplicateIcon({ className }: { className?: string } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 0.5C2.17157 0.5 1.5 1.17157 1.5 2V7C1.5 7.82843 2.17157 8.5 3 8.5H4V10C4 10.8284 4.67157 11.5 5.5 11.5H10C10.8284 11.5 11.5 10.8284 11.5 10V5C11.5 4.17157 10.8284 3.5 10 3.5H8.5V2C8.5 1.17157 7.82843 0.5 7 0.5H3ZM7.1 3.5V2C7.1 1.9448 7.0552 1.9 7 1.9H3C2.9448 1.9 2.9 1.9448 2.9 2V7C2.9 7.0552 2.9448 7.1 3 7.1H4V5C4 4.17157 4.67157 3.5 5.5 3.5H7.1ZM5.5 4.9C5.4448 4.9 5.4 4.9448 5.4 5V10C5.4 10.0552 5.4448 10.1 5.5 10.1H10C10.0552 10.1 10.1 10.0552 10.1 10V5C10.1 4.9448 10.0552 4.9 10 4.9H5.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function CopyIcon({ className }: { className?: string } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 0.5C1.17157 0.5 0.5 1.17157 0.5 2V8C0.5 8.82843 1.17157 9.5 2 9.5H3V10C3 10.8284 3.67157 11.5 4.5 11.5H10C10.8284 11.5 11.5 10.8284 11.5 10V4C11.5 3.17157 10.8284 2.5 10 2.5H9V2C9 1.17157 8.32843 0.5 7.5 0.5H2ZM7.6 2.5V2C7.6 1.9448 7.5552 1.9 7.5 1.9H2C1.9448 1.9 1.9 1.9448 1.9 2V8C1.9 8.0552 1.9448 8.1 2 8.1H3V4C3 3.17157 3.67157 2.5 4.5 2.5H7.6ZM4.5 3.9C4.4448 3.9 4.4 3.9448 4.4 4V10C4.4 10.0552 4.4448 10.1 4.5 10.1H10C10.0552 10.1 10.1 10.0552 10.1 10V4C10.1 3.9448 10.0552 3.9 10 3.9H4.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function PasteIcon({ className }: { className?: string } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.5 0C4.08579 0 3.75 0.335786 3.75 0.75V1H2.5C1.67157 1 1 1.67157 1 2.5V10.5C1 11.3284 1.67157 12 2.5 12H9.5C10.3284 12 11 11.3284 11 10.5V2.5C11 1.67157 10.3284 1 9.5 1H8.25V0.75C8.25 0.335786 7.91421 0 7.5 0H4.5ZM8.25 2.4V2.5C8.25 2.91421 7.91421 3.25 7.5 3.25H4.5C4.08579 3.25 3.75 2.91421 3.75 2.5V2.4H2.5C2.44477 2.4 2.4 2.44477 2.4 2.5V10.5C2.4 10.5552 2.44477 10.6 2.5 10.6H9.5C9.55523 10.6 9.6 10.5552 9.6 10.5V2.5C9.6 2.44477 9.55523 2.4 9.5 2.4H8.25ZM5.15 1.4V1.85H6.85V1.4H5.15Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Left panel toggle icon matching Figma design. Indicator darkens when active. */
export function PanelLeftIcon({ className, active }: { className?: string; active?: boolean } = {}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="10" viewBox="0 0 12 10" fill="none" className={className} aria-hidden="true">
      <rect x="0.5" y="0.5" width="11" height="9" rx="1.5" stroke="#474E5A" fill="white" />
      <rect
        x="2" y="2" width="3" height="6" rx="1"
        style={{ fill: active ? "#474E5A" : "#B6C0CD", transition: "fill 200ms ease" }}
      />
    </svg>
  )
}

/** Right panel toggle icon matching Figma design. Indicator darkens when active. */
export function PanelRightIcon({ className, active }: { className?: string; active?: boolean } = {}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="10" viewBox="0 0 12 10" fill="none" className={className} aria-hidden="true">
      <rect x="0.5" y="0.5" width="11" height="9" rx="1.5" stroke="#474E5A" fill="white" />
      <rect
        x="7" y="2" width="3" height="6" rx="1"
        style={{ fill: active ? "#474E5A" : "#B6C0CD", transition: "fill 200ms ease" }}
      />
    </svg>
  )
}

/** Bottom panel toggle icon matching Figma design. Indicator darkens when active. */
export function PanelBottomIcon({ className, active }: { className?: string; active?: boolean } = {}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="10" viewBox="0 0 12 10" fill="none" className={className} aria-hidden="true">
      <rect x="0.5" y="0.5" width="11" height="9" rx="1.5" stroke="#474E5A" fill="white" />
      <rect
        x="2" y="5" width="8" height="3" rx="1"
        style={{ fill: active ? "#474E5A" : "#B6C0CD", transition: "fill 200ms ease" }}
      />
    </svg>
  )
}

/** Preview (eye) icon for Map/Preview toggle. Use currentColor for fill (default #474E5A / var(--icon-default)). */
export function PreviewEyeIcon({ className, style }: { className?: string; style?: React.CSSProperties } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="10"
      viewBox="0 0 12 10"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.00037 3.18713C5.17194 3.18713 4.50037 3.85871 4.50037 4.68713C4.50037 5.51556 5.17194 6.18713 6.00037 6.18713C6.82879 6.18713 7.50037 5.51556 7.50037 4.68713C7.50037 3.85871 6.82879 3.18713 6.00037 3.18713ZM3.37537 4.68713C3.37537 3.23739 4.55062 2.06213 6.00037 2.06213C7.45011 2.06213 8.62537 3.23739 8.62537 4.68713C8.62537 6.13688 7.45011 7.31213 6.00037 7.31213C4.55062 7.31213 3.37537 6.13688 3.37537 4.68713Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.60714 2.355C1.64918 3.10037 1.125 3.98633 1.125 4.6875C1.125 5.38867 1.64918 6.27463 2.60714 7.02C3.54536 7.75 4.78618 8.25 6 8.25C7.21382 8.25 8.45464 7.75 9.39286 7.02C10.3508 6.27463 10.875 5.38867 10.875 4.6875C10.875 3.98633 10.3508 3.10037 9.39286 2.355C8.45464 1.625 7.21382 1.125 6 1.125C4.78618 1.125 3.54536 1.625 2.60714 2.355ZM1.9163 1.46711C3.01714 0.610574 4.49507 0 6 0C7.50493 0 8.98286 0.610574 10.0837 1.46711C11.1648 2.30828 12 3.48482 12 4.6875C12 5.89018 11.1648 7.06672 10.0837 7.90789C8.98286 8.76443 7.50493 9.375 6 9.375C4.49507 9.375 3.01714 8.76443 1.9163 7.90789C0.835196 7.06672 0 5.89018 0 4.6875C0 3.48482 0.835196 2.30828 1.9163 1.46711Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Map (tree/structure) icon for Map/Preview toggle. Use currentColor for fill (default #667691 / var(--icon-subdued)). */
export function MapTreeIcon({ className, style }: { className?: string; style?: React.CSSProperties } = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 1.5C3 0.671573 3.67157 0 4.5 0H7.5C8.32843 0 9 0.671573 9 1.5V3C9 3.82843 8.32843 4.5 7.5 4.5H6.48757V5.7H8.62507C9.30853 5.7 9.86257 6.25405 9.86257 6.9375V7.5H10.5C11.3284 7.5 12 8.17157 12 9V10.5C12 11.3284 11.3284 12 10.5 12H8.25C7.42157 12 6.75 11.3284 6.75 10.5V9C6.75 8.17157 7.42157 7.5 8.25 7.5H8.88757V6.9375C8.88757 6.79252 8.77005 6.675 8.62507 6.675H3.37507C3.2301 6.675 3.11257 6.79252 3.11257 6.9375V7.5H3.75C4.57843 7.5 5.25 8.17157 5.25 9V10.5C5.25 11.3284 4.57843 12 3.75 12H1.5C0.671573 12 0 11.3284 0 10.5V9C0 8.17157 0.671573 7.5 1.5 7.5H2.13757V6.9375C2.13757 6.25405 2.69162 5.7 3.37507 5.7H5.51257V4.5H4.5C3.67157 4.5 3 3.82843 3 3V1.5ZM4.5 1.125H7.5C7.70711 1.125 7.875 1.29289 7.875 1.5V3C7.875 3.20711 7.70711 3.375 7.5 3.375H4.5C4.29289 3.375 4.125 3.20711 4.125 3V1.5C4.125 1.29289 4.29289 1.125 4.5 1.125ZM1.5 8.625H3.75C3.95711 8.625 4.125 8.79289 4.125 9V10.5C4.125 10.7071 3.95711 10.875 3.75 10.875H1.5C1.29289 10.875 1.125 10.7071 1.125 10.5V9C1.125 8.79289 1.29289 8.625 1.5 8.625ZM10.5 8.625H8.25C8.04289 8.625 7.875 8.79289 7.875 9V10.5C7.875 10.7071 8.04289 10.875 8.25 10.875H10.5C10.7071 10.875 10.875 10.7071 10.875 10.5V9C10.875 8.79289 10.7071 8.625 10.5 8.625Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function CursorBrandIcon({ className }: { className?: string } = {}) {
  return (
    <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} aria-hidden="true">
      <g clipPath="url(#cb_c0)">
        <rect width="512" height="512" rx="122" fill="#000"/>
        <g clipPath="url(#cb_c1)">
          <mask id="cb_a" style={{maskType:"luminance"}} maskUnits="userSpaceOnUse" x="85" y="89" width="343" height="334">
            <path d="M85 89h343v334H85V89z" fill="#fff"/>
          </mask>
          <g mask="url(#cb_a)">
            <path d="M255.428 423l148.991-83.5L255.428 256l-148.99 83.5 148.99 83.5z" fill="url(#cb_g0)"/>
            <path d="M404.419 339.5v-167L255.428 89v167l148.991 83.5z" fill="url(#cb_g1)"/>
            <path d="M255.428 89l-148.99 83.5v167l148.99-83.5V89z" fill="url(#cb_g2)"/>
            <path d="M404.419 172.5L255.428 423V256l148.991-83.5z" fill="#E4E4E4"/>
            <path d="M404.419 172.5L255.428 256l-148.99-83.5h297.981z" fill="#fff"/>
          </g>
        </g>
      </g>
      <defs>
        <linearGradient id="cb_g0" x1="255.428" y1="256" x2="255.428" y2="423" gradientUnits="userSpaceOnUse">
          <stop offset=".16" stopColor="#fff" stopOpacity=".39"/><stop offset=".658" stopColor="#fff" stopOpacity=".8"/>
        </linearGradient>
        <linearGradient id="cb_g1" x1="404.419" y1="173.015" x2="257.482" y2="261.497" gradientUnits="userSpaceOnUse">
          <stop offset=".182" stopColor="#fff" stopOpacity=".31"/><stop offset=".715" stopColor="#fff" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="cb_g2" x1="255.428" y1="89" x2="112.292" y2="342.802" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity=".6"/><stop offset=".667" stopColor="#fff" stopOpacity=".22"/>
        </linearGradient>
        <clipPath id="cb_c0"><path fill="#fff" d="M0 0h512v512H0z"/></clipPath>
        <clipPath id="cb_c1"><path fill="#fff" transform="translate(85 89)" d="M0 0h343v334H0z"/></clipPath>
      </defs>
    </svg>
  )
}

export function LoopsBrandIcon({ className }: { className?: string } = {}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 85" fill="none" className={className} aria-hidden="true">
      <path d="M55.42 1.18794e-06H42.26C31.0543 0.0132386 20.3115 4.47124 12.3888 12.3958C4.46605 20.3204 0.0105861 31.0643 0 42.27C0.0132325 53.474 4.46986 64.2153 12.3923 72.1377C20.3147 80.0601 31.056 84.5168 42.26 84.53H55.47C66.6757 84.5194 77.4196 80.064 85.3442 72.1412C93.2688 64.2185 97.7268 53.4757 97.74 42.27C97.7294 31.0539 93.2657 20.3009 85.33 12.3746C77.3943 4.44833 66.6361 -0.00265476 55.42 1.18794e-06ZM5.23 42.27C5.23 32.457 9.1282 23.0459 16.067 16.1071C23.0059 9.16821 32.417 5.27 42.23 5.27C44.297 5.27 46.361 5.44 48.4 5.78C57.0318 7.20764 64.8735 11.6615 70.5207 18.344C76.1679 25.0264 79.2517 33.501 79.22 42.25C79.21 47.8682 77.2143 53.3021 73.5856 57.5914C69.957 61.8806 64.9289 64.7491 59.39 65.69C63.0795 62.9963 66.0805 59.4691 68.1485 55.3958C70.2164 51.3225 71.2928 46.8182 71.29 42.25C71.3012 35.8051 69.1653 29.5401 65.2194 24.4443C61.2735 19.3485 55.7426 15.7123 49.5 14.11C47.1255 13.4963 44.6825 13.1872 42.23 13.19C34.5357 13.2138 27.1641 16.285 21.729 21.7314C16.2939 27.1778 13.2379 34.5556 13.23 42.25C13.2103 49.3903 15.005 56.4185 18.4456 62.6752C21.8861 68.9319 26.8599 74.212 32.9 78.02C24.9948 75.9442 17.9979 71.3127 12.9987 64.8467C7.99958 58.3807 5.27878 50.4431 5.26 42.27H5.23ZM48.82 19.44C53.7721 20.8662 58.1256 23.865 61.223 27.9835C64.3205 32.1021 65.9937 37.1167 65.99 42.27C65.9916 47.4216 64.3173 52.4339 61.22 56.5505C58.1227 60.667 53.7704 63.6643 48.82 65.09C43.8696 63.6643 39.5173 60.667 36.42 56.5505C33.3227 52.4339 31.6484 47.4216 31.65 42.27C31.6463 37.1167 33.3195 32.1021 36.417 27.9835C39.5144 23.865 43.8679 20.8662 48.82 19.44ZM55.42 79.25H55.27C53.2597 79.239 51.2534 79.0685 49.27 78.74C40.8519 77.344 33.1801 73.0675 27.5658 66.6416C21.9516 60.2157 18.7435 52.0393 18.49 43.51V42.27C18.4963 36.6507 20.4906 31.2149 24.1199 26.9249C27.7492 22.6348 32.7794 19.7673 38.32 18.83C34.6286 21.5226 31.6257 25.0493 29.556 29.1227C27.4863 33.1961 26.4083 37.7009 26.41 42.27C26.4008 48.7132 28.5377 54.976 32.4835 60.0698C36.4292 65.1636 41.959 68.7982 48.2 70.4C50.573 71.018 53.017 71.328 55.47 71.32C63.173 71.3121 70.5584 68.2492 76.0062 62.8033C81.454 57.3574 84.5194 49.973 84.53 42.27C84.5523 35.1292 82.7588 28.1 79.3179 21.8428C75.8771 15.5857 70.902 10.306 64.86 6.5C72.7634 8.57837 79.7564 13.2148 84.7475 19.6857C89.7386 26.1566 92.447 34.0979 92.45 42.27C92.4472 47.1297 91.4872 51.9413 89.6247 56.4299C87.7621 60.9186 85.0336 64.9963 81.595 68.4303C78.1563 71.8644 74.0749 74.5873 69.5837 76.4438C65.0926 78.3003 60.2797 79.2538 55.42 79.25Z" fill="#FC5200"/>
    </svg>
  )
}

export function CloudflareBrandIcon({ className }: { className?: string } = {}) {
  return (
    <svg viewBox="0 -70 256 256" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <g transform="translate(0,-1)">
        <path d="M176.332,109.3483 C177.925,104.0373 177.394,98.7263 174.739,95.5393 C172.083,92.3523 168.365,90.2283 163.585,89.6973 L71.17,88.6343 C70.639,88.6343 70.108,88.1033 69.577,88.1033 C69.046,87.5723 69.046,87.0413 69.577,86.5103 C70.108,85.4483 70.639,84.9163 71.701,84.9163 L164.647,83.8543 C175.801,83.3233 187.486,74.2943 191.734,63.6723 L197.046,49.8633 C197.046,49.3313 197.577,48.8003 197.046,48.2693 C191.203,21.1823 166.772,0.9993 138.091,0.9993 C111.535,0.9993 88.697,17.9953 80.73,41.8963 C75.419,38.1783 69.046,36.0533 61.61,36.5853 C48.863,37.6473 38.772,48.2693 37.178,61.0163 C36.647,64.2033 37.178,67.3903 37.71,70.5763 C16.996,71.1073 0,88.1033 0,109.3483 C0,111.4723 0,113.0663 0.531,115.1903 C0.531,116.2533 1.593,116.7843 2.125,116.7843 L172.614,116.7843 C173.676,116.7843 174.739,116.2533 174.739,115.1903 L176.332,109.3483 Z" fill="#F4811F"/>
        <path d="M205.5436,49.8628 L202.8876,49.8628 C202.3566,49.8628 201.8256,50.3938 201.2946,50.9248 L197.5766,63.6718 C195.9836,68.9828 196.5146,74.2948 199.1706,77.4808 C201.8256,80.6678 205.5436,82.7918 210.3236,83.3238 L229.9756,84.3858 C230.5066,84.3858 231.0376,84.9168 231.5686,84.9168 C232.0996,85.4478 232.0996,85.9788 231.5686,86.5098 C231.0376,87.5728 230.5066,88.1038 229.4436,88.1038 L209.2616,89.1658 C198.1076,89.6968 186.4236,98.7258 182.1746,109.3478 L181.1116,114.1288 C180.5806,114.6598 181.1116,115.7218 182.1746,115.7218 L252.2826,115.7218 C253.3446,115.7218 253.8756,115.1908 253.8756,114.1288 C254.9376,109.8798 255.9996,105.0998 255.9996,100.3188 C255.9996,72.7008 233.1616,49.8628 205.5436,49.8628" fill="#FAAD3F"/>
      </g>
    </svg>
  )
}

export function RetellBrandIcon({ className }: { className?: string } = {}) {
  return (
    <svg width="228" height="229" viewBox="0 0 228 229" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M83.5028 228.011C95.2706 228.011 104.81 218.472 104.81 206.704C104.81 194.936 95.2706 185.396 83.5028 185.396C71.735 185.396 62.1953 194.936 62.1953 206.704C62.1953 218.472 71.735 228.011 83.5028 228.011Z" fill="#00122E"/>
      <path d="M144.479 228.012C156.247 228.012 165.787 218.472 165.787 206.704C165.787 194.936 156.247 185.396 144.479 185.396C132.712 185.396 123.172 194.936 123.172 206.704C123.172 218.472 132.712 228.012 144.479 228.012Z" fill="#00122E"/>
      <path d="M83.5028 42.6158C95.2706 42.6158 104.81 33.076 104.81 21.3079C104.81 9.53988 95.2706 0 83.5028 0C71.735 0 62.1953 9.53988 62.1953 21.3079C62.1953 33.076 71.735 42.6158 83.5028 42.6158Z" fill="#00122E"/>
      <path d="M144.479 42.6158C156.247 42.6158 165.787 33.076 165.787 21.3079C165.787 9.53988 156.247 0 144.479 0C132.712 0 123.172 9.53988 123.172 21.3079C123.172 33.076 132.712 42.6158 144.479 42.6158Z" fill="#00122E"/>
      <path d="M21.3075 104.81C33.0753 104.81 42.615 95.2703 42.615 83.5023C42.615 71.7342 33.0753 62.1943 21.3075 62.1943C9.53969 62.1943 0 71.7342 0 83.5023C0 95.2703 9.53969 104.81 21.3075 104.81Z" fill="#00122E"/>
      <path d="M21.3075 165.793C33.0753 165.793 42.615 156.253 42.615 144.485C42.615 132.717 33.0753 123.177 21.3075 123.177C9.53969 123.177 0 132.717 0 144.485C0 156.253 9.53969 165.793 21.3075 165.793Z" fill="#00122E"/>
      <path d="M206.698 104.81C218.466 104.81 228.006 95.2703 228.006 83.5023C228.006 71.7342 218.466 62.1943 206.698 62.1943C194.93 62.1943 185.391 71.7342 185.391 83.5023C185.391 95.2703 194.93 104.81 206.698 104.81Z" fill="#00122E"/>
      <path d="M206.698 165.793C218.466 165.793 228.006 156.253 228.006 144.485C228.006 132.717 218.466 123.177 206.698 123.177C194.93 123.177 185.391 132.717 185.391 144.485C185.391 156.253 194.93 165.793 206.698 165.793Z" fill="#00122E"/>
    </svg>
  )
}

export function PhotonBrandIcon({ className }: { className?: string } = {}) {
  return <img src="/photon-favicon.png" className={className} alt="Photon Health" aria-hidden="true" />
}

export type BrandKey = "loops" | "cursor" | "cloudflare" | "photon" | "retell"

export function getBrandFromPlanName(planName: string): BrandKey | null {
  const lower = planName.toLowerCase().trim()
  if (lower === "loops") return "loops"
  if (lower === "cursor" || lower.includes("ai platform")) return "cursor"
  if (lower.includes("cloudflare") || lower.includes("ai gateway")) return "cloudflare"
  if (lower.includes("photon") || lower.includes("doximity")) return "photon"
  if (lower.includes("retell")) return "retell"
  return null
}

export function BrandIcon({ brand, className }: { brand: BrandKey; className?: string }) {
  switch (brand) {
    case "cursor":
      return <CursorBrandIcon className={className} />
    case "loops":
      return <LoopsBrandIcon className={className} />
    case "cloudflare":
      return <CloudflareBrandIcon className={className} />
    case "photon":
      return <PhotonBrandIcon className={className} />
    case "retell":
      return <RetellBrandIcon className={className} />
  }
}

