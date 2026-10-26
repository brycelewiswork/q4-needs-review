/** Two stacked toggles: the icon for customizing a list. Takes the surrounding text color. */
export function CustomizeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M21 17.5C21 19.433 19.433 21 17.5 21C15.567 21 14 19.433 14 17.5C14 15.567 15.567 14 17.5 14C19.433 14 21 15.567 21 17.5Z" />
      <path d="M6.5 14H17.5C19.433 14 21 15.567 21 17.5C21 19.433 19.433 21 17.5 21H6.5C4.567 21 3 19.433 3 17.5C3 15.567 4.567 14 6.5 14Z" />
      <path d="M3 6.5C3 8.433 4.567 10 6.5 10C8.433 10 10 8.433 10 6.5C10 4.567 8.433 3 6.5 3C4.567 3 3 4.567 3 6.5Z" />
      <path d="M17.5 3H6.5C4.567 3 3 4.567 3 6.5C3 8.433 4.567 10 6.5 10H17.5C19.433 10 21 8.433 21 6.5C21 4.567 19.433 3 17.5 3Z" />
    </svg>
  )
}
