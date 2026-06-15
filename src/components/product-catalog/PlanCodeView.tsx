'use client'

import { useMemo, useState, useEffect, useRef } from "react"
import { type CodeSection, generateStripeCode, type StripeCodeGeneratorInput } from "./StripeCodeGenerator"

type PlanCodeViewProps = {
  t: (key: string) => string
  input?: StripeCodeGeneratorInput
  sections?: CodeSection[]
}

// Simple syntax highlighter for curl/shell commands
function highlightCurlSyntax(line: string, lineIndex: number): React.ReactNode {
  const tokens: React.ReactNode[] = []
  const remaining = line
  let tokenIndex = 0

  // Helper to add a token
  const addToken = (text: string, className: string) => {
    tokens.push(
      <span key={`${lineIndex}-${tokenIndex++}`} className={className}>
        {text}
      </span>
    )
  }

  // Comments
  if (remaining.trimStart().startsWith("#")) {
    return <span className="text-[#6A737D]">{line}</span>
  }

  // Process the line character by character for proper tokenization
  let i = 0
  while (i < remaining.length) {
    // Keywords at start of token
    if (i === 0 || remaining[i - 1] === " " || remaining[i - 1] === "\t") {
      // curl command
      if (remaining.slice(i).startsWith("curl ")) {
        addToken("curl", "text-[#D73A49]")
        i += 4
        continue
      }
    }

    // URLs
    const urlMatch = remaining.slice(i).match(/^https?:\/\/[^\s\\]+/)
    if (urlMatch) {
      addToken(urlMatch[0], "text-[#032F62]")
      i += urlMatch[0].length
      continue
    }

    // Flags (-d, -u, etc.)
    if (remaining[i] === "-" && i + 1 < remaining.length && /[a-zA-Z]/.test(remaining[i + 1]!)) {
      const flagMatch = remaining.slice(i).match(/^-[a-zA-Z]+/)
      if (flagMatch) {
        addToken(flagMatch[0], "text-[#6F42C1]")
        i += flagMatch[0].length
        continue
      }
    }

    // Strings in double quotes
    if (remaining[i] === '"') {
      let end = i + 1
      while (end < remaining.length && remaining[end] !== '"') {
        if (remaining[end] === "\\" && end + 1 < remaining.length) {
          end += 2
        } else {
          end++
        }
      }
      if (end < remaining.length) end++ // Include closing quote
      const str = remaining.slice(i, end)

      // Check for template variables
      if (str.includes("{{") && str.includes("}}")) {
        addToken('"', "text-[#22863A]")
        const inner = str.slice(1, -1)
        const parts = inner.split(/(\{\{[^}]+\}\})/)
        parts.forEach((part) => {
          if (part.startsWith("{{") && part.endsWith("}}")) {
            tokens.push(
              <span key={`${lineIndex}-${tokenIndex++}`} className="text-[#E36209]">
                {part}
              </span>
            )
          } else if (part) {
            tokens.push(
              <span key={`${lineIndex}-${tokenIndex++}`} className="text-[#22863A]">
                {part}
              </span>
            )
          }
        })
        addToken('"', "text-[#22863A]")
      } else {
        addToken(str, "text-[#22863A]")
      }
      i = end
      continue
    }

    // Template variables outside quotes
    if (remaining[i] === "{" && remaining[i + 1] === "{") {
      const varMatch = remaining.slice(i).match(/^\{\{[^}]+\}\}/)
      if (varMatch) {
        addToken(varMatch[0], "text-[#E36209]")
        i += varMatch[0].length
        continue
      }
    }

    // Numbers
    if (/\d/.test(remaining[i]!) && (i === 0 || /[=\s[]/.test(remaining[i - 1]!))) {
      const numMatch = remaining.slice(i).match(/^\d+/)
      if (numMatch) {
        addToken(numMatch[0], "text-[#005CC5]")
        i += numMatch[0].length
        continue
      }
    }

    // Parameter names before =
    if (remaining[i] === "=" && i > 0) {
      // The = itself
      addToken("=", "text-[#24292E]")
      i++
      continue
    }

    // Line continuation
    if (remaining[i] === "\\") {
      addToken("\\", "text-[#6A737D]")
      i++
      continue
    }

    // => result indicator
    if (remaining[i] === "=" && remaining[i + 1] === ">") {
      addToken("=>", "text-[#6A737D]")
      i += 2
      continue
    }

    // Default: regular character
    addToken(remaining[i]!, "text-[#24292E]")
    i++
  }

  return tokens.length > 0 ? tokens : <span>&nbsp;</span>
}

// Compute which lines have changed between old and new code
function computeChangedLines(oldLines: string[], newLines: string[]): Set<number> {
  const changedLineNumbers = new Set<number>()

  // For each line in new code, check if it differs from old code at same position
  // or if it's a new line
  for (let i = 0; i < newLines.length; i++) {
    if (i >= oldLines.length) {
      // New line added
      changedLineNumbers.add(i)
    } else if (oldLines[i] !== newLines[i]) {
      // Line content changed
      changedLineNumbers.add(i)
    }
  }

  return changedLineNumbers
}

