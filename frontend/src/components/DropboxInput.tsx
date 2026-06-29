import { useState, useCallback } from 'react'
import { Cloud, Link as LinkIcon, ArrowRight, Check, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

interface DropboxInputProps {
  onSubmit: (url: string) => void
  loading?: boolean
  disabled?: boolean
}

export default function DropboxInput({ onSubmit, loading, disabled }: DropboxInputProps) {
  const [url, setUrl] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) onSubmit(url.trim())
  }, [url, onSubmit])

  const isValid = url.trim().length > 0 && url.includes('dropbox.com')
  const showValidation = url.length > 0

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <div
          className={clsx(
            'relative overflow-hidden rounded-2xl border-2 transition-all duration-300',
            focused ? 'border-accent shadow-lg shadow-accent/20' : 'border-dark-600',
            disabled ? 'opacity-50' : ''
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-purple-500/5 pointer-events-none" />
          <div className="relative flex items-center gap-3 p-2">
            <div className="flex items-center justify-center w-12 h-12 ml-1 rounded-xl bg-accent/10">
              <Cloud className="w-6 h-6 text-accent-light" />
            </div>
            <div className="flex-1">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Paste your Dropbox folder link here..."
                className="w-full bg-transparent text-white placeholder-dark-400 outline-none text-sm"
                disabled={disabled}
              />
            </div>
            {showValidation && (
              <div className="flex items-center gap-2 px-2">
                {isValid ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={!isValid || loading || disabled}
              className={clsx(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all',
                isValid && !loading && !disabled
                  ? 'bg-accent hover:bg-accent-dark text-white shadow-lg shadow-accent/25'
                  : 'bg-dark-600 text-dark-300 cursor-not-allowed'
              )}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-dark-300 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Process
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
        {showValidation && !isValid && (
          <p className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Please enter a valid Dropbox shared link
          </p>
        )}
      </div>
    </form>
  )
}
