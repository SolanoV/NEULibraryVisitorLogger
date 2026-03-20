'use client'

type SearchFilterProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchFilter({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) {
  return (
    <form onSubmit={(e) => e.preventDefault()} className="relative w-full flex items-center">
      <svg className="absolute left-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder || "Search..."} 
        className="w-full pl-10 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow" 
      />
    </form>
  )
}