// Hook to track changed lines with auto-clear
function useChangedLines(code: string, clearDelayMs: number = 3000): Set<number> {
  const [changedLines, setChangedLines] = useState<Set<number>>(new Set())
  const prevCodeRef = useRef<string>("")
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    // Skip highlighting on first render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      prevCodeRef.current = code
      return
    }

    const oldLines = prevCodeRef.current.split("\n")
    const newLines = code.split("\n")
    const newChangedLines = computeChangedLines(oldLines, newLines)

    // Only update if there are actual changes
    if (newChangedLines.size > 0) {
      setChangedLines(newChangedLines)

      // Clear any existing timeout
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current)
      }

      // Set new timeout to clear highlights
      clearTimeoutRef.current = setTimeout(() => {
        setChangedLines(new Set())
      }, clearDelayMs)
    }

    prevCodeRef.current = code

    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current)
      }
    }
  }, [code, clearDelayMs])

  return changedLines
}

function CopyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M10 14H2.66667C2.29867 14 2 13.7013 2 13.3333V5.99998C2 5.63198 2.29867 5.33331 2.66667 5.33331H10C10.368 5.33331 10.6667 5.63198 10.6667 5.99998V13.3333C10.6667 13.7013 10.368 14 10 14Z" stroke="#474E5A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.0001 3.33333V2.66667C14.0001 2.29867 13.7014 2 13.3334 2H12.6667" stroke="#474E5A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.0001 10V10.6667C14.0001 11.0347 13.7014 11.3333 13.3334 11.3333H12.6667" stroke="#474E5A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.66675 3.33333V2.66667C4.66675 2.29867 4.96541 2 5.33341 2H6.00008" stroke="#474E5A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.66675 2.00002H10.0001" stroke="#474E5A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 7.33333V6" stroke="#474E5A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function PlanCodeView({ t, input, sections: propSections }: PlanCodeViewProps) {
  const sections = useMemo(() => {
    if (propSections) return propSections
    if (input) return generateStripeCode(input)
    return []
  }, [propSections, input])
  const codeContainerRef = useRef<HTMLDivElement>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showCopyTooltip, setShowCopyTooltip] = useState(false)

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return
    const timer = window.setTimeout(() => setToastMessage(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  // Combine all sections into one code block
  const fullCode = useMemo(() => {
    return sections.map(section => {
      const header = section.description
        ? `# ${section.title}\n# ${section.description}\n`
        : `# ${section.title}\n`
      return header + section.code
    }).join("\n\n")
  }, [sections])

  const lines = useMemo(() => fullCode.split("\n"), [fullCode])
  const changedLines = useChangedLines(fullCode, 3000)

  // Auto-scroll to first changed line when there are changes
  useEffect(() => {
    if (changedLines.size > 0 && codeContainerRef.current) {
      const firstChangedLine = Math.min(...Array.from(changedLines))
      const lineHeight = 18 // matches leading-[18px]
      const targetScroll = Math.max(0, firstChangedLine * lineHeight - 100)
      codeContainerRef.current.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      })
    }
  }, [changedLines])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(fullCode)
      setToastMessage(`Copied ${lines.length} lines of code`)
    } catch {
      setToastMessage("Failed to copy code")
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#F5F6F8]">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#EBEEF1] bg-[#F5F6F8] px-4 py-[6px]">
        <span className="text-[11px] text-[#586069]">
          {t("A live, auto-updating view of the Stripe API objects being created behind the scenes.")}
        </span>
        <div className="relative">
          <button
            type="button"
            className="flex h-[20px] w-[20px] items-center justify-center rounded-[4px] transition-colors hover:bg-[#EBEEF1]"
            onClick={handleCopyCode}
            onMouseEnter={() => setShowCopyTooltip(true)}
            onMouseLeave={() => setShowCopyTooltip(false)}
            aria-label={t("Copy code")}
          >
            <CopyIcon />
          </button>
          {showCopyTooltip && (
            <div className="absolute right-0 top-full mt-1 z-10 whitespace-nowrap rounded-[6px] bg-[#353A44] px-[8px] py-[6px] text-[11px] font-[500] leading-[14px] text-white shadow-lg">
              {t("Copy code")}
            </div>
          )}
        </div>
      </div>

      {/* Code area */}
      <div
        ref={codeContainerRef}
        className="flex flex-1 overflow-auto font-mono text-[12px]"
      >
        {/* Line numbers */}
        <div className="sticky left-0 flex-shrink-0 select-none border-r border-[#EBEEF1] bg-[#F5F6F8] text-right text-[12px] leading-[18px] text-[#BABBBD]">
          {lines.map((_, i) => (
            <div
              key={i}
              className={`px-3 py-0 ${changedLines.has(i) ? 'bg-[#E0D9FB] text-[#5746AF]' : ''}`}
              style={{ transition: 'background-color 0.3s ease' }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code content */}
        <div className="flex-1 overflow-x-auto whitespace-pre bg-[#F5F6F8]">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`leading-[18px] px-4 ${changedLines.has(i) ? 'bg-[#E0D9FB]' : ''}`}
              style={{ transition: 'background-color 0.3s ease' }}
            >
              {highlightCurlSyntax(line, i)}
            </div>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-[#EBEEF1] bg-[#F5F6F8] px-4 py-2">
        <span className="text-[11px] text-[#586069]">
          {sections.length} {sections.length === 1 ? "section" : "sections"} · {lines.length} lines
        </span>
        <span className="text-[11px] text-[#586069]">
          Stripe API v2024-12-18.acacia
        </span>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-4 left-4 z-[1002] rounded-[10px] border border-[#EBEEF1] bg-white px-3 py-2 text-[12px] font-[500] text-[#353A44] shadow-[0_15px_35px_rgba(48,49,61,0.08),0_5px_15px_rgba(0,0,0,0.12)]">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
