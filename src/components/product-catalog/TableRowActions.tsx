'use client'

type TableRowActionsProps = {
  onEdit?: () => void
  onDelete?: () => void
}

export function TableRowActions({ onEdit, onDelete }: TableRowActionsProps) {
  return (
    <div className="flex items-center gap-[4px] opacity-0 group-hover/row:opacity-100 transition-opacity">
      {onEdit && (
        <button
          type="button"
          className="group/edit flex h-[24px] w-[24px] items-center justify-center rounded-[6px] border border-[#D4DEE9] bg-white hover:bg-[#F5F6F8] hover:border-[#B6C0CD] transition-colors"
          aria-label="Edit"
          onClick={(e) => { e.stopPropagation(); onEdit() }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
            <path d="M8.5 1.5L10.5 3.5M1.5 10.5L2 8.5L9 1.5L10.5 3L3.5 10L1.5 10.5Z" stroke="#3C4F69" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="group-hover/edit:stroke-[#1A2C44]"/>
          </svg>
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          className="group/del flex h-[24px] w-[24px] items-center justify-center rounded-[6px] border border-[#D4DEE9] bg-white hover:bg-[#FEF4F6] hover:border-[#FAA9B8] transition-colors"
          aria-label="Delete"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
            <path fillRule="evenodd" clipRule="evenodd" d="M8.99998 3V1.5C8.99998 0.671573 8.3284 0 7.49998 0H4.49998C3.67155 0 2.99998 0.671573 2.99998 1.5V3H0.75C0.335786 3 0 3.33579 0 3.75C0 4.16421 0.335786 4.5 0.75 4.5H1.49998V10C1.49998 11.1046 2.39541 12 3.49998 12H8.49998C9.60454 12 10.5 11.1046 10.5 10V4.5H11.25C11.6642 4.5 12 4.16421 12 3.75C12 3.33579 11.6642 3 11.25 3H8.99998ZM7.49998 1.4H4.49998C4.44475 1.4 4.39998 1.44477 4.39998 1.5V3H7.59998V1.5C7.59998 1.44477 7.5552 1.4 7.49998 1.4ZM9.09998 4.5V10C9.09998 10.3314 8.83135 10.6 8.49998 10.6H3.49998C3.1686 10.6 2.89998 10.3314 2.89998 10V4.5H9.09998Z" fill="#3C4F69" className="group-hover/del:fill-[#E61947]"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M4.62498 5.5C4.97015 5.5 5.24998 5.77982 5.24998 6.125V8.875C5.24998 9.22018 4.97015 9.5 4.62498 9.5C4.2798 9.5 3.99998 9.22018 3.99998 8.875V6.125C3.99998 5.77982 4.2798 5.5 4.62498 5.5Z" fill="#3C4F69" className="group-hover/del:fill-[#E61947]"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M7.37498 5.5C7.72015 5.5 7.99998 5.77982 7.99998 6.125V8.875C7.99998 9.22018 7.72015 9.5 7.37498 9.5C7.0298 9.5 6.74998 9.22018 6.74998 8.875V6.125C6.74998 5.77982 7.0298 5.5 7.37498 5.5Z" fill="#3C4F69" className="group-hover/del:fill-[#E61947]"/>
          </svg>
        </button>
      )}
    </div>
  )
}
